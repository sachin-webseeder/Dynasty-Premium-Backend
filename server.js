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
import categoryRoutes from "./routes/categoryRoutes.js";
dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// CORS CONFIGURATION

const corsOptions = {
  origin: [
    'http://localhost:3000',     // React default
    'http://localhost:5173',     // Vite default
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    `https://dynasty2025.netlify.app/`
   
    
  ],
  credentials: true,             
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect DB
connectDB();

// ROUTES 
app.use('/api/auth', authRoutes);         
app.use("/api/customer", customerRoutes);
app.use('/api/products', productRoutes);  
app.use("/api/categories", categoryRoutes);

// Test Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'DYNASTY PREMIUM BACKEND LIVE', 
    status: 'running',
    time: new Date().toLocaleString('en-IN')
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Images: http://localhost:${PORT}/uploads`);
});