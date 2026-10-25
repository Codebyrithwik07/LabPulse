import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.middleware.js';

export class RepairRepository {
  async findMany({ skip = 0, take = 10, equipmentId, status, assignedToId, sortBy = 'startedAt', sortOrder = 'desc' }) {
    const where = {};

    if (equipmentId) {
      where.equipmentId = parseInt(equipmentId, 10);
    }

    if (status) {
      where.restorationStatus = status;
    }

    if (assignedToId) {
      where.assignedToId = parseInt(assignedToId, 10);
    }

    const [items, total] = await Promise.all([
      prisma.repairRecord.findMany({
        where,
        skip: parseInt(skip, 10),
        take: parseInt(take, 10),
        orderBy: { [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' },
        include: {
          equipment: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              category: true,
              currentCondition: true,
              lab: { select: { id: true, name: true, code: true } },
            },
          },
          faultReport: {
            select: { id: true, faultCode: true, title: true, severity: true, reportedAt: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          verifiedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.repairRecord.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id) {
    return prisma.repairRecord.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        equipment: {
          include: { lab: true },
        },
        faultReport: true,
        assignedTo: true,
        verifiedBy: true,
      },
    });
  }

  // Transaction: Create / Assign repair ticket
  async assignRepair({ equipmentId, faultReportId, assignedToId, staffUserId, notes }) {
    return prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({ where: { id: equipmentId } });
      if (!equipment) {
        throw new AppError(`Equipment ${equipmentId} not found`, 404);
      }

      if (faultReportId) {
        const fault = await tx.faultReport.findUnique({ where: { id: faultReportId } });
        if (!fault) {
          throw new AppError(`Fault report ${faultReportId} not found`, 404);
        }
        // Update fault status to ASSIGNED / IN_REPAIR
        await tx.faultReport.update({
          where: { id: faultReportId },
          data: { status: 'ASSIGNED' },
        });
      }

      const repairCount = await tx.repairRecord.count();
      const currentYear = new Date().getFullYear();
      const repairTicketNumber = `REP-${currentYear}-${String(repairCount + 1).padStart(4, '0')}`;

      // Create repair record
      const repair = await tx.repairRecord.create({
        data: {
          repairTicketNumber,
          equipmentId,
          faultReportId: faultReportId || null,
          assignedToId,
          actionTaken: notes || 'Work order created and assigned to lab technician',
          restorationStatus: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Update equipment condition to UNDER_MAINTENANCE
      if (equipment.currentCondition !== 'UNDER_MAINTENANCE') {
        const prevCondition = equipment.currentCondition;
        await tx.equipment.update({
          where: { id: equipmentId },
          data: { currentCondition: 'UNDER_MAINTENANCE' },
        });

        await tx.conditionHistory.create({
          data: {
            equipmentId,
            changedById: staffUserId,
            previousCondition: prevCondition,
            newCondition: 'UNDER_MAINTENANCE',
            reason: `Repair initiated [${repairTicketNumber}]`,
            referenceType: 'REPAIR_ASSIGNED',
            referenceId: repairTicketNumber,
          },
        });
      }

      return repair;
    });
  }

  // Update repair progress (actions taken, parts replaced, repair cost)
  async updateRepairAction(id, { actionTaken, partsReplaced, repairCost, restorationStatus }) {
    return prisma.repairRecord.update({
      where: { id: parseInt(id, 10) },
      data: {
        actionTaken,
        partsReplaced,
        repairCost: repairCost !== undefined ? parseFloat(repairCost) : undefined,
        restorationStatus,
        completedAt: restorationStatus === 'PENDING_VERIFICATION' ? new Date() : undefined,
      },
    });
  }

  // Transaction: Verify Repair and Restore Equipment to OPERATIONAL
  // Prevents duplicate processing via status check
  async verifyAndRestoreEquipment(id, { verifiedById, verificationNotes, restorationDate }) {
    return prisma.$transaction(async (tx) => {
      const repair = await tx.repairRecord.findUnique({
        where: { id: parseInt(id, 10) },
        include: { equipment: true, faultReport: true },
      });

      if (!repair) {
        throw new AppError('Repair record not found', 404);
      }

      // Prevent duplicate restoration processing
      if (repair.restorationStatus === 'VERIFIED_OPERATIONAL') {
        throw new AppError('This repair ticket has already been verified and equipment restored to OPERATIONAL.', 400);
      }

      const restorationTimestamp = restorationDate ? new Date(restorationDate) : new Date();

      // 1. Mark repair record as verified operational
      const updatedRepair = await tx.repairRecord.update({
        where: { id: repair.id },
        data: {
          restorationStatus: 'VERIFIED_OPERATIONAL',
          verifiedById,
          verifiedAt: restorationTimestamp,
          completedAt: repair.completedAt || restorationTimestamp,
          actionTaken: verificationNotes 
            ? `${repair.actionTaken || ''}\n[Verification Note]: ${verificationNotes}`.trim()
            : repair.actionTaken,
        },
      });

      // 2. If tied to a fault report, mark the fault resolved and record resolvedAt
      if (repair.faultReportId) {
        await tx.faultReport.update({
          where: { id: repair.faultReportId },
          data: {
            status: 'RESOLVED',
            resolvedAt: restorationTimestamp,
          },
        });
      }

      // 3. Update equipment condition to OPERATIONAL
      const previousCondition = repair.equipment.currentCondition;
      await tx.equipment.update({
        where: { id: repair.equipmentId },
        data: { currentCondition: 'OPERATIONAL' },
      });

      // 4. Record Condition History audit entry
      await tx.conditionHistory.create({
        data: {
          equipmentId: repair.equipmentId,
          changedById: verifiedById,
          previousCondition,
          newCondition: 'OPERATIONAL',
          reason: `Repair verified and equipment certified operational [Ticket: ${repair.repairTicketNumber}]. ${verificationNotes || ''}`.trim(),
          referenceType: 'REPAIR_COMPLETION',
          referenceId: repair.repairTicketNumber,
          timestamp: restorationTimestamp,
        },
      });

      return updatedRepair;
    });
  }
}

export default new RepairRepository();
