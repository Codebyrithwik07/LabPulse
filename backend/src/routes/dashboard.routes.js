import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/overview', dashboardController.getOverview);
router.get('/downtime-by-equipment', dashboardController.getDowntimeByEquipment);
router.get('/failure-ranking', dashboardController.getFailureRankings);
router.get('/recurring-faults', dashboardController.getRecurringFaults);

export default router;
