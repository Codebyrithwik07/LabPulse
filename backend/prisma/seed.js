import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding for LabPulse...');

  // Clean existing tables in proper order
  await prisma.conditionHistory.deleteMany();
  await prisma.calibrationRecord.deleteMany();
  await prisma.repairRecord.deleteMany();
  await prisma.faultReport.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Cleared existing records.');

  // 1. Seed Users
  const userStaff1 = await prisma.user.create({
    data: {
      name: 'Dr. Aris Thorne',
      email: 'a.thorne@college.edu',
      role: 'LAB_STAFF',
      department: 'Electrical & Computer Engineering',
    },
  });

  const userStaff2 = await prisma.user.create({
    data: {
      name: 'Dr. Elena Rostova',
      email: 'e.rostova@college.edu',
      role: 'LAB_STAFF',
      department: 'Mechanical Engineering',
    },
  });

  const userTech1 = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'm.vance@college.edu',
      role: 'LAB_STAFF',
      department: 'Central Instrumentation Facility',
    },
  });

  const userAdmin = await prisma.user.create({
    data: {
      name: 'Prof. Nathan Vance',
      email: 'n.vance@college.edu',
      role: 'LAB_ADMIN',
      department: 'Dean of Academic Laboratories',
    },
  });

  const userStudent1 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'p.sharma@student.college.edu',
      role: 'STUDENT',
      department: 'Electrical Engineering (Batch 2023-27)',
    },
  });

  const userStudent2 = await prisma.user.create({
    data: {
      name: 'David Chen',
      email: 'd.chen@student.college.edu',
      role: 'STUDENT',
      department: 'Mechanical Engineering (Batch 2024-28)',
    },
  });

  const userStudent3 = await prisma.user.create({
    data: {
      name: 'Aisha Al-Mansoor',
      email: 'a.mansoor@student.college.edu',
      role: 'STUDENT',
      department: 'Materials Science (Batch 2023-27)',
    },
  });

  console.log('[Seed] Created college users.');

  // 2. Seed Labs
  const labECE = await prisma.lab.create({
    data: {
      code: 'ECE-LAB-101',
      name: 'Precision Electronics & Microcontrollers Lab',
      building: 'Turing Hall',
      roomNumber: '104-A',
      supervisorId: userStaff1.id,
    },
  });

  const labMECH = await prisma.lab.create({
    data: {
      code: 'MECH-LAB-202',
      name: 'Advanced Fabrication & CNC Machining Lab',
      building: 'Watt Engineering Centre',
      roomNumber: '210',
      supervisorId: userStaff2.id,
    },
  });

  const labPHYS = await prisma.lab.create({
    data: {
      code: 'PHYS-LAB-301',
      name: 'Laser Optics & Photonics Research Cell',
      building: 'Curie Physics Wing',
      roomNumber: '305',
      supervisorId: userStaff1.id,
    },
  });

  const labCHEM = await prisma.lab.create({
    data: {
      code: 'CHEM-LAB-105',
      name: 'Materials Characterization & Spectroscopy Lab',
      building: 'Mendeleev Hall',
      roomNumber: '112-B',
      supervisorId: userStaff2.id,
    },
  });

  console.log('[Seed] Created academic laboratories.');

  // Helper date calculation
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // 3. Seed Equipment
  const eq1 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-ECE-OSC-0101',
      name: 'Tektronix TBS2104B 100MHz Digital Storage Oscilloscope',
      category: 'OSCILLOSCOPE',
      modelNumber: 'TBS2104B-EN',
      serialNumber: 'SN-TKX-8829104',
      manufacturer: 'Tektronix Inc.',
      purchaseDate: daysAgo(720),
      warrantyExpiry: daysAhead(180),
      currentCondition: 'OPERATIONAL',
      labId: labECE.id,
      calibrationFrequencyDays: 180,
      lastCalibratedAt: daysAgo(45),
      nextCalibrationDue: daysAhead(135),
    },
  });

  const eq2 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-ECE-PWR-0102',
      name: 'Keysight E3631A Triple Output Programmable DC Supply',
      category: 'POWER_SUPPLY',
      modelNumber: 'E3631A-GPIB',
      serialNumber: 'SN-KST-4491023',
      manufacturer: 'Keysight Technologies',
      purchaseDate: daysAgo(850),
      warrantyExpiry: daysAgo(120),
      currentCondition: 'UNDER_MAINTENANCE',
      labId: labECE.id,
      calibrationFrequencyDays: 90,
      lastCalibratedAt: daysAgo(110),
      nextCalibrationDue: daysAgo(20), // OVERDUE CALIBRATION
    },
  });

  const eq3 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-ECE-FGN-0103',
      name: 'Rigol DG1022Z 25MHz Arbitrary Waveform Generator',
      category: 'FUNCTION_GENERATOR',
      modelNumber: 'DG1022Z',
      serialNumber: 'SN-RGL-3104928',
      manufacturer: 'Rigol Technologies',
      purchaseDate: daysAgo(400),
      warrantyExpiry: daysAhead(330),
      currentCondition: 'OPERATIONAL',
      labId: labECE.id,
      calibrationFrequencyDays: 180,
      lastCalibratedAt: daysAgo(30),
      nextCalibrationDue: daysAhead(150),
    },
  });

  const eq4 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-MECH-CNC-0201',
      name: 'Haas Mini Mill 3-Axis CNC Machining Center',
      category: 'CNC_MILL',
      modelNumber: 'MINI-MILL-HE',
      serialNumber: 'SN-HAS-9018274',
      manufacturer: 'Haas Automation',
      purchaseDate: daysAgo(1100),
      warrantyExpiry: daysAgo(370),
      currentCondition: 'OUT_OF_SERVICE',
      labId: labMECH.id,
      calibrationFrequencyDays: 90,
      lastCalibratedAt: daysAgo(105),
      nextCalibrationDue: daysAgo(15), // OVERDUE CALIBRATION
    },
  });

  const eq5 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-MECH-PRN-0202',
      name: 'Ultimaker S5 Industrial Dual-Extrusion 3D Printer',
      category: 'PRINTER_3D',
      modelNumber: 'S5-PRO-BUNDLE',
      serialNumber: 'SN-ULT-6629104',
      manufacturer: 'Ultimaker B.V.',
      purchaseDate: daysAgo(320),
      warrantyExpiry: daysAhead(410),
      currentCondition: 'OPERATIONAL',
      labId: labMECH.id,
      calibrationFrequencyDays: 120,
      lastCalibratedAt: daysAgo(60),
      nextCalibrationDue: daysAhead(60),
    },
  });

  const eq6 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-MECH-FRN-0203',
      name: 'Thermo Scientific Lindberg/Blue M 1200C Box Furnace',
      category: 'FURNACE',
      modelNumber: 'BF51828C-1',
      serialNumber: 'SN-TSF-1192847',
      manufacturer: 'Thermo Fisher Scientific',
      purchaseDate: daysAgo(1400),
      warrantyExpiry: daysAgo(670),
      currentCondition: 'DEGRADED',
      labId: labMECH.id,
      calibrationFrequencyDays: 90,
      lastCalibratedAt: daysAgo(85),
      nextCalibrationDue: daysAhead(5),
    },
  });

  const eq7 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-PHYS-OPT-0301',
      name: 'Thorlabs HNL210L HeNe Polarized Laser System 632.8nm',
      category: 'MICROSCOPE',
      modelNumber: 'HNL210L-632',
      serialNumber: 'SN-THO-5529183',
      manufacturer: 'Thorlabs Inc.',
      purchaseDate: daysAgo(520),
      warrantyExpiry: daysAhead(210),
      currentCondition: 'OPERATIONAL',
      labId: labPHYS.id,
      calibrationFrequencyDays: 180,
      lastCalibratedAt: daysAgo(20),
      nextCalibrationDue: daysAhead(160),
    },
  });

  const eq8 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-PHYS-SPC-0302',
      name: 'Ocean Insight Flame-S UV-Vis High-Resolution Spectrometer',
      category: 'SPECTROPHOTOMETER',
      modelNumber: 'FLAME-S-UV-VIS',
      serialNumber: 'SN-OIS-7718290',
      manufacturer: 'Ocean Insight',
      purchaseDate: daysAgo(610),
      warrantyExpiry: daysAhead(120),
      currentCondition: 'DEGRADED',
      labId: labPHYS.id,
      calibrationFrequencyDays: 90,
      lastCalibratedAt: daysAgo(95),
      nextCalibrationDue: daysAgo(5), // OVERDUE CALIBRATION
    },
  });

  const eq9 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-CHEM-CEN-0101',
      name: 'Eppendorf 5804R High-Speed Refrigerated Centrifuge',
      category: 'CENTRIFUGE',
      modelNumber: '5804R-G',
      serialNumber: 'SN-EPP-3391827',
      manufacturer: 'Eppendorf AG',
      purchaseDate: daysAgo(480),
      warrantyExpiry: daysAhead(250),
      currentCondition: 'OPERATIONAL',
      labId: labCHEM.id,
      calibrationFrequencyDays: 120,
      lastCalibratedAt: daysAgo(40),
      nextCalibrationDue: daysAhead(80),
    },
  });

  const eq10 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-CHEM-BAL-0102',
      name: 'Mettler Toledo XPR205 Analytical Micro-Balance (0.01mg)',
      category: 'ANALYTICAL_BALANCE',
      modelNumber: 'XPR205-FACT',
      serialNumber: 'SN-MTD-9928103',
      manufacturer: 'Mettler-Toledo International',
      purchaseDate: daysAgo(350),
      warrantyExpiry: daysAhead(380),
      currentCondition: 'OPERATIONAL',
      labId: labCHEM.id,
      calibrationFrequencyDays: 60,
      lastCalibratedAt: daysAgo(15),
      nextCalibrationDue: daysAhead(45),
    },
  });

  const eq11 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-CHEM-AUT-0103',
      name: 'Tuttnauer 3870EA Large Capacity Laboratory Autoclave',
      category: 'AUTOCLAVE',
      modelNumber: '3870EA-PLUS',
      serialNumber: 'SN-TUT-4829105',
      manufacturer: 'Tuttnauer Medical Ltd.',
      purchaseDate: daysAgo(900),
      warrantyExpiry: daysAgo(170),
      currentCondition: 'UNDER_MAINTENANCE',
      labId: labCHEM.id,
      calibrationFrequencyDays: 90,
      lastCalibratedAt: daysAgo(125),
      nextCalibrationDue: daysAgo(35), // OVERDUE CALIBRATION
    },
  });

  const eq12 = await prisma.equipment.create({
    data: {
      assetCode: 'LP-ECE-DMM-0104',
      name: 'Fluke 8846A 6.5 Digit Precision Multimeter',
      category: 'MULTIMETER',
      modelNumber: '8846A-120V',
      serialNumber: 'SN-FLK-2019482',
      manufacturer: 'Fluke Corporation',
      purchaseDate: daysAgo(580),
      warrantyExpiry: daysAhead(150),
      currentCondition: 'OPERATIONAL',
      labId: labECE.id,
      calibrationFrequencyDays: 180,
      lastCalibratedAt: daysAgo(70),
      nextCalibrationDue: daysAhead(110),
    },
  });

  console.log('[Seed] Created 12 equipment assets.');

  // 4. Seed Historical and Active Fault Reports
  // Past resolved fault on eq1 (Oscilloscope)
  const f1 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2025-0012',
      equipmentId: eq1.id,
      reportedById: userStudent1.id,
      title: 'Channel 2 vertical deflection erratic drift',
      description: 'During frequency response lab session, Channel 2 trace began fluctuating with +1.2V DC offset drift regardless of coupling setting.',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      reportedAt: daysAgo(140),
      resolvedAt: daysAgo(136), // 4 days downtime (96 hours)
    },
  });

  // Another past resolved fault on eq1
  const f2 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2026-0004',
      equipmentId: eq1.id,
      reportedById: userStudent1.id,
      title: 'Rotary encoder skip on horizontal timebase dial',
      description: 'Horizontal scale knob misses steps when turned clockwise rapidly, jumping from 10us to 500us.',
      severity: 'LOW',
      status: 'RESOLVED',
      reportedAt: daysAgo(60),
      resolvedAt: daysAgo(58), // 2 days downtime (48 hours)
    },
  });

  // Open critical fault on eq4 (Haas CNC Mill)
  const f3 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2026-0018',
      equipmentId: eq4.id,
      reportedById: userStudent2.id,
      title: 'Spindle drive alarm 123: vector drive fault',
      description: 'Spindle stalled abruptly during face milling pass at 3500 RPM. Control panel threw Alarm 123 Spindle Drive Fault. Machine locked out immediately.',
      severity: 'CRITICAL',
      status: 'IN_REPAIR',
      reportedAt: daysAgo(8), // Active downtime ~192 hours
    },
  });

  // Past fault on eq4 (Haas CNC Mill)
  const f4 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2025-0045',
      equipmentId: eq4.id,
      reportedById: userStaff2.id,
      title: 'X-axis ballscrew backlash exceeding 0.04mm',
      description: 'Surface finish showing periodic chatter marks. Indicator verification showed 0.045mm mechanical backlash on table travel.',
      severity: 'HIGH',
      status: 'RESOLVED',
      reportedAt: daysAgo(180),
      resolvedAt: daysAgo(172), // 8 days downtime (192 hours)
    },
  });

  // Active fault on eq2 (Keysight Power Supply)
  const f5 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2026-0021',
      equipmentId: eq2.id,
      reportedById: userStudent1.id,
      title: 'Output 2 (+25V) current foldback trip under 500mA load',
      description: 'Output 2 prematurely triggers overcurrent protection even when current limit is dialed to 1.0A. Voltage collapses to 0.4V.',
      severity: 'HIGH',
      status: 'ASSIGNED',
      reportedAt: daysAgo(4), // Active downtime ~96 hours
    },
  });

  // Active fault on eq6 (Furnace)
  const f6 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2026-0025',
      equipmentId: eq6.id,
      reportedById: userStudent3.id,
      title: 'Heating chamber zone 2 thermocouple thermal lag',
      description: 'Zone 2 temperature readout lags controller setpoint by ~45°C during ramp cycles beyond 800°C. Sintering consistency degraded.',
      severity: 'MEDIUM',
      status: 'REPORTED',
      reportedAt: daysAgo(2), // Active downtime ~48 hours
    },
  });

  // Active fault on eq11 (Autoclave)
  const f7 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2026-0028',
      equipmentId: eq11.id,
      reportedById: userStaff2.id,
      title: 'Chamber gasket pressure bleed at 121C cycle',
      description: 'Exhaust pressure valve whistling and silicone door gasket showing micro-fissures. Cycle aborted due to failed pressure seal.',
      severity: 'CRITICAL',
      status: 'ASSIGNED',
      reportedAt: daysAgo(6), // Active downtime ~144 hours
    },
  });

  // Degraded fault on eq8 (Spectrometer)
  const f8 = await prisma.faultReport.create({
    data: {
      faultCode: 'FLT-2026-0030',
      equipmentId: eq8.id,
      reportedById: userStudent3.id,
      title: 'CCD dark current baseline elevated in UV band (220-300nm)',
      description: 'Spectral absorbance baseline shows 15% elevated noise floor below 300nm. Requires frequent dark spectrum subtraction.',
      severity: 'LOW',
      status: 'REPORTED',
      reportedAt: daysAgo(5),
    },
  });

  console.log('[Seed] Created fault reports.');

  // 5. Seed Repair Records
  // Completed repair for f1 (Oscilloscope)
  const rep1 = await prisma.repairRecord.create({
    data: {
      repairTicketNumber: 'REP-2025-0010',
      equipmentId: eq1.id,
      faultReportId: f1.id,
      assignedToId: userTech1.id,
      actionTaken: 'De-soldered and replaced dry electrolytic filter capacitor C412 on analog pre-amplifier board. Recalibrated vertical front-end attenuator.',
      partsReplaced: 'Capacitor 47uF 50V Low-ESR, SMD trim resistor',
      repairCost: 45.0,
      startedAt: daysAgo(139),
      completedAt: daysAgo(136),
      verifiedById: userStaff1.id,
      verifiedAt: daysAgo(136),
      restorationStatus: 'VERIFIED_OPERATIONAL',
    },
  });

  // Completed repair for f2 (Oscilloscope)
  const rep2 = await prisma.repairRecord.create({
    data: {
      repairTicketNumber: 'REP-2026-0003',
      equipmentId: eq1.id,
      faultReportId: f2.id,
      assignedToId: userTech1.id,
      actionTaken: 'Cleaned Bourns quadrature optical encoder contacts with isopropyl alcohol. Reflowed cracked solder joints on front-panel sub-assembly.',
      partsReplaced: 'None (contact cleaning and joint reflow)',
      repairCost: 15.0,
      startedAt: daysAgo(59),
      completedAt: daysAgo(58),
      verifiedById: userStaff1.id,
      verifiedAt: daysAgo(58),
      restorationStatus: 'VERIFIED_OPERATIONAL',
    },
  });

  // Completed repair for f4 (Haas CNC Mill)
  const rep3 = await prisma.repairRecord.create({
    data: {
      repairTicketNumber: 'REP-2025-0032',
      equipmentId: eq4.id,
      faultReportId: f4.id,
      assignedToId: userTech1.id,
      actionTaken: 'Re-shimmed X-axis double-nut ball screw assembly, flushed coolant contamination from gib ways, and adjusted motor coupling preload torque.',
      partsReplaced: 'Haas X-axis pre-load precision shim pack (0.01-0.05mm)',
      repairCost: 320.0,
      startedAt: daysAgo(178),
      completedAt: daysAgo(172),
      verifiedById: userStaff2.id,
      verifiedAt: daysAgo(172),
      restorationStatus: 'VERIFIED_OPERATIONAL',
    },
  });

  // In-progress repair for f3 (Haas CNC Mill Spindle drive)
  const rep4 = await prisma.repairRecord.create({
    data: {
      repairTicketNumber: 'REP-2026-0015',
      equipmentId: eq4.id,
      faultReportId: f3.id,
      assignedToId: userTech1.id,
      actionTaken: 'Inspected 40HP Vector Drive module. Found IGBT transistor bank phase U shorted to DC bus. OEM replacement module ordered from Haas service.',
      partsReplaced: 'Pending arrival: Vector Drive Rev T board (Part # 93-30-4101)',
      repairCost: 1450.0,
      startedAt: daysAgo(7),
      restorationStatus: 'IN_PROGRESS',
    },
  });

  // Scheduled repair for f5 (Keysight Power supply)
  const rep5 = await prisma.repairRecord.create({
    data: {
      repairTicketNumber: 'REP-2026-0017',
      equipmentId: eq2.id,
      faultReportId: f5.id,
      assignedToId: userStaff1.id,
      actionTaken: 'Bench diagnostics scheduled. Suspected burnt current sensing shunt resistor or sense op-amp OP27 drift.',
      partsReplaced: null,
      repairCost: 0.0,
      startedAt: daysAgo(3),
      restorationStatus: 'SCHEDULED',
    },
  });

  // In-progress repair for f7 (Autoclave)
  const rep6 = await prisma.repairRecord.create({
    data: {
      repairTicketNumber: 'REP-2026-0019',
      equipmentId: eq11.id,
      faultReportId: f7.id,
      assignedToId: userTech1.id,
      actionTaken: 'Disassembled door flange, removed degraded EPDM silicone seal ring, cleaned sealing groove. New high-temp gasket fitted.',
      partsReplaced: 'Tuttnauer Door Gasket 3870 (Part # 02610023)',
      repairCost: 110.0,
      startedAt: daysAgo(5),
      completedAt: daysAgo(1),
      restorationStatus: 'PENDING_VERIFICATION',
    },
  });

  console.log('[Seed] Created repair records.');

  // 6. Seed Calibration Records
  await prisma.calibrationRecord.create({
    data: {
      certificateNumber: 'CAL-2026-0014',
      equipmentId: eq1.id,
      performedById: userStaff1.id,
      calibrationDate: daysAgo(45),
      nextDueDate: daysAhead(135),
      standardUsed: 'Fluke 9500B Oscilloscope Calibrator (NIST Traceable #FLK-9500-9812)',
      status: 'PASSED',
      measurements: 'Bandwidth: 104.2MHz (+4.2%), Rise time: 3.36ns, DC gain accuracy: +/- 1.1% across all 4 channels.',
      notes: 'All channels meet factory calibration specifications. Inspection seal affixed.',
    },
  });

  await prisma.calibrationRecord.create({
    data: {
      certificateNumber: 'CAL-2026-0008',
      equipmentId: eq10.id,
      performedById: userStaff2.id,
      calibrationDate: daysAgo(15),
      nextDueDate: daysAhead(45),
      standardUsed: 'E2 Class Stainless Steel Precision Weight Set (Calibration Cert #DKD-K-02901)',
      status: 'PASSED',
      measurements: 'Linearity error: +0.02mg, Repeatability standard deviation: 0.008mg at 100g nominal load.',
      notes: 'Corner load test passed within +/- 0.03mg. Micro-balance leveled and draft shields checked.',
    },
  });

  await prisma.calibrationRecord.create({
    data: {
      certificateNumber: 'CAL-2025-0089',
      equipmentId: eq2.id,
      performedById: userTech1.id,
      calibrationDate: daysAgo(110),
      nextDueDate: daysAgo(20), // OVERDUE
      standardUsed: 'Agilent 34401A 6.5 Digit Precision DMM',
      status: 'PASSED_WITH_ADJUSTMENTS',
      measurements: 'Output 1: 0-6V (+0.05% error, trimmed to +0.01%). Output 2: 0-25V (+0.12% error, trimmed).',
      notes: 'Trimmed DAC zero and full scale points. Recommended recertification in 90 days.',
    },
  });

  await prisma.calibrationRecord.create({
    data: {
      certificateNumber: 'CAL-2026-0019',
      equipmentId: eq7.id,
      performedById: userStaff1.id,
      calibrationDate: daysAgo(20),
      nextDueDate: daysAhead(160),
      standardUsed: 'Coherent FieldMaxII-TOP Laser Power Meter with OP-2 VIS Sensor',
      status: 'PASSED',
      measurements: 'Center wavelength: 632.81nm, Output optical power: 2.18mW, Beam divergence: 1.24 mrad.',
      notes: 'TEM00 spatial mode verified. Optical cavity mirrors clean.',
    },
  });

  await prisma.calibrationRecord.create({
    data: {
      certificateNumber: 'CAL-2025-0074',
      equipmentId: eq8.id,
      performedById: userStaff2.id,
      calibrationDate: daysAgo(95),
      nextDueDate: daysAgo(5), // OVERDUE
      standardUsed: 'Ocean Insight HG-1 Mercury-Argon Spectral Calibration Source',
      status: 'PASSED_WITH_ADJUSTMENTS',
      measurements: 'Peak alignment error: 0.18nm at 253.65nm Hg line. Adjusted polynomial coefficients.',
      notes: 'UV band baseline noise elevated. Schedule deep CCD sensor servicing.',
    },
  });

  console.log('[Seed] Created calibration records.');

  // 7. Seed Condition History (Auditable ledger)
  await prisma.conditionHistory.createMany({
    data: [
      {
        equipmentId: eq1.id,
        changedById: userStaff1.id,
        previousCondition: 'OPERATIONAL',
        newCondition: 'OPERATIONAL',
        reason: 'Asset inducted into Precision Electronics inventory',
        referenceType: 'MANUAL_AUDIT',
        referenceId: eq1.assetCode,
        timestamp: daysAgo(720),
      },
      {
        equipmentId: eq1.id,
        changedById: userStudent1.id,
        previousCondition: 'OPERATIONAL',
        newCondition: 'DEGRADED',
        reason: 'Fault reported [FLT-2025-0012] - Channel 2 vertical deflection erratic drift',
        referenceType: 'FAULT_REPORT',
        referenceId: 'FLT-2025-0012',
        timestamp: daysAgo(140),
      },
      {
        equipmentId: eq1.id,
        changedById: userStaff1.id,
        previousCondition: 'DEGRADED',
        newCondition: 'OPERATIONAL',
        reason: 'Repair verified and equipment certified operational [Ticket: REP-2025-0010]',
        referenceType: 'REPAIR_COMPLETION',
        referenceId: 'REP-2025-0010',
        timestamp: daysAgo(136),
      },
      {
        equipmentId: eq4.id,
        changedById: userStaff2.id,
        previousCondition: 'OPERATIONAL',
        newCondition: 'OPERATIONAL',
        reason: 'CNC mill commissioned in Watt Engineering Centre',
        referenceType: 'MANUAL_AUDIT',
        referenceId: eq4.assetCode,
        timestamp: daysAgo(1100),
      },
      {
        equipmentId: eq4.id,
        changedById: userStaff2.id,
        previousCondition: 'OPERATIONAL',
        newCondition: 'DEGRADED',
        reason: 'Fault reported [FLT-2025-0045] - X-axis ballscrew backlash exceeding 0.04mm',
        referenceType: 'FAULT_REPORT',
        referenceId: 'FLT-2025-0045',
        timestamp: daysAgo(180),
      },
      {
        equipmentId: eq4.id,
        changedById: userStaff2.id,
        previousCondition: 'DEGRADED',
        newCondition: 'OPERATIONAL',
        reason: 'Repair verified and equipment certified operational [Ticket: REP-2025-0032]',
        referenceType: 'REPAIR_COMPLETION',
        referenceId: 'REP-2025-0032',
        timestamp: daysAgo(172),
      },
      {
        equipmentId: eq4.id,
        changedById: userStudent2.id,
        previousCondition: 'OPERATIONAL',
        newCondition: 'OUT_OF_SERVICE',
        reason: 'Fault reported [FLT-2026-0018] - Spindle drive alarm 123: vector drive fault',
        referenceType: 'FAULT_REPORT',
        referenceId: 'FLT-2026-0018',
        timestamp: daysAgo(8),
      },
      {
        equipmentId: eq2.id,
        changedById: userStudent1.id,
        previousCondition: 'OPERATIONAL',
        newCondition: 'DEGRADED',
        reason: 'Fault reported [FLT-2026-0021] - Output 2 (+25V) current foldback trip under 500mA load',
        referenceType: 'FAULT_REPORT',
        referenceId: 'FLT-2026-0021',
        timestamp: daysAgo(4),
      },
      {
        equipmentId: eq2.id,
        changedById: userStaff1.id,
        previousCondition: 'DEGRADED',
        newCondition: 'UNDER_MAINTENANCE',
        reason: 'Repair initiated [REP-2026-0017]',
        referenceType: 'REPAIR_ASSIGNED',
        referenceId: 'REP-2026-0017',
        timestamp: daysAgo(3),
      },
      {
        equipmentId: eq11.id,
        changedById: userStaff2.id,
        previousCondition: 'OPERATIONAL',
        newCondition: 'OUT_OF_SERVICE',
        reason: 'Fault reported [FLT-2026-0028] - Chamber gasket pressure bleed at 121C cycle',
        referenceType: 'FAULT_REPORT',
        referenceId: 'FLT-2026-0028',
        timestamp: daysAgo(6),
      },
      {
        equipmentId: eq11.id,
        changedById: userTech1.id,
        previousCondition: 'OUT_OF_SERVICE',
        newCondition: 'UNDER_MAINTENANCE',
        reason: 'Repair initiated [REP-2026-0019]',
        referenceType: 'REPAIR_ASSIGNED',
        referenceId: 'REP-2026-0019',
        timestamp: daysAgo(5),
      },
    ],
  });

  console.log('[Seed] Created condition history audit records.');
  console.log('[Seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
