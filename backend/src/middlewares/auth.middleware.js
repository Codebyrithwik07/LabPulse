import prisma from '../config/db.js';
import { AppError } from './error.middleware.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const userIdHeader = req.headers['x-user-id'];
    const userRoleHeader = req.headers['x-user-role'];

    let user = null;

    if (userIdHeader) {
      const parsedId = parseInt(userIdHeader, 10);
      if (!isNaN(parsedId)) {
        user = await prisma.user.findUnique({
          where: { id: parsedId },
        });
      }
    }

    if (!user) {
      // Default fallback: Try to find a default user or use header info
      const defaultUser = await prisma.user.findFirst({
        where: userRoleHeader ? { role: userRoleHeader } : {},
        orderBy: { id: 'asc' },
      });

      user = defaultUser || {
        id: 1,
        name: 'Dr. Aris Thorne (Lab Supervisor)',
        email: 'a.thorne@college.edu',
        role: userRoleHeader || 'LAB_STAFF',
        department: 'Electrical & Computer Engineering',
      };
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Operation restricted to [${allowedRoles.join(', ')}]. Current role is '${req.user.role}'.`,
          403
        )
      );
    }

    next();
  };
};
