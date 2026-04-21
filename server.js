require("dotenv").config();
console.log("🔥 NEW SERVER CODE RUNNING");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// 🔥 MONGO URL
const MONGO_URL = process.env.MONGO_URI;

if (!MONGO_URL) {
  console.log("❌ MONGO_URI missing");
  process.exit(1);
}

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => {
    console.log("DB Error ❌:", err);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());





// 📦 ORDER MODEL
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },

  items: Array,

  subtotal: Number,
  deliveryCharge: Number,
  total: Number,

  customerName: String,
  phone: String,
  address: String,
  landmark: String,
  city: String,
  pincode: String,

  discountApplied: Boolean,
  discountAmount: Number,

  status: {
    type: String,
    default: "Pending"
  }

}, { timestamps: true }); // 🔥 THIS IS THE MAGIC

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);


// 🔍 CHECK FIRST ORDER API (ADD THIS)
app.get("/check-first-order/:phone", async (req, res) => {
  try {
    const cleanPhone = req.params.phone.replace(/\D/g, "");

    const existingOrder = await Order.findOne({ phone: cleanPhone });

    if (existingOrder) {
      res.json({ firstOrder: false });
    } else {
      res.json({ firstOrder: true });
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error ❌" });
  }
});

// 🧾 CREATE ORDER
app.post("/order", async (req, res) => {
  try {
    
   const {
  orderId,   // 🔥 ADD THIS
  items,
  subtotal,
  deliveryCharge,
  total,
  customerName,
  phone,
  address,
  landmark,
  city,
  pincode
} = req.body;

    if (!items || items.length === 0) {
  return res.status(400).json({ message: "No items ❌" });
}

    if (!customerName || !phone || !address){
      return res.status(400).json({ message: "Missing details ❌" });
    }

    // 🔥 CHECK FIRST ORDER
const cleanPhone = phone.replace(/\D/g, ""); // sirf numbers

// ✅ ADD THIS
if(cleanPhone.length !== 10){
  return res.status(400).json({ message: "Invalid phone ❌" });
}

const existingOrder = await Order.findOne({
  phone: cleanPhone
});

    // 🔥 FINAL TOTAL (frontend already calculated)
// 🔥 DISCOUNT + FINAL TOTAL (single clean logic)
let discount = 0;
let finalTotal = total;

if (!existingOrder) {
  discount = Math.round((subtotal + deliveryCharge) * 0.10);
  finalTotal = total - discount;
}

   const finalOrderId = 
  "ZULI-" + Date.now() + "-" + Math.floor(100 + Math.random()*900);

const newOrder = new Order({
  orderId: finalOrderId,  

  items,
  subtotal: subtotal || 0,
  deliveryCharge: deliveryCharge || 0,
  total: finalTotal,

  customerName,
  phone: cleanPhone,
  address,
  landmark,
  city,
  pincode,

  discountApplied: discount > 0,
  discountAmount: discount
});

    await newOrder.save();

    res.json({
  success: true,
  orderId: finalOrderId,
  discount: discount,
  finalTotal: finalTotal   // 🔥 add this
});

  } catch (error) {
    console.log(error);
    
    if(error.code === 11000){
  return res.status(400).json({ message: "Duplicate order ID ❌" });
}

res.status(500).json({ message: "Order error ❌" });
  }
});


app.get("/orders-by-phone/:phone", async (req, res) => {
  try {
    const cleanPhone = req.params.phone.replace(/\D/g, "");

    const orders = await Order.find({ phone: cleanPhone })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders: orders
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders ❌"
    });
  }
});

// 🔥 TRACK ORDER (FIXED)
app.get("/track/:id", async (req, res) => {

  try {
    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found ❌"
      });
    }

    res.json({
  success: true,

  orderId: order.orderId,        // 🔥 ADD THIS
  createdAt: order.createdAt,    // 🔥 ADD THIS

  status: order.status,
  items: order.items,

  subtotal: order.subtotal,
  deliveryCharge: order.deliveryCharge,
  total: order.total,

  customerName: order.customerName,
  phone: order.phone,
  address: order.address,
  landmark: order.landmark,
  city: order.city,
  pincode: order.pincode
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

app.get("/order", async (req, res) => {
  const { phone, orderId } = req.query;

  try {

    if(!phone || !orderId){
      return res.json([]);
    }

    const cleanPhone = phone.replace(/\D/g, "");

    const order = await Order.findOne({
      phone: cleanPhone,
      orderId: orderId
    });

    if(!order){
      return res.json([]);
    }

    res.json([order]);

  } catch (err) {
    res.status(500).json({ message: "Server error ❌" });
  }
});