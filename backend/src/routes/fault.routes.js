import { Router } from 'express';
import faultController from '../controllers/fault.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { reportFaultSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', faultController.getFaultList);
router.get('/:id', faultController.getFaultById);

// Authorised students, lab staff, and admins can report equipment faults
router.post('/', validateRequest(reportFaultSchema), faultController.reportFault);

export default router;
