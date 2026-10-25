-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'LAB_STAFF', 'LAB_ADMIN');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('OPERATIONAL', 'DEGRADED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FaultStatus" AS ENUM ('REPORTED', 'ASSIGNED', 'IN_REPAIR', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'VERIFIED_OPERATIONAL', 'UNRESOLVED');

-- CreateEnum
CREATE TYPE "CalibrationStatus" AS ENUM ('PASSED', 'PASSED_WITH_ADJUSTMENTS', 'FAILED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('OSCILLOSCOPE', 'POWER_SUPPLY', 'FUNCTION_GENERATOR', 'MULTIMETER', 'SPECTROPHOTOMETER', 'CENTRIFUGE', 'MICROSCOPE', 'AUTOCLAVE', 'CNC_MILL', 'PRINTER_3D', 'FURNACE', 'ANALYTICAL_BALANCE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "department" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "supervisorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "warrantyExpiry" TIMESTAMP(3),
    "currentCondition" "Condition" NOT NULL DEFAULT 'OPERATIONAL',
    "labId" INTEGER NOT NULL,
    "calibrationFrequencyDays" INTEGER NOT NULL DEFAULT 90,
    "lastCalibratedAt" TIMESTAMP(3),
    "nextCalibrationDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fault_reports" (
    "id" SERIAL NOT NULL,
    "faultCode" TEXT NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "reportedById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "FaultStatus" NOT NULL DEFAULT 'REPORTED',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fault_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_records" (
    "id" SERIAL NOT NULL,
    "repairTicketNumber" TEXT NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "faultReportId" INTEGER,
    "assignedToId" INTEGER,
    "actionTaken" TEXT,
    "partsReplaced" TEXT,
    "repairCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "verifiedById" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "restorationStatus" "RepairStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_records" (
    "id" SERIAL NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "performedById" INTEGER NOT NULL,
    "calibrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "standardUsed" TEXT NOT NULL,
    "status" "CalibrationStatus" NOT NULL DEFAULT 'PASSED',
    "measurements" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condition_history" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "changedById" INTEGER,
    "previousCondition" "Condition" NOT NULL,
    "newCondition" "Condition" NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "condition_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "labs_code_key" ON "labs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_assetCode_key" ON "equipment"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_serialNumber_key" ON "equipment"("serialNumber");

-- CreateIndex
CREATE INDEX "equipment_labId_idx" ON "equipment"("labId");

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "equipment_currentCondition_idx" ON "equipment"("currentCondition");

-- CreateIndex
CREATE UNIQUE INDEX "fault_reports_faultCode_key" ON "fault_reports"("faultCode");

-- CreateIndex
CREATE INDEX "fault_reports_equipmentId_idx" ON "fault_reports"("equipmentId");

-- CreateIndex
CREATE INDEX "fault_reports_reportedById_idx" ON "fault_reports"("reportedById");

-- CreateIndex
CREATE INDEX "fault_reports_severity_idx" ON "fault_reports"("severity");

-- CreateIndex
CREATE INDEX "fault_reports_status_idx" ON "fault_reports"("status");

-- CreateIndex
CREATE INDEX "fault_reports_reportedAt_idx" ON "fault_reports"("reportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "repair_records_repairTicketNumber_key" ON "repair_records"("repairTicketNumber");

-- CreateIndex
CREATE INDEX "repair_records_equipmentId_idx" ON "repair_records"("equipmentId");

-- CreateIndex
CREATE INDEX "repair_records_faultReportId_idx" ON "repair_records"("faultReportId");

-- CreateIndex
CREATE INDEX "repair_records_assignedToId_idx" ON "repair_records"("assignedToId");

-- CreateIndex
CREATE INDEX "repair_records_restorationStatus_idx" ON "repair_records"("restorationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "calibration_records_certificateNumber_key" ON "calibration_records"("certificateNumber");

-- CreateIndex
CREATE INDEX "calibration_records_equipmentId_idx" ON "calibration_records"("equipmentId");

-- CreateIndex
CREATE INDEX "calibration_records_calibrationDate_idx" ON "calibration_records"("calibrationDate");

-- CreateIndex
CREATE INDEX "calibration_records_nextDueDate_idx" ON "calibration_records"("nextDueDate");

-- CreateIndex
CREATE INDEX "condition_history_equipmentId_idx" ON "condition_history"("equipmentId");

-- CreateIndex
CREATE INDEX "condition_history_timestamp_idx" ON "condition_history"("timestamp");

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_records" ADD CONSTRAINT "repair_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_records" ADD CONSTRAINT "repair_records_faultReportId_fkey" FOREIGN KEY ("faultReportId") REFERENCES "fault_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_records" ADD CONSTRAINT "repair_records_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_records" ADD CONSTRAINT "repair_records_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_history" ADD CONSTRAINT "condition_history_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_history" ADD CONSTRAINT "condition_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
