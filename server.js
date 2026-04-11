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
const orderSchema = new mongoose.Schema({

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
// 🧾 CREATE ORDER
app.post("/order", async (req, res) => {
  try {
    
   const {
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

    if (!customerName || !phone || !address || !city || !pincode){
      return res.status(400).json({ message: "Missing details ❌" });
    }

    // 🔥 CHECK FIRST ORDER
const cleanPhone = phone.replace(/\D/g, ""); // sirf numbers

// ✅ ADD THIS
if(cleanPhone.length !== 10){
  return res.status(400).json({ message: "Invalid phone ❌" });
}

const existingOrder = await Order.findOne({
  phone: new RegExp(cleanPhone + "$")
});

    let discount = 0;

    if (!existingOrder) {
      discount = Math.round(total * 0.10);
    }

    const finalTotal = total - discount;

   const newOrder = new Order({
  items, // ✅ REAL DATA

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
  items: order.items, // ✅ correct

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