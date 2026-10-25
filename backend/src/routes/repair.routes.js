import { Router } from 'express';
import repairController from '../controllers/repair.controller.js';
import { requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  assignRepairSchema,
  updateRepairActionSchema,
  verifyRestoreSchema,
} from '../validators/schemas.js';

const router = Router();

router.get('/', repairController.getRepairList);
router.get('/:id', repairController.getRepairById);

// Lab Staff & Admin operations
router.post(
  '/',
  requireRoles('LAB_STAFF', 'LAB_ADMIN'),
  validateRequest(assignRepairSchema),
  repairController.assignRepair
);

router.put(
  '/:id/action',
  requireRoles('LAB_STAFF', 'LAB_ADMIN'),
  validateRequest(updateRepairActionSchema),
  repairController.updateRepairAction
);

router.post(
  '/:id/restore',
  requireRoles('LAB_STAFF', 'LAB_ADMIN'),
  validateRequest(verifyRestoreSchema),
  repairController.verifyAndRestore
);

export default router;
