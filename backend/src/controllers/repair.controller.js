import repairService from '../services/repair.service.js';

export class RepairController {
  async getRepairList(req, res, next) {
    try {
      const result = await repairService.getRepairList(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getRepairById(req, res, next) {
    try {
      const data = await repairService.getRepairById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async assignRepair(req, res, next) {
    try {
      const data = await repairService.assignRepair(req.body, req.user);
      res.status(201).json({
        success: true,
        data,
        message: 'Repair work order created and technician assigned successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRepairAction(req, res, next) {
    try {
      const data = await repairService.updateRepairAction(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data,
        message: 'Repair actions recorded in ledger.',
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyAndRestore(req, res, next) {
    try {
      const data = await repairService.verifyAndRestore(req.params.id, req.body, req.user);
      res.status(200).json({
        success: true,
        data,
        message: 'Repair verified. Equipment restored to OPERATIONAL status.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new RepairController();
