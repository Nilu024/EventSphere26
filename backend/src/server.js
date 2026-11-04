import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/index.js';
import { recoverSessions, startQueueCleaner } from './services/networkingService.js';

async function start() {
  await connectDB();
  const server = http.createServer(app);
  const io = initSockets(server);
  const recovered = await recoverSessions();
  if (recovered) logger.info(`Recovered ${recovered} open networking session(s)`);
  const stopCleaner = startQueueCleaner();

  server.listen(env.PORT, () => logger.info(`EventSphere API listening on :${env.PORT} (${env.NODE_ENV})`));

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    stopCleaner();
    io.close();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => logger.error(`Unhandled rejection: ${reason?.stack || reason}`));

start().catch((err) => {
  logger.error(`Startup failure: ${err.message}`);
  console.error(err.message);
  process.exit(1);
});
