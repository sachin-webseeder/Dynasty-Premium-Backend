// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'DYNASTY PREMIUM BACKEND LIVE - ES6 READY' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} | ${new Date().toLocaleString('en-IN')}`);
});