# LabPulse

> **Laboratory Equipment Reliability and Maintenance Ledger for Academic Engineering Colleges**

LabPulse is a full-stack laboratory instrumentation management and reliability ledger engineered for academic colleges. It maintains an auditable, timestamped ledger of all laboratory equipment, tracks operational downtime, records student and staff fault reports, facilitates maintenance work order assignments, manages calibration compliance cycles, and computes reliability metrics directly inside PostgreSQL using Common Table Expressions (CTEs) and Window Functions.

---

## 1. Technology Stack

- **Frontend**:
  - **Framework**: React 19 with Vite (JavaScript ES modules)
  - **Routing**: React Router 7 (`react-router-dom`)
  - **Data Fetching & Cache**: TanStack Query 5 (`@tanstack/react-query`)
  - **Forms & Validation**: React Hook Form (`react-hook-form`)
  - **HTTP Client**: Axios (`axios`) with request/response interceptors
  - **Styling**: Vanilla CSS with custom design tokens (Off-White, Olive Green, Wine) — **No TailwindCSS**
  - **Icons**: Lucide React (`lucide-react`)
- **Backend**:
  - **Runtime & Server**: Node.js with Express.js (`"type": "module"`)
  - **ORM & Migrations**: Prisma ORM 5 with PostgreSQL adapter
  - **Database**: PostgreSQL 18 (Normalized 3NF relational schema)
  - **Schema Validation**: Zod (`zod`)
  - **Architecture**: Strict Layered Design (Routes → Controllers → Services → Repositories → Config / Middlewares)

---

## 2. Design System & Aesthetics

LabPulse utilizes a practical engineering-lab aesthetic with high data density, monospaced accents for asset codes and timestamps, and a 3-color contrast palette:

| Color Token | Hex Code | Visual Application |
| :--- | :--- | :--- |
| **Off-White** | `#F6F8F3` / `#FFFFFF` / `#EEF1EB` | Technical canvas, container panels, dense table headers, and form backgrounds. |
| **Olive Green** | `#3D5033` / `#4D6441` / `#EAF0E6` | Primary branding, operational condition badges, navigation highlights, verified certificates. |
| **Wine** | `#6F1B2F` / `#88223B` / `#FCECEF` | Critical fault badges, out-of-service lockout states, downtime indicators, alert warnings. |

---

## 3. Database Schema & Architecture

The database schema is fully normalized into 7 tables with foreign keys, enums, unique constraints, and indexes:

```
+-----------+       +---------------+       +------------------+
|   users   |<----->|     labs      |------>|    equipment     |
+-----------+       +---------------+       +------------------+
      |                                              |
      |                                 +------------+------------+
      |                                 |            |            |
      v                                 v            v            v
+------------------+           +--------------+ +-----------+ +--------------------+
|  fault_reports   |<--------->|repair_records| |calibrations| | condition_history |
+------------------+           +--------------+ +-----------+ +--------------------+
```

### Table Definitions & Enums

1. **`users`**:
   - `id`, `name`, `email` (unique), `role` (`STUDENT`, `LAB_STAFF`, `LAB_ADMIN`), `department`, `createdAt`
2. **`labs`**:
   - `id`, `code` (unique, e.g. `ECE-LAB-101`), `name`, `building`, `roomNumber`, `supervisorId` (FK -> `users.id`)
3. **`equipment`**:
   - `id`, `assetCode` (unique, e.g. `LP-ECE-OSC-0101`), `name`, `category` (12 categories: `OSCILLOSCOPE`, `POWER_SUPPLY`, `FUNCTION_GENERATOR`, `MULTIMETER`, `SPECTROPHOTOMETER`, `CENTRIFUGE`, `MICROSCOPE`, `AUTOCLAVE`, `CNC_MILL`, `PRINTER_3D`, `FURNACE`, `ANALYTICAL_BALANCE`), `modelNumber`, `serialNumber` (unique), `manufacturer`, `purchaseDate`, `warrantyExpiry`, `currentCondition` (`OPERATIONAL`, `DEGRADED`, `UNDER_MAINTENANCE`, `OUT_OF_SERVICE`, `DECOMMISSIONED`), `labId` (FK -> `labs.id`), `calibrationFrequencyDays`, `lastCalibratedAt`, `nextCalibrationDue`
4. **`fault_reports`**:
   - `id`, `faultCode` (unique, e.g. `FLT-2026-0001`), `equipmentId` (FK), `reportedById` (FK), `title`, `description`, `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `status` (`REPORTED`, `ASSIGNED`, `IN_REPAIR`, `RESOLVED`, `CLOSED`, `REJECTED`), `reportedAt`, `resolvedAt`
5. **`repair_records`**:
   - `id`, `repairTicketNumber` (unique, e.g. `REP-2026-0001`), `equipmentId` (FK), `faultReportId` (FK, nullable), `assignedToId` (FK -> `users.id`), `actionTaken`, `partsReplaced`, `repairCost`, `startedAt`, `completedAt`, `verifiedById` (FK -> `users.id`), `verifiedAt`, `restorationStatus` (`SCHEDULED`, `IN_PROGRESS`, `PENDING_VERIFICATION`, `VERIFIED_OPERATIONAL`, `UNRESOLVED`)
6. **`calibration_records`**:
   - `id`, `certificateNumber` (unique, e.g. `CAL-2026-0001`), `equipmentId` (FK), `performedById` (FK), `calibrationDate`, `nextDueDate`, `standardUsed` (e.g. NIST/ISO standard kit), `status` (`PASSED`, `PASSED_WITH_ADJUSTMENTS`, `FAILED`), `measurements`, `notes`
7. **`condition_history`** (Immutable Audit Trail):
   - `id`, `equipmentId` (FK), `changedById` (FK), `previousCondition`, `newCondition`, `reason`, `referenceType` (`FAULT_REPORT`, `REPAIR_ASSIGNED`, `REPAIR_COMPLETION`, `CALIBRATION`, `MANUAL_AUDIT`), `referenceId`, `timestamp`

---

## 4. PostgreSQL Analytical Queries

All dashboard metrics are computed in PostgreSQL:

### A. Equipment Downtime Calculation (CTE)
Calculates active outage and historical downtime hours using PostgreSQL date-arithmetic and a Common Table Expression:

```sql
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
```

### B. Equipment Ranked by Failure Frequency (Window Function)
Computes rank partitions using `DENSE_RANK()` based on fault frequency and critical severity occurrences:

```sql
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
```

---

## 5. Documented EXPLAIN ANALYZE Example

The following execution plan was produced by running `EXPLAIN (ANALYZE, BUFFERS)` on the Window Function failure ranking query against PostgreSQL:

```
                                                                         QUERY PLAN                                                                          
-------------------------------------------------------------------------------------------------------------------------------------------------------------
 Sort  (cost=83.70..84.08 rows=153 width=128) (actual time=0.212..0.214 rows=6.00 loops=1)
   Sort Key: ((dense_rank() OVER w1)::integer), equipmentfailures."faultCount" DESC
   Sort Method: quicksort  Memory: 26kB
   Buffers: shared hit=6
   ->  WindowAgg  (cost=74.72..78.15 rows=153 width=128) (actual time=0.171..0.183 rows=6.00 loops=1)
         Window: w1 AS (ORDER BY equipmentfailures."faultCount", equipmentfailures."criticalFaultCount" ROWS UNBOUNDED PRECEDING)
         Storage: Memory  Maximum Storage: 17kB
         Buffers: shared hit=3
         ->  Sort  (cost=74.70..75.09 rows=153 width=124) (actual time=0.163..0.166 rows=6.00 loops=1)
               Sort Key: equipmentfailures."faultCount" DESC, equipmentfailures."criticalFaultCount" DESC
               Sort Method: quicksort  Memory: 25kB
               Buffers: shared hit=3
               ->  Subquery Scan on equipmentfailures  (cost=61.49..69.15 rows=153 width=124) (actual time=0.151..0.157 rows=6.00 loops=1)
                     Buffers: shared hit=3
                     ->  HashAggregate  (cost=61.49..69.15 rows=153 width=124) (actual time=0.150..0.155 rows=6.00 loops=1)
                           Group Key: e."assetCode", l.name
                           Filter: ((count(f.id))::integer > 0)
                           Batches: 1  Memory Usage: 48kB
                           Rows Removed by Filter: 6
                           Buffers: shared hit=3
                           ->  Hash Join  (cost=37.55..54.59 rows=460 width=124) (actual time=0.114..0.130 rows=14.00 loops=1)
                                 Hash Cond: (e."labId" = l.id)
                                 Buffers: shared hit=3
                                 ->  Hash Right Join  (cost=16.98..32.79 rows=460 width=96) (actual time=0.049..0.061 rows=14.00 loops=1)
                                       Hash Cond: (f."equipmentId" = e.id)
                                       Buffers: shared hit=2
                                       ->  Seq Scan on fault_reports f  (cost=0.00..14.60 rows=460 width=20) (actual time=0.013..0.013 rows=8.00 loops=1)
                                             Buffers: shared hit=1
                                       ->  Hash  (cost=13.10..13.10 rows=310 width=80) (actual time=0.022..0.023 rows=12.00 loops=1)
                                             Buckets: 1024  Batches: 1  Memory Usage: 10kB
                                             Buffers: shared hit=1
                                             ->  Seq Scan on equipment e  (cost=0.00..13.10 rows=310 width=80) (actual time=0.012..0.014 rows=12.00 loops=1)
                                                   Buffers: shared hit=1
                                 ->  Hash  (cost=14.70..14.70 rows=470 width=36) (actual time=0.054..0.055 rows=4.00 loops=1)
                                       Buckets: 1024  Batches: 1  Memory Usage: 9kB
                                       Buffers: shared hit=1
                                       ->  Seq Scan on labs l  (cost=0.00..14.70 rows=470 width=36) (actual time=0.042..0.044 rows=4.00 loops=1)
                                             Buffers: shared hit=1
 Planning:
   Buffers: shared hit=387
 Planning Time: 18.996 ms
 Execution Time: 0.471 ms
```

### Analysis of the Query Plan:
1. **Hash Join / Hash Right Join**: Joins `equipment` with `labs` and `fault_reports`. The foreign key indexes on `equipment.labId` and `fault_reports.equipmentId` allow hash-matching in memory with minimal buffer accesses.
2. **HashAggregate**: Groups rows by equipment asset and lab name, computing `COUNT(f.id)` and `COUNT(CASE WHEN f.severity IN ('HIGH', 'CRITICAL'))`. Filter removes equipment with 0 faults.
3. **WindowAgg Node**: Evaluates `DENSE_RANK() OVER (ORDER BY "faultCount" DESC, "criticalFaultCount" DESC)`. Requires only `17kB` of execution memory.
4. **Execution Time**: The complete analytical calculation executes in **0.471 milliseconds**.

---

## 6. API Endpoint Documentation

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/equipment` | All | Paginated equipment register with lab, category, condition filters and sorting |
| `GET` | `/api/equipment/:id` | All | Detailed equipment record with specification, faults, repairs, calibrations |
| `GET` | `/api/equipment/:id/timeline` | All | Chronological auditable timeline unifying all faults, repairs, calibrations, condition transitions |
| `POST` | `/api/equipment` | Staff / Admin | Register new laboratory asset with initial condition history entry |
| `PUT` | `/api/equipment/:id` | Staff / Admin | Update equipment specifications |
| `GET` | `/api/faults` | All | Paginated fault incidents with severity and status filters |
| `POST` | `/api/faults` | Students / Staff | **Transactional**: Report fault, adjust condition (`DEGRADED`/`OUT_OF_SERVICE`), log condition history |
| `GET` | `/api/repairs` | All | Paginated maintenance work orders |
| `POST` | `/api/repairs` | Staff / Admin | Assign repair work order, set equipment to `UNDER_MAINTENANCE`, audit condition change |
| `PUT` | `/api/repairs/:id/action` | Staff / Admin | Log repair actions taken, parts replaced, repair costs, and transition status |
| `POST` | `/api/repairs/:id/restore` | Staff / Admin | **Transactional**: Verify repair, mark equipment `OPERATIONAL`, resolve linked fault, write condition audit |
| `GET` | `/api/calibrations` | All | Calibration records ledger |
| `GET` | `/api/calibrations/overdue` | All | List of all equipment past their calibration due date |
| `POST` | `/api/calibrations` | Staff / Admin | Record calibration certificate, update equipment calibration date, mark `DEGRADED` if failed |
| `GET` | `/api/dashboard/overview` | All | Compact metrics: operational rate, total downtime, open faults, overdue calibrations |
| `GET` | `/api/dashboard/downtime-by-equipment` | All | PostgreSQL CTE aggregating cumulative downtime hours per equipment |
| `GET` | `/api/dashboard/failure-ranking` | All | PostgreSQL Window Function ranking equipment by failure frequency (`DENSE_RANK()`) |
| `GET` | `/api/dashboard/recurring-faults` | All | Grouping recurring symptom patterns by category with average outage hours |
| `GET` | `/api/labs` | All | List of academic laboratories |
| `GET` | `/api/users` | All | List of college users for testing role-switching |

---

## 7. Setup & Running Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) running locally on port 5432

### Quick Setup

1. **Clone & Install Dependencies**:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Configure Database Connection**:
   Ensure `backend/.env` contains your PostgreSQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:Siddhu0911@localhost:5432/labpulse?schema=public"
   ```

3. **Run Prisma Migrations & Seed Data**:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   node prisma/seed.js
   ```

4. **Start the Applications**:
   ```bash
   # Terminal 1: Start Backend (Port 5000)
   cd backend
   npm run dev

   # Terminal 2: Start Frontend (Port 3000)
   cd frontend
   npm run dev
   ```

5. **Open Browser**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 8. Manual Testing Instructions

Follow this complete step-by-step test lifecycle:

### Test Flow 1: Equipment Register & Navigation
1. Open `http://localhost:3000/`.
2. Notice the top role switcher in the navbar:
   - Select **`Priya Sharma (STUDENT)`** to test student privileges.
   - Select **`Dr. Aris Thorne (LAB_STAFF)`** to test lab supervisor privileges.
   - Select **`Prof. Nathan Vance (LAB_ADMIN)`** to test administrator privileges.
3. Test the filter toolbar:
   - Filter by **Laboratory**: e.g., `Precision Electronics & Microcontrollers Lab`.
   - Filter by **Condition**: e.g., `UNDER_MAINTENANCE` or `OUT_OF_SERVICE`.
   - Search by asset code: type `LP-ECE-OSC-0101`.
   - Toggle sorting by Asset Code, Purchase Date, or Calibration Due date.

### Test Flow 2: Fault Reporting Lifecycle (Student or Staff)
1. In the top bar or register table, click **"Report Equipment Fault"**.
2. Select equipment: `LP-ECE-OSC-0101 (Tektronix Oscilloscope)`.
3. Fill in:
   - **Summary**: `Intermittent probe calibration signal loss`.
   - **Severity**: `MEDIUM`.
   - **Resulting Condition**: `DEGRADED`.
   - **Description**: `Probe compensation square wave at 1kHz shows rounding and baseline drift under CH1 BNC connector`.
4. Click **"Log Fault in Ledger"**.
5. Observe:
   - Equipment condition transitions immediately from `OPERATIONAL` to `DEGRADED`.
   - Fault code `FLT-2026-XXXX` is generated.
   - Downtime tracking clock starts immediately.
   - An immutable condition history audit entry is stamped with the user's name and role.

### Test Flow 3: Maintenance Assignment & Action Logging (Staff Role)
1. Switch role to **`Dr. Aris Thorne (LAB_STAFF)`** or **`Marcus Vance (LAB_STAFF)`**.
2. Navigate to **Work Orders** (`/repairs`) or click into the equipment detail page.
3. On the fault or equipment, click **"Assign Work Order"**.
4. Assign to technician **`Marcus Vance`** with work scope notes: `Inspect front-panel BNC grounding spring and reflow solder joints`.
5. Equipment condition updates to `UNDER_MAINTENANCE` in the ledger.
6. Click **"Update"** on the work order:
   - Record Action: `Cleaned BNC contacts with deoxit, reflowed cracked solder pad on attenuator PCB`.
   - Parts Replaced: `None (cleaned & resoldered)`.
   - Repair Cost: `$25.00`.
   - Status: `PENDING_VERIFICATION`.
7. Click **"Update Work Order"**.

### Test Flow 4: Operational Verification Transaction & Duplicate Prevention
1. As **`Dr. Aris Thorne (LAB_STAFF)`**, locate the work order in `PENDING_VERIFICATION` status.
2. Click **"Verify & Restore"**.
3. Enter verification notes: `Square wave rise time and calibration signal verified with 10X attenuation probe`.
4. Click **"Certify & Mark Operational"**.
5. **Database Transaction Result**:
   - The repair ticket is marked `VERIFIED_OPERATIONAL`.
   - The associated fault report is marked `RESOLVED` with an exact restoration timestamp.
   - The equipment condition is updated to `OPERATIONAL`.
   - An auditable condition history record is created referencing the repair ticket number.
   - **Duplicate Prevention**: If any user attempts to verify an already verified ticket, the backend blocks it with `400 Bad Request`.

### Test Flow 5: Calibration Certification & Overdue Compliance
1. On an asset (e.g. `LP-CHEM-AUT-0103`), click **"Log Calibration"** or navigate to `/dashboard` and click **"Calibrate"** from the **Overdue Calibration Alert Board**.
2. Fill in:
   - Standard Used: `ISO/IEC 17025 Standard Pressure & Temperature Calibrator`.
   - Result: `PASSED`.
   - Measurements: `Operating temperature: 121.2C (+/- 0.2C), Chamber pressure: 1.05 bar`.
   - Next Due Date: 90 days ahead.
3. Click **"Affix Calibration Certificate"**.
4. Notice the overdue warning disappears and the asset's next calibration due date updates immediately.

### Test Flow 6: Reliability Dashboard Analytics
1. Navigate to **Reliability Dashboard** (`/dashboard`).
2. Verify:
   - **Operational Availability Rate**: live percentage calculated from PostgreSQL.
   - **Total System Downtime**: sum of hours calculated using PostgreSQL date epoch difference.
   - **Equipment Ranked by Failure Frequency**: Window function ranking showing Rank #1 (`Haas Mini Mill`), Rank #2 (`Tektronix Oscilloscope`), etc.
   - **Equipment Total Downtime Ledger**: CTE aggregating cumulative and average downtime hours per incident.
   - **Recurring Laboratory Fault Patterns**: Identified failure symptoms grouped across categories.
#   L a b P u l s e  
 