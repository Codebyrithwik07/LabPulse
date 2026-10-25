import { Router } from 'express';
import calibrationController from '../controllers/calibration.controller.js';
import { requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { recordCalibrationSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', calibrationController.getCalibrationList);
router.get('/overdue', calibrationController.getOverdueEquipment);

router.post(
  '/',
  requireRoles('LAB_STAFF', 'LAB_ADMIN'),
  validateRequest(recordCalibrationSchema),
  calibrationController.recordCalibration
);

export default router;
