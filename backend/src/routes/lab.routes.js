import { Router } from 'express';
import labController from '../controllers/lab.controller.js';

const router = Router();

router.get('/labs', labController.getAllLabs);
router.get('/users', labController.getAllUsers);

export default router;
