// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import faRoutes from "./routes/faRoutes.js";
import aaRoutes from "./routes/aaRoutes.js";
import hodRoutes from "./routes/hodRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTE MOUNTING ---
app.use("/api/fa", faRoutes);
app.use("/api/aa", aaRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.json({ status: "Academic Analytics Backend running ✅" });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
