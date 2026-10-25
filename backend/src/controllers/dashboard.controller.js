import dashboardService from '../services/dashboard.service.js';

export class DashboardController {
  async getOverview(req, res, next) {
    try {
      const data = await dashboardService.getOverview();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getDowntimeByEquipment(req, res, next) {
    try {
      const data = await dashboardService.getDowntimeByEquipment();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getFailureRankings(req, res, next) {
    try {
      const data = await dashboardService.getFailureRankings();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRecurringFaults(req, res, next) {
    try {
      const data = await dashboardService.getRecurringFaults();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export default new DashboardController();
