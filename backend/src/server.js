import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('[LabPulse] PostgreSQL database connection established.');

    const server = app.listen(PORT, () => {
      console.log(`[LabPulse] Backend server active and listening on http://localhost:${PORT}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`[LabPulse] Received ${signal}. Closing server and database connections...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('[LabPulse] Graceful shutdown completed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('[LabPulse] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
