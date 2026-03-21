const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// 🔥 MONGO URL
const MONGO_URL = "mongodb+srv://zuli:zuli7300@cluster0.5w30xxk.mongodb.net/?retryWrites=true&w=majority";

// 🔥 CONNECT DB
mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("DB Error:", err));

app.use(cors());
app.use(express.json());
const Order = mongoose.model("Order", {
  name: String,
  qty: Number,
  total: Number,

  customerName: String,
  phone: String,
  address: String,

  status: {
    type: String,
    default: "Pending"
  }
});
// 🧾 CREATE ORDER
app.post("/order", async (req, res) => {
  try {
    const orderData = req.body;

    const newOrder = new Order(orderData);
    await newOrder.save();

    console.log("📦 Saved to DB:", newOrder);

    res.json({ message: "Order saved in database ✅" });

  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Error saving order" });
  }
});
// 🧾 ORDER API
// ✅ UPDATE STATUS
app.put("/order/:id", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, {
      status: "Delivered"
    });

    res.json({ message: "Marked as Delivered ✅" });
  } catch (error) {
    res.status(500).json({ message: "Update error" });
  }
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("ZULI Backend Running 🚀");
});

// 📦 GET ALL ORDERS
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ _id: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});
// ❌ DELETE ORDER
app.delete("/order/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted ❌" });
  } catch (error) {
    res.status(500).json({ message: "Delete error" });
  }
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});