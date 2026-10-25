import repairRepository from '../repositories/repair.repository.js';
import equipmentRepository from '../repositories/equipment.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export class RepairService {
  async getRepairList(query) {
    const page = Math.max(1, parseInt(query.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const { items, total } = await repairRepository.findMany({
      skip,
      take: limit,
      equipmentId: query.equipmentId,
      status: query.status,
      assignedToId: query.assignedToId,
      sortBy: query.sortBy || 'startedAt',
      sortOrder: query.sortOrder || 'desc',
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

  async getRepairById(id) {
    const repair = await repairRepository.findById(id);
    if (!repair) {
      throw new AppError(`Repair record with ID ${id} not found`, 404);
    }
    return repair;
  }

  async assignRepair(data, user) {
    const equipment = await equipmentRepository.findById(data.equipmentId);
    if (!equipment) {
      throw new AppError(`Equipment with ID ${data.equipmentId} not found`, 404);
    }

    return repairRepository.assignRepair({
      equipmentId: parseInt(data.equipmentId, 10),
      faultReportId: data.faultReportId ? parseInt(data.faultReportId, 10) : null,
      assignedToId: data.assignedToId ? parseInt(data.assignedToId, 10) : user.id,
      staffUserId: user.id,
      notes: data.notes,
    });
  }

  async updateRepairAction(id, data) {
    const repair = await this.getRepairById(id);

    if (repair.restorationStatus === 'VERIFIED_OPERATIONAL') {
      throw new AppError('Cannot update actions for a repair that has already been verified and closed', 400);
    }

    return repairRepository.updateRepairAction(id, data);
  }

  async verifyAndRestore(id, data, user) {
    return repairRepository.verifyAndRestoreEquipment(id, {
      verifiedById: user.id,
      verificationNotes: data.verificationNotes,
      restorationDate: data.restorationDate,
    });
  }
}

export default new RepairService();
