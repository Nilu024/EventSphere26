import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import { sanitize } from './middlewares/sanitizeMiddleware.js';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { notFoundHandler, errorHandler } from './middlewares/errorMiddleware.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

// Swagger UI needs inline scripts, so it is mounted before the strict global Helmet policy with its own relaxed one.
if (env.ENABLE_SWAGGER) {
  app.use('/api-docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
}

app.use(helmet());
app.use(cors(corsOptions));
if (!env.isTest) app.use(requestLogger);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());
app.use(sanitize);

app.get('/health', (_req, res) => res.json({ success: true, message: 'EventSphere API is healthy', uptime: process.uptime() }));
app.use('/api/v1', apiLimiter, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
