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

console.log("Tea Stall Server Started - Serving Version: " + VERSION);

// ==========================================
// API ROUTES 
// (Nginx strips /api, so we just declare them at the root, 
// OR Nginx passes them through. Based on typical setups, let's explicitly mount them at /api to make it foolproof without altering Nginx)
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

// Endpoint to submit an Order
apiRouter.post("/order", (req, res) => {
  const { itemId, quantity, customerName } = req.body;

  if (!itemId || !quantity) {
    return res.status(400).json({ error: "Item ID and Quantity are required" });
  }

  // Simulate order processing delay
  setTimeout(() => {
    res.status(201).json({
      message: `Success! Order placed for ${customerName || 'Guest'}.`,
      orderId: Math.floor(Math.random() * 10000),
      serverVersion: VERSION,
      status: "preparing"
    });
  }, 800);
});

// Register the API Router
app.use("/api", apiRouter);

if (require.main === module) {
  app.listen(5000, () => {
    console.log(`Server running on port 5000 (Version: ${VERSION})`);
  });
}

module.exports = app;
