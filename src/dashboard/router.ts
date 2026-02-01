import { Router } from 'express';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import basicAuth from 'basic-auth';
import rolesRouter from './routes/roles';
import permissionsRouter from './routes/permissions';
import usersRouter from './routes/users';
import { Authzkit } from '../classes/Authzkit';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface DashboardOptions {
  /**
   * Authzkit instance to use. If not provided, uses the singleton.
   */
  authzkit?: Authzkit;
  /**
   * Secret password for Basic Auth.
   * If not provided, checks AUTHZKIT_DASHBOARD_SECRET env var.
   * If neither is present, dashboard will not be accessible (returns 500 configuration error or 401).
   */
  secret?: string;
  /**
   * Usersname for Basic Auth. Defaults to 'admin'.
   */
  username?: string;
  /**
   * Secret used to sign JWTs for dashboard API access.
   * If not provided, checks AUTHZKIT_DASHBOARD_JWT_SECRET env var, then falls back to `secret`.
   */
  jwtSecret?: string;
  /**
   * JWT expiry (e.g. "1h", "15m", "7d"). Defaults to AUTHZKIT_DASHBOARD_JWT_EXPIRES_IN or "1h".
   */
  jwtExpiresIn?: string;
}

export function createDashboardRouter(options: DashboardOptions = {}): Router {
  const router = Router();
  const username = options.username || process.env.AUTHZKIT_DASHBOARD_USERNAME || 'admin';
  const secret = options.secret || process.env.AUTHZKIT_DASHBOARD_SECRET;
  const jwtSecret = options.jwtSecret || process.env.AUTHZKIT_DASHBOARD_JWT_SECRET || secret;
  const jwtExpiresIn =
    (options.jwtExpiresIn ||
      process.env.AUTHZKIT_DASHBOARD_JWT_EXPIRES_IN ||
      '1h') as SignOptions['expiresIn'];

  router.use(express.json());

  // Trailing slash redirection for proper relative path resolution in frontend
  router.use((req, res, next) => {
    if (req.path === '/' && !req.originalUrl.endsWith('/')) {
      return res.redirect(req.originalUrl + '/');
    }
    next();
  });

  // Basic Authentication Middleware (UI + token endpoint only)
  router.use((req, res, next) => {
    const isApiRequest = req.path.startsWith('/api/');
    const isTokenRequest = req.path === '/api/auth/token';
    if (isApiRequest && !isTokenRequest) return next();

    if (!secret) {
      console.warn('Authzkit Dashboard: No secret provided. Dashboard is disabled.');
      return res.status(500).send('Dashboard configuration error: No secret provided.');
    }

    const user = basicAuth(req);
    if (!user || user.name !== username || user.pass !== secret) {
      res.set('WWW-Authenticate', 'Basic realm="Authzkit Dashboard"');
      return res.status(401).send('Authentication required.');
    }
    next();
  });

  router.post('/api/auth/token', (req, res) => {
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT secret not configured.' });
    }

    const token = jwt.sign({ sub: username }, jwtSecret as string, { expiresIn: jwtExpiresIn });
    res.json({ token, expiresIn: jwtExpiresIn });
  });

  const requireJwt = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT secret not configured.' });
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization bearer token.' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    try {
      jwt.verify(token, jwtSecret as string);
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  };

  // API Routes
  router.use('/api', requireJwt);
  router.use('/api/roles', rolesRouter);
  router.use('/api/permissions', permissionsRouter);
  router.use('/api/users', usersRouter);

  // Static Assets
  // In src environment: ./web/dist (relative to this file)
  const staticPath = path.join(__dirname, 'web/dist');

  // In dist environment, this file is in dist/src/dashboard/router.js
  // And web assets are in dist/src/dashboard/web/dist (copied by build script)
  // So relative path is still 'web/dist'

  // Check if dist exists (maybe we are in dev and it hasn't been built yet, or path is wrong)
  if (!fs.existsSync(staticPath)) {
    console.warn(
      `Authzkit Dashboard: Static assets not found at ${staticPath}. Did you run 'pnpm build:web'?`
    );
  }

  router.use(express.static(staticPath));

  return router;
}
