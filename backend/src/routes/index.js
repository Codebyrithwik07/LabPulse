import { Router } from 'express';
import equipmentRoutes from './equipment.routes.js';
import faultRoutes from './fault.routes.js';
import repairRoutes from './repair.routes.js';
import calibrationRoutes from './calibration.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import labRoutes from './lab.routes.js';

const router = Router();

router.use('/equipment', equipmentRoutes);
router.use('/faults', faultRoutes);
router.use('/repairs', repairRoutes);
router.use('/calibrations', calibrationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', labRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'LabPulse API',
    timestamp: new Date().toISOString(),
  });
});

export default router;
