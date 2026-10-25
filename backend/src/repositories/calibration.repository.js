import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.middleware.js';

export class CalibrationRepository {
  async findMany({ skip = 0, take = 10, equipmentId, status, overdueOnly = false }) {
    const where = {};

    if (equipmentId) {
      where.equipmentId = parseInt(equipmentId, 10);
    }

    if (status) {
      where.status = status;
    }

    if (overdueOnly) {
      where.nextDueDate = { lt: new Date() };
    }

    const [items, total] = await Promise.all([
      prisma.calibrationRecord.findMany({
        where,
        skip: parseInt(skip, 10),
        take: parseInt(take, 10),
        orderBy: { calibrationDate: 'desc' },
        include: {
          equipment: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              category: true,
              currentCondition: true,
              nextCalibrationDue: true,
              lab: { select: { id: true, name: true, code: true } },
            },
          },
          performedBy: {
            select: { id: true, name: true, role: true, department: true },
          },
        },
      }),
      prisma.calibrationRecord.count({ where }),
    ]);

    return { items, total };
  }

  async findOverdueEquipment() {
    return prisma.equipment.findMany({
      where: {
        OR: [
          { nextCalibrationDue: { lt: new Date() } },
          { nextCalibrationDue: null },
        ],
        currentCondition: { not: 'DECOMMISSIONED' },
      },
      include: {
        lab: { select: { id: true, name: true, code: true, building: true, roomNumber: true } },
        calibrationRecords: {
          orderBy: { calibrationDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { nextCalibrationDue: 'asc' },
    });
  }

  async recordCalibration({ equipmentId, performedById, calibrationDate, nextDueDate, standardUsed, status, measurements, notes }) {
    return prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({
        where: { id: parseInt(equipmentId, 10) },
      });

      if (!equipment) {
        throw new AppError(`Equipment with id ${equipmentId} not found`, 404);
      }

      const calibCount = await tx.calibrationRecord.count();
      const currentYear = new Date().getFullYear();
      const certificateNumber = `CAL-${currentYear}-${String(calibCount + 1).padStart(4, '0')}`;

      const calDate = calibrationDate ? new Date(calibrationDate) : new Date();
      // If nextDueDate not provided, calculate based on calibrationFrequencyDays
      const calculatedDueDate = nextDueDate
        ? new Date(nextDueDate)
        : new Date(calDate.getTime() + (equipment.calibrationFrequencyDays || 90) * 24 * 60 * 60 * 1000);

      // 1. Create Calibration Record
      const record = await tx.calibrationRecord.create({
        data: {
          certificateNumber,
          equipmentId: equipment.id,
          performedById,
          calibrationDate: calDate,
          nextDueDate: calculatedDueDate,
          standardUsed,
          status,
          measurements,
          notes,
        },
      });

      // 2. Update Equipment calibration timestamps
      const updateData = {
        lastCalibratedAt: calDate,
        nextCalibrationDue: calculatedDueDate,
      };

      // If calibration failed, adjust condition to DEGRADED
      if (status === 'FAILED' && equipment.currentCondition === 'OPERATIONAL') {
        updateData.currentCondition = 'DEGRADED';

        await tx.conditionHistory.create({
          data: {
            equipmentId: equipment.id,
            changedById: performedById,
            previousCondition: equipment.currentCondition,
            newCondition: 'DEGRADED',
            reason: `Calibration failed [${certificateNumber}]: Equipment precision out of tolerance.`,
            referenceType: 'CALIBRATION',
            referenceId: certificateNumber,
            timestamp: calDate,
          },
        });
      }

      await tx.equipment.update({
        where: { id: equipment.id },
        data: updateData,
      });

      return record;
    });
  }
}

export default new CalibrationRepository();
