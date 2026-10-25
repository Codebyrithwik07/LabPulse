
import express from 'express';
import cors from 'cors';
import { authenticateUser } from './middlewares/auth.middleware.js';
import { errorHandler, AppError } from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';

// Polyfill BigInt serialization for raw PostgreSQL queries
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const app = express();

// Health-check route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'LabPulse API is running',
    status: 'healthy',
  });
});

// Standard middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach authenticated user identity from request headers or default
app.use(authenticateUser);

// Mount API routes
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch-all 404 handler for undefined API routes
app.use('*', (req, res, next) => {
  next(
    new AppError(
      `API endpoint '${req.originalUrl}' not found on LabPulse server`,
      404
    )
  );
});

// Centralized error handler
app.use(errorHandler);

export default app;
