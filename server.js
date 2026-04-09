const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// 🔥 MONGO URL
const MONGO_URL = "mongodb+srv://zuli:zuli7300@cluster0.5w30xxk.mongodb.net/zuli?retryWrites=true&w=majority";

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => {
    console.log("DB Error ❌:", err);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

// 📦 ORDER MODEL
const Order = mongoose.models.Order || mongoose.model("Order", {
  name: String,
  qty: Number,

  items: Array,
  subtotal: Number,
  deliveryCharge: Number,
  total: Number,

  customerName: String,
  phone: String,
  address: String,

  discountApplied: Boolean,
  discountAmount: Number,

  status: {
    type: String,
    default: "Pending"
  }
});

// 🧾 CREATE ORDER
app.post("/order", async (req, res) => {
  try {
    
    const {
      name,
      qty,
      items,
      subtotal,
      deliveryCharge,
      total,
      customerName,
      phone,
      address
    } = req.body;

    if (!customerName || !phone || !address) {
      return res.status(400).json({ message: "Missing details ❌" });
    }

    // 🔥 CHECK FIRST ORDER
    const cleanPhone = phone.replace(/\D/g, ""); // sirf numbers

    const existingOrder = await Order.findOne({
    phone: new RegExp(cleanPhone + "$")
});

    let discount = 0;

    if (!existingOrder) {
      discount = total * 0.10;
    }

    const finalTotal = total - discount;

    const newOrder = new Order({
      name,
      qty,
      items,
      subtotal: subtotal || 0,
      deliveryCharge: deliveryCharge || 0,
      total: finalTotal,
      customerName,
      phone: cleanPhone,
      address,
      discountApplied: discount > 0,
      discountAmount: discount
    });

    await newOrder.save();

    res.json({
      success: true,
      orderId: newOrder._id,
      discount: discount
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Order error ❌" });
  }
});

// 🔥 TRACK ORDER (FIXED)
app.get("/track/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found ❌"
      });
    }

    res.json({
  success: true,
  status: order.status,
  name: order.name,
  qty: order.qty,
  subtotal: order.subtotal,
  deliveryCharge: order.deliveryCharge,
  total: order.total,
  customerName: order.customerName
});

  } catch (error) {
    res.json({
      success: false,
      message: "Invalid Order ID ❌"
    });
  }
});

// 📦 GET ALL ORDERS (ADMIN)
app.get("/orders", async (req, res) => {
  try {
    const phone = req.query.phone;

    let orders;

    if(phone){
      orders = await Order.find({ phone }).sort({ _id: -1 });
    } else {
      orders = await Order.find().sort({ _id: -1 });
    }

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// ❌ DELETE ORDER (FIXED)
app.delete("/order/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted ❌" });
  } catch (error) {
    res.status(500).json({ message: "Delete error" });
  }
});

// 🔄 UPDATE ORDER STATUS (VERY IMPORTANT)
app.put("/order/:id", async (req, res) => {
  try {
    const { status } = req.body;

    await Order.findByIdAndUpdate(req.params.id, {
      status: status || "Pending"
    });

    res.json({ message: "Status updated ✅" });

  } catch (error) {
    res.status(500).json({ message: "Update error ❌" });
  }
});

// 🧪 TEST ROUTE
app.get("/", (req, res) => {
  res.send("ZULI Backend Running 🚀");
});

// 🚀 SERVER START
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});