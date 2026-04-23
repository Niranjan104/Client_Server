const { randomUUID } = require("node:crypto");
const express = require("express");
const cors = require("cors");

const {
  register,
  setApplicationInfo,
  setUnpaidOrders,
  startHttpRequestTimer,
  recordOrderCreated,
  recordPaymentCheck,
  recordPaymentApproval,
  recordOrderValidationFailure
} = require("./metrics");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

const VERSION = process.env.APP_VERSION || "dev";
const BUILD_SHA = process.env.APP_BUILD_SHA || "";
const MAX_ORDER_LOGS = parseInteger(process.env.MAX_ORDER_LOGS, 500, 1);
const ORDER_RESPONSE_DELAY_MS = parseInteger(
  process.env.ORDER_RESPONSE_DELAY_MS,
  process.env.NODE_ENV === "test" ? 0 : 500,
  0
);

setApplicationInfo(VERSION);
setUnpaidOrders(VERSION, 0);

app.use((req, res, next) => {
  const stopTimer = startHttpRequestTimer(req, VERSION);
  res.on("finish", () => stopTimer(res));
  next();
});

// Tea Stall Menu Database (Mock)
const menuItems = [
  { id: 1, name: "Special Masala Chai", price: 20, description: "Authentic Indian spiced tea", inStock: true },
  { id: 2, name: "Ginger Tea (Adrak Wali)", price: 15, description: "Fresh ginger brewed to perfection", inStock: true },
  { id: 3, name: "Cardamom Tea (Elaichi)", price: 15, description: "Refreshing cardamom flavored tea", inStock: true },
  { id: 4, name: "Lemon Iced Tea", price: 30, description: "Chilled tea with fresh lemon slices", inStock: true },
  { id: 5, name: "Black Coffee", price: 25, description: "Strong roasted dark coffee", inStock: false },
  { id: 6, name: "Samosa (2 pcs)", price: 30, description: "Crispy potato-filled pastry snack", inStock: true }
];

let orderLogs = [];

console.log("Tea Stall Server Started - Serving Version: " + VERSION);

app.locals.resetState = () => {
  orderLogs = [];
  syncUnpaidOrderMetric();
};
app.locals.metricsRegistry = register;

// Basic root route so the health probe/users don't see "Cannot GET /"
app.get("/", (req, res) => {
  res.send(`<h1>Niranjan's Tea Stall API</h1><p>Backend is running. Version: ${VERSION}</p>`);
});

app.get("/metrics", async (req, res, next) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
});

// ==========================================
// API ROUTES
// ==========================================

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", version: VERSION });
});

apiRouter.get("/version", (req, res) => {
  const slot = getDeploymentSlot(VERSION);

  res.json({
    version: VERSION,
    slot,
    displayVersion: slot.toUpperCase(),
    build: BUILD_SHA || null
  });
});

apiRouter.get("/menu", (req, res) => {
  res.json(menuItems);
});

apiRouter.post("/order", (req, res) => {
  const { cart, customerName } = req.body;

  if (!Array.isArray(cart) || cart.length === 0) {
    recordOrderValidationFailure(VERSION);
    return res.status(400).json({ error: "Cart cannot be empty" });
  }

  const parsedOrder = parseCart(cart);
  if (parsedOrder.error) {
    recordOrderValidationFailure(VERSION);
    return res.status(400).json({ error: parsedOrder.error });
  }

  const newOrder = {
    orderId: `ORD-${randomUUID().split("-")[0].toUpperCase()}`,
    customerName: normalizeCustomerName(customerName),
    items: parsedOrder.items,
    totalAmount: parsedOrder.totalAmount,
    status: "Unpaid",
    version: VERSION,
    timestamp: new Date().toISOString()
  };

  orderLogs.push(newOrder);
  trimOrderLogs();
  recordOrderCreated(VERSION, newOrder.items.length, newOrder.totalAmount);
  syncUnpaidOrderMetric();

  setTimeout(() => {
    res.status(201).json({
      message: "Please complete payment to finalize your order.",
      orderId: newOrder.orderId,
      totalAmount: newOrder.totalAmount
    });
  }, ORDER_RESPONSE_DELAY_MS);
});

apiRouter.post("/check-payment", (req, res) => {
  const { orderId } = req.body;

  if (!isValidOrderId(orderId)) {
    return res.status(400).json({ error: "A valid orderId is required" });
  }

  recordPaymentCheck(VERSION);
  const orderIndex = orderLogs.findIndex((order) => order.orderId === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = orderLogs[orderIndex];
  if (order.status === "Paid") {
    return res.status(200).json({ status: "Paid", bill: order });
  }

  return res.status(200).json({ status: "Unpaid" });
});

apiRouter.post("/admin/approve-payment", (req, res) => {
  const { orderId } = req.body;

  if (!isValidOrderId(orderId)) {
    return res.status(400).json({ error: "A valid orderId is required" });
  }

  const orderIndex = orderLogs.findIndex((order) => order.orderId === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (orderLogs[orderIndex].status === "Paid") {
    return res.status(200).json({ success: true, message: `Payment already approved for ${orderId}` });
  }

  orderLogs[orderIndex].status = "Paid";
  orderLogs[orderIndex].paidAt = new Date().toISOString();

  recordPaymentApproval(VERSION);
  syncUnpaidOrderMetric();

  return res.status(200).json({ success: true, message: `Payment approved for ${orderId}` });
});

apiRouter.get("/orders", (req, res) => {
  const sortedLogs = [...orderLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sortedLogs);
});

apiRouter.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use("/api", apiRouter);

app.use((err, req, res, next) => {
  void req;
  void next;

  const statusCode = Number.isInteger(err?.status) ? err.status : (
    err?.type === "entity.parse.failed" ? 400 : 500
  );

  if (statusCode >= 500) {
    console.error("Unhandled server error", err);
  }

  res.status(statusCode).json({
    error: statusCode === 400 ? "Invalid JSON payload." : "Internal server error."
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (Version: ${VERSION})`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down HTTP server...`);

    const forceExitTimer = setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);

    forceExitTimer.unref();

    server.close((error) => {
      clearTimeout(forceExitTimer);

      if (error) {
        console.error("Error while shutting down server", error);
        process.exit(1);
      }

      console.log("HTTP server stopped cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = app;

function parseInteger(value, fallback, minimum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
}

function normalizeCustomerName(customerName) {
  if (typeof customerName !== "string") {
    return "Guest";
  }

  const normalizedName = customerName.trim();
  return normalizedName.length > 0 ? normalizedName.slice(0, 64) : "Guest";
}

function parseCart(cart) {
  const items = [];
  let totalAmount = 0;

  for (const cartItem of cart) {
    const itemId = Number.parseInt(String(cartItem?.itemId), 10);
    const quantity = Number.parseInt(String(cartItem?.quantity), 10);

    if (!Number.isInteger(itemId) || !Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Each cart item must include a valid itemId and a positive quantity." };
    }

    const item = menuItems.find((menuItem) => menuItem.id === itemId);
    if (!item) {
      return { error: `Menu item ${itemId} does not exist.` };
    }

    if (!item.inStock) {
      return { error: `${item.name} is currently out of stock.` };
    }

    const subtotal = item.price * quantity;
    totalAmount += subtotal;

    items.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      subtotal
    });
  }

  if (items.length === 0) {
    return { error: "Cart contains no valid items." };
  }

  return { items, totalAmount };
}

function isValidOrderId(orderId) {
  return typeof orderId === "string" && orderId.trim().length > 0;
}

function trimOrderLogs() {
  if (orderLogs.length > MAX_ORDER_LOGS) {
    orderLogs = orderLogs.slice(-MAX_ORDER_LOGS);
  }
}

function syncUnpaidOrderMetric() {
  const unpaidOrderCount = orderLogs.filter((order) => order.status !== "Paid").length;
  setUnpaidOrders(VERSION, unpaidOrderCount);
}

function getDeploymentSlot(version) {
  const normalizedVersion = String(version || "unknown").trim().toLowerCase();

  if (normalizedVersion.startsWith("blue")) {
    return "blue";
  }

  if (normalizedVersion.startsWith("green")) {
    return "green";
  }

  return normalizedVersion || "unknown";
}
