import { z } from 'zod';

export const EquipmentCategoryEnum = z.enum([
  'OSCILLOSCOPE',
  'POWER_SUPPLY',
  'FUNCTION_GENERATOR',
  'MULTIMETER',
  'SPECTROPHOTOMETER',
  'CENTRIFUGE',
  'MICROSCOPE',
  'AUTOCLAVE',
  'CNC_MILL',
  'PRINTER_3D',
  'FURNACE',
  'ANALYTICAL_BALANCE',
]);

export const EquipmentConditionEnum = z.enum([
  'OPERATIONAL',
  'DEGRADED',
  'UNDER_MAINTENANCE',
  'OUT_OF_SERVICE',
  'DECOMMISSIONED',
]);

export const SeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const FaultStatusEnum = z.enum(['REPORTED', 'ASSIGNED', 'IN_REPAIR', 'RESOLVED', 'CLOSED', 'REJECTED']);
export const RepairStatusEnum = z.enum(['SCHEDULED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'VERIFIED_OPERATIONAL', 'UNRESOLVED']);
export const CalibrationStatusEnum = z.enum(['PASSED', 'PASSED_WITH_ADJUSTMENTS', 'FAILED']);

export const createEquipmentSchema = z.object({
  body: z.object({
    assetCode: z.string().min(3).max(50),
    name: z.string().min(2).max(150),
    category: EquipmentCategoryEnum,
    modelNumber: z.string().min(1).max(100),
    serialNumber: z.string().min(1).max(100),
    manufacturer: z.string().min(1).max(100),
    purchaseDate: z.string().or(z.date()),
    warrantyExpiry: z.string().or(z.date()).optional().nullable(),
    currentCondition: EquipmentConditionEnum.default('OPERATIONAL'),
    labId: z.coerce.number().int().positive(),
    calibrationFrequencyDays: z.coerce.number().int().positive().default(90),
    lastCalibratedAt: z.string().or(z.date()).optional().nullable(),
    nextCalibrationDue: z.string().or(z.date()).optional().nullable(),
  }),
});

export const updateEquipmentSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    modelNumber: z.string().min(1).max(100).optional(),
    manufacturer: z.string().min(1).max(100).optional(),
    currentCondition: EquipmentConditionEnum.optional(),
    labId: z.coerce.number().int().positive().optional(),
    calibrationFrequencyDays: z.coerce.number().int().positive().optional(),
  }),
});

export const reportFaultSchema = z.object({
  body: z.object({
    equipmentId: z.coerce.number().int().positive(),
    title: z.string().min(3).max(200),
    description: z.string().min(5),
    severity: SeverityEnum,
    newCondition: EquipmentConditionEnum.optional(),
    reportedAt: z.string().or(z.date()).optional(),
  }),
});

export const assignRepairSchema = z.object({
  body: z.object({
    equipmentId: z.coerce.number().int().positive(),
    faultReportId: z.coerce.number().int().positive().optional().nullable(),
    assignedToId: z.coerce.number().int().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const updateRepairActionSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    actionTaken: z.string().min(3),
    partsReplaced: z.string().optional().nullable(),
    repairCost: z.coerce.number().min(0).optional(),
    restorationStatus: RepairStatusEnum.optional(),
  }),
});

export const verifyRestoreSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    verificationNotes: z.string().optional(),
    restorationDate: z.string().or(z.date()).optional(),
  }),
});

export const recordCalibrationSchema = z.object({
  body: z.object({
    equipmentId: z.coerce.number().int().positive(),
    standardUsed: z.string().min(2).max(150),
    status: CalibrationStatusEnum,
    calibrationDate: z.string().or(z.date()).optional(),
    nextDueDate: z.string().or(z.date()).optional(),
    measurements: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});
