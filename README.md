# LabPulse

**Live demo:** https://lab-pulse-dun.vercel.app/
**GitHub:** https://github.com/Codebyrithwik07/LabPulse

LabPulse is a web app for keeping track of equipment in college labs. In most engineering colleges, lab equipment problems get noted on paper or in someone's WhatsApp messages, and nobody really knows how long a machine was down or when it was last calibrated. I built this to fix that by keeping one proper record of every asset, every fault, every repair and every calibration.

## What it does

- Keeps a register of all lab equipment with asset codes, models, serial numbers, warranty and current condition
- Lets students and staff report faults, with a severity level
- Lets lab staff assign repair work orders, log what was done and verify the equipment before marking it working again
- Tracks calibration certificates and flags anything that is overdue
- Shows a reliability dashboard with downtime, failure ranking and recurring problems
- Keeps a timeline for each piece of equipment, so you can see everything that ever happened to it in order

## Tech stack

**Frontend**
- React 19 with Vite
- React Router for pages
- TanStack Query for fetching and caching data
- React Hook Form for the forms
- Axios for API calls
- Plain CSS with my own colour tokens (no Tailwind)
- Lucide React for icons

**Backend**
- Node.js and Express
- Prisma ORM
- PostgreSQL
- Zod for validating requests

**Deployment**
- Vercel

## Concepts I used

**Layered backend.** The backend is split into routes, controllers, services and repositories. Routes only define URLs, controllers handle the request and response, services hold the business logic, and repositories talk to the database. It made the code easier to debug because every file has one job.

**Normalized database.** The schema has 7 tables (users, labs, equipment, fault reports, repair records, calibration records and condition history) with foreign keys, enums, unique constraints and indexes. I kept it in third normal form so the same data isn't stored in two places.

**Role based access.** There are three roles: student, lab staff and lab admin. Students can report faults, staff can handle repairs and calibrations, and admins can do everything. There is a role switcher in the navbar so you can try each role without logging in again.

**Database transactions.** Some actions change several tables at once. For example, reporting a fault creates the fault, changes the equipment condition and writes a history entry. Verifying a repair closes the ticket, resolves the fault and sets the equipment back to operational. These run inside a transaction so either everything saves or nothing does.

**Audit trail.** Every condition change on equipment is written to a `condition_history` table with who did it, when, and why. Entries are never edited, only added, so there is always a trustworthy history.

**Analytics in SQL.** I wanted the database to do the heavy calculation instead of doing it in JavaScript.
- Downtime per equipment is calculated with a CTE, using the gap between when a fault was reported and when it was resolved (or now, if it is still open).
- Failure ranking uses the `DENSE_RANK()` window function, ordered by fault count and then by critical faults.

I also ran `EXPLAIN ANALYZE` on the ranking query to check how it executes. On the seed data it finishes in under 1 ms.

**Duplicate prevention.** If someone tries to verify a repair that is already verified, the API rejects it with a 400 error instead of writing it twice.

**Validation.** Incoming data is checked with Zod before it reaches the database, so bad input fails early with a clear message.

## Database overview

```
users --- labs --- equipment --- fault_reports
                       |--------- repair_records
                       |--------- calibration_records
                       |--------- condition_history
```

Equipment supports 12 categories (oscilloscope, power supply, multimeter, centrifuge, autoclave, CNC mill, 3D printer and so on) and 5 conditions: operational, degraded, under maintenance, out of service and decommissioned.

## API summary

| Area | Endpoints |
| :--- | :--- |
| Equipment | list, details, timeline, create, update |
| Faults | list, report a fault |
| Repairs | list, assign, log action, verify and restore |
| Calibrations | list, overdue list, record certificate |
| Dashboard | overview, downtime by equipment, failure ranking, recurring faults |
| Other | labs, users |

## Running it locally

You need Node.js 18+ and PostgreSQL running on your machine.

1. Clone the repo and install packages
   ```bash
   git clone https://github.com/Codebyrithwik07/LabPulse.git
   cd LabPulse/backend && npm install
   cd ../frontend && npm install
   ```

2. Create `backend/.env`
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/labpulse?schema=public"
   ```

3. Set up the database and add sample data
   ```bash
   cd backend
   npx prisma migrate dev --name init
   node prisma/seed.js
   ```

4. Start both servers
   ```bash
   # backend
   cd backend && npm run dev

   # frontend (new terminal)
   cd frontend && npm run dev
   ```

5. Open http://localhost:3000

## Things I'd like to add later

- Real login instead of the role switcher
- Email alerts for overdue calibrations
- Export reports as PDF or CSV
- Charts for downtime trends over time

## Author

Rithwik
GitHub: [@Codebyrithwik07](https://github.com/Codebyrithwik07)
