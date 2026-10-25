import dashboardRepository from '../repositories/dashboard.repository.js';

export class DashboardService {
  async getOverview() {
    return dashboardRepository.getOverviewMetrics();
  }

  async getDowntimeByEquipment() {
    return dashboardRepository.getDowntimeByEquipment();
  }

  async getFailureRankings() {
    return dashboardRepository.getFailureRankings();
  }

  async getRecurringFaults() {
    return dashboardRepository.getRecurringFaults();
  }
}

export default new DashboardService();
