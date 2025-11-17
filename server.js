// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js'; 
import customerRoutes from "./routes/customerRoutes.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve uploaded images (local multer)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect DB
connectDB();

// ROUTES 
app.use('/api/auth', authRoutes);         
app.use('/api/products', productRoutes);  
app.use("/api/customer", customerRoutes);

// Test Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'DYNASTY PREMIUM BACKEND LIVE', 
    status: 'PHASE 1 (AUTH) + PHASE 3 (PRODUCTS) = 100% READY',
    time: new Date().toLocaleString('en-IN')
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Images: http://localhost:${PORT}/uploads`);
});