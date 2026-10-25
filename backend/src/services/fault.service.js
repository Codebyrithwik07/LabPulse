import faultRepository from '../repositories/fault.repository.js';
import equipmentRepository from '../repositories/equipment.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export class FaultService {
  async getFaultList(query) {
    const page = Math.max(1, parseInt(query.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const { items, total } = await faultRepository.findMany({
      skip,
      take: limit,
      equipmentId: query.equipmentId,
      severity: query.severity,
      status: query.status,
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

  async getFaultById(id) {
    const fault = await faultRepository.findById(id);
    if (!fault) {
      throw new AppError(`Fault report with ID ${id} not found`, 404);
    }
    return fault;
  }

  async reportFault(data, user) {
    const equipment = await equipmentRepository.findById(data.equipmentId);
    if (!equipment) {
      throw new AppError(`Equipment with ID ${data.equipmentId} does not exist`, 404);
    }

    if (equipment.currentCondition === 'DECOMMISSIONED') {
      throw new AppError('Cannot report fault on decommissioned equipment', 400);
    }

    return faultRepository.createReportWithTransaction({
      equipmentId: parseInt(data.equipmentId, 10),
      reportedById: user.id,
      title: data.title.trim(),
      description: data.description.trim(),
      severity: data.severity,
      newCondition: data.newCondition,
      reportedAt: data.reportedAt,
    });
  }
}

export default new FaultService();
