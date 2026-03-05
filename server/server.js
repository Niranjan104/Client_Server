const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // allows us to parse incoming JSON bodies for orders

const VERSION = process.env.APP_VERSION || "dev";

// Tea Stall Menu Database (Mock)
const menuItems = [
  { id: 1, name: "Special Masala Chai", price: 20, description: "Authentic Indian spiced tea", inStock: true },
  { id: 2, name: "Ginger Tea (Adrak Wali)", price: 15, description: "Fresh ginger brewed to perfection", inStock: true },
  { id: 3, name: "Cardamom Tea (Elaichi)", price: 15, description: "Refreshing cardamom flavored tea", inStock: true },
  { id: 4, name: "Lemon Iced Tea", price: 30, description: "Chilled tea with fresh lemon slices", inStock: true },
  { id: 5, name: "Black Coffee", price: 25, description: "Strong roasted dark coffee", inStock: false },
  { id: 6, name: "Samosa (2 pcs)", price: 30, description: "Crispy potato-filled pastry snack", inStock: true },
];

let orderLogs = []; // In-memory database for orders

console.log("Tea Stall Server Started - Serving Version: " + VERSION);

// Basic root route so the health probe/users don't see "Cannot GET /"
app.get("/", (req, res) => {
  res.send(`<h1>Niranjan's Tea Stall API</h1><p>Backend is running. Version: ${VERSION}</p>`);
});

// ==========================================
// API ROUTES 
// ==========================================

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", version: VERSION });
});

// Endpoint to prove Blue/Green deployment
apiRouter.get("/version", (req, res) => {
  res.json({ version: VERSION });
});

// Endpoint to fetch the Menu
apiRouter.get("/menu", (req, res) => {
  res.json(menuItems);
});

// Endpoint to submit a Cart (creates unpaid order)
apiRouter.post("/order", (req, res) => {
  const { cart, customerName } = req.body;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Cart cannot be empty" });
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const cartItem of cart) {
    const item = menuItems.find(m => m.id === cartItem.itemId);
    if (!item) continue;

    const qty = parseInt(cartItem.quantity, 10);
    totalAmount += item.price * qty;

    orderItems.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
      subtotal: item.price * qty
    });
  }

  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  const newOrder = {
    orderId,
    customerName: customerName || "Guest",
    items: orderItems,
    totalAmount,
    status: "Unpaid",
    timestamp: new Date().toISOString()
  };

  orderLogs.push(newOrder);

  // Simulate slight network delay
  setTimeout(() => {
    res.status(201).json({
      message: "Please complete payment to finalize your order.",
      orderId: newOrder.orderId,
      totalAmount: newOrder.totalAmount
    });
  }, 500);
});

// Endpoint for client to poll payment status
apiRouter.post("/check-payment", (req, res) => {
  const { orderId } = req.body;
  const orderIndex = orderLogs.findIndex(o => o.orderId === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = orderLogs[orderIndex];
  if (order.status === "Paid") {
    return res.status(200).json({ status: "Paid", bill: order });
  } else {
    return res.status(200).json({ status: "Unpaid" });
  }
});

// Endpoint for Admin to manually approve a payment
apiRouter.post("/admin/approve-payment", (req, res) => {
  const { orderId } = req.body;
  const orderIndex = orderLogs.findIndex(o => o.orderId === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  orderLogs[orderIndex].status = "Paid";
  orderLogs[orderIndex].paidAt = new Date().toISOString();

  res.status(200).json({ success: true, message: `Payment approved for ${orderId}` });
});

// Endpoint to view all stored orders in the backend memory
apiRouter.get("/orders", (req, res) => {
  // Sort by newest first
  const sortedLogs = [...orderLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sortedLogs);
});

// Register the API Router
app.use("/api", apiRouter);

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (Version: ${VERSION})`);
  });
}

module.exports = app;
