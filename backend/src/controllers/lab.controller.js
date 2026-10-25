import prisma from '../config/db.js';

export class LabController {
  async getAllLabs(req, res, next) {
    try {
      const labs = await prisma.lab.findMany({
        orderBy: { code: 'asc' },
        include: {
          supervisor: { select: { id: true, name: true, email: true } },
          _count: { select: { equipment: true } },
        },
      });
      res.status(200).json({ success: true, data: labs });
    } catch (err) {
      next(err);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const role = req.query.role;
      const where = role ? { role } : {};

      const users = await prisma.user.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      });
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
}

export default new LabController();
