import prisma from '../config/db.js';

export class FaultRepository {
  async findMany({ skip = 0, take = 10, equipmentId, severity, status, sortBy = 'reportedAt', sortOrder = 'desc' }) {
    const where = {};

    if (equipmentId) {
      where.equipmentId = parseInt(equipmentId, 10);
    }

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    const validSortFields = ['reportedAt', 'severity', 'status', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'reportedAt';
    const direction = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      prisma.faultReport.findMany({
        where,
        skip: parseInt(skip, 10),
        take: parseInt(take, 10),
        orderBy: { [orderByField]: direction },
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
          reportedBy: {
            select: { id: true, name: true, role: true, department: true },
          },
          repairRecords: {
            select: { id: true, repairTicketNumber: true, restorationStatus: true },
          },
        },
      }),
      prisma.faultReport.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id) {
    return prisma.faultReport.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        equipment: {
          include: { lab: true },
        },
        reportedBy: true,
        repairRecords: {
          include: { assignedTo: true, verifiedBy: true },
        },
      },
    });
  }

  // Transactional creation: Fault Report + Equipment Condition Update + ConditionHistory Audit
  async createReportWithTransaction({ equipmentId, reportedById, title, description, severity, newCondition, reportedAt }) {
    return prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw new Error(`Equipment with id ${equipmentId} not found`);
      }

      const faultCount = await tx.faultReport.count();
      const currentYear = new Date().getFullYear();
      const faultCode = `FLT-${currentYear}-${String(faultCount + 1).padStart(4, '0')}`;

      // 1. Create Fault Report
      const faultReport = await tx.faultReport.create({
        data: {
          faultCode,
          equipmentId,
          reportedById,
          title,
          description,
          severity,
          status: 'REPORTED',
          reportedAt: reportedAt ? new Date(reportedAt) : new Date(),
        },
      });

      // 2. Determine target equipment condition based on severity if condition not explicit
      let targetCondition = newCondition;
      if (!targetCondition) {
        if (severity === 'CRITICAL') {
          targetCondition = 'OUT_OF_SERVICE';
        } else if (severity === 'HIGH') {
          targetCondition = 'OUT_OF_SERVICE';
        } else {
          targetCondition = 'DEGRADED';
        }
      }

      const prevCondition = equipment.currentCondition;

      // 3. Update Equipment Condition
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { currentCondition: targetCondition },
      });

      // 4. Create Condition History Audit Record
      await tx.conditionHistory.create({
        data: {
          equipmentId,
          changedById: reportedById,
          previousCondition: prevCondition,
          newCondition: targetCondition,
          reason: `Fault reported [${faultCode}] - ${title}`,
          referenceType: 'FAULT_REPORT',
          referenceId: faultCode,
          timestamp: faultReport.reportedAt,
        },
      });

      return faultReport;
    });
  }
}

export default new FaultRepository();
