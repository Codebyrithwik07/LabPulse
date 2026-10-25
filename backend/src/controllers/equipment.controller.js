import equipmentService from '../services/equipment.service.js';

export class EquipmentController {
  async getEquipmentList(req, res, next) {
    try {
      const result = await equipmentService.getEquipmentList(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getEquipmentById(req, res, next) {
    try {
      const data = await equipmentService.getEquipmentById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getEquipmentTimeline(req, res, next) {
    try {
      const data = await equipmentService.getEquipmentTimeline(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createEquipment(req, res, next) {
    try {
      const data = await equipmentService.createEquipment(req.body, req.user?.id);
      res.status(201).json({ success: true, data, message: 'Equipment registered successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updateEquipment(req, res, next) {
    try {
      const data = await equipmentService.updateEquipment(req.params.id, req.body);
      res.status(200).json({ success: true, data, message: 'Equipment updated successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export default new EquipmentController();
