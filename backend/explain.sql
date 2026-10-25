EXPLAIN (ANALYZE, BUFFERS)
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
ORDER BY "failureRank" ASC, "faultCount" DESC;
