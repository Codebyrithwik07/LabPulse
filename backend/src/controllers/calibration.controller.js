import calibrationService from '../services/calibration.service.js';

export class CalibrationController {
  async getCalibrationList(req, res, next) {
    try {
      const result = await calibrationService.getCalibrationList(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getOverdueEquipment(req, res, next) {
    try {
      const data = await calibrationService.getOverdueEquipment();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async recordCalibration(req, res, next) {
    try {
      const data = await calibrationService.recordCalibration(req.body, req.user);
      res.status(201).json({
        success: true,
        data,
        message: 'Calibration certificate recorded successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new CalibrationController();
