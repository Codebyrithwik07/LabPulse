import prisma from '../config/db.js';

export class EquipmentRepository {
  async findMany({ skip = 0, take = 10, search, labId, category, condition, sortBy = 'assetCode', sortOrder = 'asc' }) {
    const where = {};

    if (search) {
      where.OR = [
        { assetCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { modelNumber: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (labId) {
      where.labId = parseInt(labId, 10);
    }

    if (category) {
      where.category = category;
    }

    if (condition) {
      where.currentCondition = condition;
    }

    const validSortFields = ['assetCode', 'name', 'category', 'purchaseDate', 'currentCondition', 'nextCalibrationDue', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'assetCode';
    const direction = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const [items, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        skip: parseInt(skip, 10),
        take: parseInt(take, 10),
        orderBy: { [orderByField]: direction },
        include: {
          lab: {
            select: { id: true, code: true, name: true, building: true, roomNumber: true },
          },
          _count: {
            select: {
              faultReports: true,
              repairRecords: true,
              calibrationRecords: true,
            },
          },
        },
      }),
      prisma.equipment.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id) {
    const parsedId = parseInt(id, 10);
    return prisma.equipment.findUnique({
      where: { id: parsedId },
      include: {
        lab: {
          include: {
            supervisor: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        faultReports: {
          orderBy: { reportedAt: 'desc' },
          take: 10,
          include: {
            reportedBy: { select: { id: true, name: true, role: true, department: true } },
          },
        },
        repairRecords: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: {
            assignedTo: { select: { id: true, name: true, role: true } },
            verifiedBy: { select: { id: true, name: true, role: true } },
          },
        },
        calibrationRecords: {
          orderBy: { calibrationDate: 'desc' },
          take: 5,
          include: {
            performedBy: { select: { id: true, name: true, role: true } },
          },
        },
        conditionHistories: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });
  }

  async findByAssetCode(assetCode) {
    return prisma.equipment.findUnique({
      where: { assetCode },
    });
  }

  async create(data) {
    return prisma.equipment.create({
      data,
      include: { lab: true },
    });
  }

  async update(id, data) {
    return prisma.equipment.update({
      where: { id: parseInt(id, 10) },
      data,
      include: { lab: true },
    });
  }

  async getEquipmentTimeline(id) {
    const parsedId = parseInt(id, 10);

    const [faults, repairs, calibrations, conditionChanges] = await Promise.all([
      prisma.faultReport.findMany({
        where: { equipmentId: parsedId },
        include: { reportedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { reportedAt: 'desc' },
      }),
      prisma.repairRecord.findMany({
        where: { equipmentId: parsedId },
        include: {
          assignedTo: { select: { id: true, name: true, role: true } },
          verifiedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.calibrationRecord.findMany({
        where: { equipmentId: parsedId },
        include: { performedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { calibrationDate: 'desc' },
      }),
      prisma.conditionHistory.findMany({
        where: { equipmentId: parsedId },
        include: { changedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    // Unify into a single chronological auditable timeline
    const timeline = [
      ...faults.map((f) => ({
        type: 'FAULT_REPORT',
        id: `FLT-${f.id}`,
        title: `Fault Reported: ${f.title}`,
        code: f.faultCode,
        timestamp: f.reportedAt,
        severity: f.severity,
        status: f.status,
        author: f.reportedBy?.name,
        authorRole: f.reportedBy?.role,
        details: f.description,
        resolvedAt: f.resolvedAt,
      })),
      ...repairs.map((r) => ({
        type: 'REPAIR_RECORD',
        id: `REP-${r.id}`,
        title: `Repair ${r.restorationStatus.replace('_', ' ')}`,
        code: r.repairTicketNumber,
        timestamp: r.startedAt,
        status: r.restorationStatus,
        assignedTo: r.assignedTo?.name,
        verifiedBy: r.verifiedBy?.name,
        details: r.actionTaken || 'Repair logged in ledger',
        parts: r.partsReplaced,
        cost: r.repairCost,
        completedAt: r.completedAt,
        verifiedAt: r.verifiedAt,
      })),
      ...calibrations.map((c) => ({
        type: 'CALIBRATION',
        id: `CAL-${c.id}`,
        title: `Calibration Performed: ${c.status}`,
        code: c.certificateNumber,
        timestamp: c.calibrationDate,
        status: c.status,
        author: c.performedBy?.name,
        standard: c.standardUsed,
        nextDueDate: c.nextDueDate,
        measurements: c.measurements,
        details: c.notes || 'Routine calibration inspection verified',
      })),
      ...conditionChanges.map((ch) => ({
        type: 'CONDITION_CHANGE',
        id: `CND-${ch.id}`,
        title: `Condition Changed: ${ch.previousCondition} → ${ch.newCondition}`,
        timestamp: ch.timestamp,
        author: ch.changedBy?.name,
        authorRole: ch.changedBy?.role,
        details: ch.reason,
        referenceType: ch.referenceType,
        referenceId: ch.referenceId,
      })),
    ];

    // Sort descending chronologically
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return timeline;
  }
}

export default new EquipmentRepository();
