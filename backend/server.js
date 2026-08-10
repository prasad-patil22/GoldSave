import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';

// Load routes
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import goldRateRoutes from './routes/goldRateRoutes.js';

dotenv.config();

// Establish MongoDB connection
await connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically (fallback for local file uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Seeding Default Admin Account
const seedDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      // The pre-save hook in Admin model will encrypt this password using bcrypt
      await Admin.create({
        name: 'Ganesh Jewellers Admin',
        email: 'admin@gmail.com',
        password: 'admin@123',
        role: 'admin'
      });
      console.log('Seeded default administrator: admin@gmail.com / admin@123');
    }
  } catch (error) {
    console.error('Error seeding administrator account:', error.message);
  }
};
seedDefaultAdmin();



// API Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/gold-rates', goldRateRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Ganesh Jewellers Save Gold Ledger API is running.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
