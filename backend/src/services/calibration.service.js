import calibrationRepository from '../repositories/calibration.repository.js';
import equipmentRepository from '../repositories/equipment.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export class CalibrationService {
  async getCalibrationList(query) {
    const page = Math.max(1, parseInt(query.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const { items, total } = await calibrationRepository.findMany({
      skip,
      take: limit,
      equipmentId: query.equipmentId,
      status: query.status,
      overdueOnly: query.overdueOnly === 'true',
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

  async getOverdueEquipment() {
    return calibrationRepository.findOverdueEquipment();
  }

  async recordCalibration(data, user) {
    const equipment = await equipmentRepository.findById(data.equipmentId);
    if (!equipment) {
      throw new AppError(`Equipment with ID ${data.equipmentId} not found`, 404);
    }

    return calibrationRepository.recordCalibration({
      equipmentId: data.equipmentId,
      performedById: user.id,
      calibrationDate: data.calibrationDate,
      nextDueDate: data.nextDueDate,
      standardUsed: data.standardUsed,
      status: data.status,
      measurements: data.measurements,
      notes: data.notes,
    });
  }
}

export default new CalibrationService();
