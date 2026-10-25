import faultService from '../services/fault.service.js';

export class FaultController {
  async getFaultList(req, res, next) {
    try {
      const result = await faultService.getFaultList(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getFaultById(req, res, next) {
    try {
      const data = await faultService.getFaultById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async reportFault(req, res, next) {
    try {
      const data = await faultService.reportFault(req.body, req.user);
      res.status(201).json({
        success: true,
        data,
        message: 'Fault report registered and equipment condition updated.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new FaultController();
