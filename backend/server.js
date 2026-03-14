import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

dotenv.config();
const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for parsing JSON bodies from requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);

// Database Sync & Server Start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');
    
    // sync({ force: false }) ensures we don't delete our test user data every restart
    await sequelize.sync({ force: false }); 
    
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
}

startServer();