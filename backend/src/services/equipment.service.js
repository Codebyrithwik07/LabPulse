import equipmentRepository from '../repositories/equipment.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import prisma from '../config/db.js';

export class EquipmentService {
  async getEquipmentList(query) {
    const page = Math.max(1, parseInt(query.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const { items, total } = await equipmentRepository.findMany({
      skip,
      take: limit,
      search: query.search,
      labId: query.labId,
      category: query.category,
      condition: query.condition,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEquipmentById(id) {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new AppError(`Equipment with ID ${id} not found`, 404);
    }
    return equipment;
  }

  async getEquipmentTimeline(id) {
    // Check if equipment exists
    await this.getEquipmentById(id);
    return equipmentRepository.getEquipmentTimeline(id);
  }

  async createEquipment(data, userId) {
    // Check asset code uniqueness
    const existing = await equipmentRepository.findByAssetCode(data.assetCode);
    if (existing) {
      throw new AppError(`Asset code ${data.assetCode} is already registered`, 409);
    }

    const created = await equipmentRepository.create({
      ...data,
      purchaseDate: new Date(data.purchaseDate),
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      lastCalibratedAt: data.lastCalibratedAt ? new Date(data.lastCalibratedAt) : null,
      nextCalibrationDue: data.nextCalibrationDue ? new Date(data.nextCalibrationDue) : null,
    });

    // Record initial condition history entry
    await prisma.conditionHistory.create({
      data: {
        equipmentId: created.id,
        changedById: userId,
        previousCondition: 'OPERATIONAL',
        newCondition: created.currentCondition,
        reason: 'Initial equipment registration in laboratory inventory ledger',
        referenceType: 'MANUAL_AUDIT',
        referenceId: created.assetCode,
      },
    });

    return created;
  }

  async updateEquipment(id, data) {
    await this.getEquipmentById(id);
    return equipmentRepository.update(id, data);
  }
}

export default new EquipmentService();
