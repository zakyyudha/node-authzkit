import { Request, Response, NextFunction } from 'express';
import { Authzkit } from '../classes/Authzkit';
import { Authorizable } from '../interfaces/Authorizable';

// Extend the Express Request type to include a user property
declare module 'express' {
  interface Request {
    user?: Authorizable;
  }
}

/**
 * Express middleware for role-based or permission-based authorization.
 * Expects `req.user` to be an object conforming to `Authorizable` interface.
 *
 * @param requiredPermissionsAndRoles A single string or an array of strings representing
 *                                    the required roles or permissions.
 *                                    If multiple are provided, the user needs to have AT LEAST ONE of them.
 * @returns An Express middleware function.
 */
export const authorize = (requiredPermissionsAndRoles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authzkit = Authzkit.getInstance(); // Get the singleton instance

      const user = req.user;

      if (!user) {
        return res.status(401).send('Authentication required.');
      }

      const requirements = Array.isArray(requiredPermissionsAndRoles)
        ? requiredPermissionsAndRoles
        : [requiredPermissionsAndRoles];

      // Check if the user has at least one of the required roles or permissions
      let hasAccess = false;
      for (const requirement of requirements) {
        // First, check if it's a role
        if (await authzkit.hasRole(user, requirement)) {
          hasAccess = true;
          break;
        }
        // If not a role, check if it's a permission
        if (await authzkit.hasPermission(user, requirement)) {
          hasAccess = true;
          break;
        }
      }

      if (hasAccess) {
        next();
      } else {
        res.status(403).send('Forbidden: Insufficient permissions.');
      }
    } catch (error) {
      next(error);
    }
  };
};
