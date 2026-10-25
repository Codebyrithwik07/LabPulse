import prisma from '../config/db.js';

export class DashboardRepository {
  async getOverviewMetrics() {
    const [
      totalEquipment,
      operationalEquipment,
      degradedEquipment,
      outOfServiceEquipment,
      underMaintenanceEquipment,
      openFaults,
      criticalFaults,
      activeRepairs,
      overdueCalibrations,
    ] = await Promise.all([
      prisma.equipment.count({ where: { currentCondition: { not: 'DECOMMISSIONED' } } }),
      prisma.equipment.count({ where: { currentCondition: 'OPERATIONAL' } }),
      prisma.equipment.count({ where: { currentCondition: 'DEGRADED' } }),
      prisma.equipment.count({ where: { currentCondition: 'OUT_OF_SERVICE' } }),
      prisma.equipment.count({ where: { currentCondition: 'UNDER_MAINTENANCE' } }),
      prisma.faultReport.count({ where: { status: { in: ['REPORTED', 'ASSIGNED', 'IN_REPAIR'] } } }),
      prisma.faultReport.count({ where: { status: { in: ['REPORTED', 'ASSIGNED', 'IN_REPAIR'] }, severity: 'CRITICAL' } }),
      prisma.repairRecord.count({ where: { restorationStatus: { in: ['SCHEDULED', 'IN_PROGRESS', 'PENDING_VERIFICATION'] } } }),
      prisma.equipment.count({
        where: {
          currentCondition: { not: 'DECOMMISSIONED' },
          OR: [
            { nextCalibrationDue: { lt: new Date() } },
            { nextCalibrationDue: null },
          ],
        },
      }),
    ]);

    // Calculate total system downtime hours using raw SQL
    const downtimeResult = await prisma.$queryRaw`
      SELECT COALESCE(
        ROUND(
          SUM(EXTRACT(EPOCH FROM (COALESCE("resolvedAt", NOW()) - "reportedAt")) / 3600.0)::NUMERIC, 
          1
        ), 0
      )::FLOAT AS "totalSystemDowntimeHours"
      FROM fault_reports;
    `;

    const totalSystemDowntimeHours = downtimeResult[0]?.totalSystemDowntimeHours || 0;
    const operationalRate = totalEquipment > 0 ? Math.round((operationalEquipment / totalEquipment) * 100) : 100;

    return {
      totalEquipment,
      operationalEquipment,
      degradedEquipment,
      outOfServiceEquipment,
      underMaintenanceEquipment,
      operationalRate,
      openFaults,
      criticalFaults,
      activeRepairs,
      overdueCalibrations,
      totalSystemDowntimeHours,
    };
  }

  // CTE query calculating equipment downtime
  async getDowntimeByEquipment() {
    return prisma.$queryRaw`
      WITH EquipmentDowntime AS (
        SELECT
          e.id AS "equipmentId",
          e."assetCode",
          e.name AS "equipmentName",
          e.category,
          e."currentCondition",
          l.name AS "labName",
          f.id AS "faultId",
          f.title AS "faultTitle",
          f.severity,
          f."reportedAt",
          COALESCE(f."resolvedAt", NOW()) AS "restoredAt",
          ROUND(
            CAST(EXTRACT(EPOCH FROM (COALESCE(f."resolvedAt", NOW()) - f."reportedAt")) / 3600.0 AS NUMERIC),
            2
          ) AS "downtimeHours"
        FROM equipment e
        JOIN labs l ON e."labId" = l.id
        JOIN fault_reports f ON e.id = f."equipmentId"
      )
      SELECT
        "equipmentId",
        "assetCode",
        "equipmentName",
        category,
        "labName",
        "currentCondition",
        COUNT("faultId")::INTEGER AS "totalFaults",
        COALESCE(SUM("downtimeHours"), 0)::FLOAT AS "totalDowntimeHours",
        ROUND(COALESCE(AVG("downtimeHours"), 0)::NUMERIC, 2)::FLOAT AS "avgDowntimeHours"
      FROM EquipmentDowntime
      GROUP BY "equipmentId", "assetCode", "equipmentName", category, "labName", "currentCondition"
      ORDER BY "totalDowntimeHours" DESC
      LIMIT 15;
    `;
  }

  // Window function query ranking equipment by failure frequency
  async getFailureRankings() {
    return prisma.$queryRaw`
      WITH EquipmentFailures AS (
        SELECT
          e.id AS "equipmentId",
          e."assetCode",
          e.name AS "equipmentName",
          e.category,
          e."currentCondition",
          l.name AS "labName",
          COUNT(f.id)::INTEGER AS "faultCount",
          COUNT(CASE WHEN f.severity IN ('HIGH', 'CRITICAL') THEN 1 END)::INTEGER AS "criticalFaultCount",
          MAX(f."reportedAt") AS "latestFaultAt"
        FROM equipment e
        JOIN labs l ON e."labId" = l.id
        LEFT JOIN fault_reports f ON e.id = f."equipmentId"
        GROUP BY e.id, e."assetCode", e.name, e.category, e."currentCondition", l.name
      )
      SELECT
        "equipmentId",
        "assetCode",
        "equipmentName",
        category,
        "currentCondition",
        "labName",
        "faultCount",
        "criticalFaultCount",
        "latestFaultAt",
        (DENSE_RANK() OVER (ORDER BY "faultCount" DESC, "criticalFaultCount" DESC))::INTEGER AS "failureRank"
      FROM EquipmentFailures
      WHERE "faultCount" > 0
      ORDER BY "failureRank" ASC, "faultCount" DESC
      LIMIT 15;
    `;
  }

  // Recurring faults pattern query
  async getRecurringFaults() {
    return prisma.$queryRaw`
      SELECT
        e.category,
        f.title AS "faultPattern",
        COUNT(*)::INTEGER AS "occurrences",
        COUNT(CASE WHEN f.severity = 'CRITICAL' THEN 1 END)::INTEGER AS "criticalCount",
        COUNT(CASE WHEN f.severity = 'HIGH' THEN 1 END)::INTEGER AS "highCount",
        ROUND(AVG(
          CASE 
            WHEN f."resolvedAt" IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (f."resolvedAt" - f."reportedAt")) / 3600.0 
            ELSE EXTRACT(EPOCH FROM (NOW() - f."reportedAt")) / 3600.0 
          END
        )::NUMERIC, 1)::FLOAT AS "avgDowntimeHours"
      FROM fault_reports f
      JOIN equipment e ON f."equipmentId" = e.id
      GROUP BY e.category, f.title
      ORDER BY "occurrences" DESC
      LIMIT 8;
    `;
  }
}

export default new DashboardRepository();
