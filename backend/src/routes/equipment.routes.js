import { Router } from 'express';
import equipmentController from '../controllers/equipment.controller.js';
import { requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createEquipmentSchema, updateEquipmentSchema } from '../validators/schemas.js';

const router = Router();

// Public / student readable routes
router.get('/', equipmentController.getEquipmentList);
router.get('/:id', equipmentController.getEquipmentById);
router.get('/:id/timeline', equipmentController.getEquipmentTimeline);

// Staff / Admin restricted routes
router.post(
  '/',
  requireRoles('LAB_STAFF', 'LAB_ADMIN'),
  validateRequest(createEquipmentSchema),
  equipmentController.createEquipment
);

router.put(
  '/:id',
  requireRoles('LAB_STAFF', 'LAB_ADMIN'),
  validateRequest(updateEquipmentSchema),
  equipmentController.updateEquipment
);

export default router;
