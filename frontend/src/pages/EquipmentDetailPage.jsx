import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { equipmentApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import AuditableTimeline from '../components/AuditableTimeline';
import FaultReportModal from '../components/FaultReportModal';
import RepairActionModal from '../components/RepairActionModal';
import VerifyRestoreModal from '../components/VerifyRestoreModal';
import CalibrationModal from '../components/CalibrationModal';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  Building,
  Calendar,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  Clock,
  ArrowLeft,
  DollarSign,
  Tag,
  CheckCircle,
} from 'lucide-react';

export default function EquipmentDetailPage() {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline'); // timeline | faults | repairs | calibrations

  // Modals state
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isCalibModalOpen, setIsCalibModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);

  // Equipment query
  const {
    data: equipmentRes,
    isLoading: isEqLoading,
    refetch: refetchEquipment,
  } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentApi.getById(id),
  });

  // Timeline query
  const {
    data: timelineRes,
    isLoading: isTimelineLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['equipment-timeline', id],
    queryFn: () => equipmentApi.getTimeline(id),
  });

  const equipment = equipmentRes?.data;
  const timelineEvents = timelineRes?.data || [];

  const handleRefreshAll = () => {
    refetchEquipment();
    refetchTimeline();
  };

  if (isEqLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Retrieving equipment asset record from ledger...
      </div>
    );
  }

  if (!equipment) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--wine-800)' }}>Equipment Asset Not Found</h3>
        <p style={{ marginTop: '8px' }}>The requested equipment ID does not exist in the database.</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back to Register
        </Link>
      </div>
    );
  }

  // Calculate quick stats from equipment data
  const totalFaults = equipment.faultReports?.length || 0;
  const activeFaults = equipment.faultReports?.filter((f) => f.status !== 'RESOLVED' && f.status !== 'CLOSED') || [];
  const repairRecords = equipment.repairRecords || [];

  // Compute total downtime hours for this specific equipment
  let equipmentDowntimeHours = 0;
  if (equipment.faultReports) {
    equipment.faultReports.forEach((f) => {
      const start = new Date(f.reportedAt).getTime();
      const end = f.resolvedAt ? new Date(f.resolvedAt).getTime() : Date.now();
      equipmentDowntimeHours += Math.max(0, (end - start) / (1000 * 60 * 60));
    });
  }

  const isCalibrationOverdue =
    equipment.nextCalibrationDue && new Date(equipment.nextCalibrationDue) < new Date();

  return (
    <div>
      {/* Breadcrumb / Back Link */}
      <div style={{ marginBottom: '14px' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <ArrowLeft size={14} /> Back to Equipment Register
        </Link>
      </div>

      {/* Asset Header Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--olive-900)' }}>
                {equipment.assetCode}
              </span>
              <StatusBadge status={equipment.currentCondition} />
              <span className="badge badge-neutral mono">{equipment.category.replace(/_/g, ' ')}</span>
            </div>

            <h1 style={{ fontSize: '1.45rem', marginBottom: '6px' }}>{equipment.name}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>
                <strong>Manufacturer:</strong> {equipment.manufacturer}
              </span>
              <span>
                <strong>Model:</strong> {equipment.modelNumber}
              </span>
              <span>
                <strong>Serial #:</strong> <span className="mono">{equipment.serialNumber}</span>
              </span>
              <span>
                <Building size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {equipment.lab?.name} ({equipment.lab?.building} Rm {equipment.lab?.roomNumber})
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-wine btn-sm"
              onClick={() => setIsFaultModalOpen(true)}
            >
              <AlertTriangle size={14} />
              Report Fault
            </button>

            {isStaff && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsRepairModalOpen(true)}
                >
                  <Wrench size={14} />
                  Assign Work Order
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCalibModalOpen(true)}
                >
                  <ShieldCheck size={14} />
                  Log Calibration
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Reliability Metric Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div>
            <div className="form-label">Total Cumulative Downtime</div>
            <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: equipmentDowntimeHours > 0 ? 'var(--wine-800)' : 'var(--olive-800)' }}>
              {equipmentDowntimeHours.toFixed(1)} hrs
            </div>
          </div>

          <div>
            <div className="form-label">Total Faults Logged</div>
            <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: activeFaults.length > 0 ? 'var(--wine-800)' : 'var(--olive-950)' }}>
              {totalFaults} ({activeFaults.length} unresolved)
            </div>
          </div>

          <div>
            <div className="form-label">Last Calibrated</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {equipment.lastCalibratedAt ? new Date(equipment.lastCalibratedAt).toLocaleDateString() : 'Never'}
            </div>
          </div>

          <div>
            <div className="form-label">Next Calibration Due</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="mono"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: isCalibrationOverdue ? 'var(--wine-800)' : 'inherit',
                }}
              >
                {equipment.nextCalibrationDue ? new Date(equipment.nextCalibrationDue).toLocaleDateString() : 'N/A'}
              </span>
              {isCalibrationOverdue && <span className="badge badge-critical" style={{ fontSize: '9px' }}>OVERDUE</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={15} />
          Chronological Auditable History ({timelineEvents.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'faults' ? 'active' : ''}`}
          onClick={() => setActiveTab('faults')}
        >
          <AlertTriangle size={15} />
          Fault Reports ({equipment.faultReports?.length || 0})
        </button>

        <button
          className={`tab-btn ${activeTab === 'repairs' ? 'active' : ''}`}
          onClick={() => setActiveTab('repairs')}
        >
          <Wrench size={15} />
          Repair Work Orders ({equipment.repairRecords?.length || 0})
        </button>

        <button
          className={`tab-btn ${activeTab === 'calibrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('calibrations')}
        >
          <ShieldCheck size={15} />
          Calibration Records ({equipment.calibrationRecords?.length || 0})
        </button>
      </div>

      {/* Tab 1: Chronological Auditable Timeline */}
      {activeTab === 'timeline' && (
        <div>
          <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Audit log tracks every fault notification, maintenance work order, technician intervention, and calibration stamp.
          </div>
          {isTimelineLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading chronological ledger...
            </div>
          ) : (
            <AuditableTimeline events={timelineEvents} />
          )}
        </div>
      )}

      {/* Tab 2: Fault Reports Table */}
      {activeTab === 'faults' && (
        <div className="table-container">
          <table className="table-dense">
            <thead>
              <tr>
                <th>Code</th>
                <th>Fault Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported At</th>
                <th>Reported By</th>
                <th>Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {equipment.faultReports?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No faults logged for this equipment.
                  </td>
                </tr>
              ) : (
                equipment.faultReports?.map((f) => (
                  <tr key={f.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{f.faultCode}</td>
                    <td>
                      <strong>{f.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {f.description}
                      </div>
                    </td>
                    <td>
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td>
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="mono" style={{ fontSize: '12px' }}>
                      {new Date(f.reportedAt).toLocaleString()}
                    </td>
                    <td>
                      {f.reportedBy?.name || `User #${f.reportedById}`}
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{f.reportedBy?.role}</div>
                    </td>
                    <td className="mono" style={{ fontSize: '12px' }}>
                      {f.resolvedAt ? new Date(f.resolvedAt).toLocaleString() : 'Open / Unresolved'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Repair Work Orders */}
      {activeTab === 'repairs' && (
        <div className="table-container">
          <table className="table-dense">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Status</th>
                <th>Action Taken</th>
                <th>Parts Replaced</th>
                <th>Cost</th>
                <th>Assigned To</th>
                <th>Verified By</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.repairRecords?.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No repair work orders on record for this equipment.
                  </td>
                </tr>
              ) : (
                equipment.repairRecords?.map((r) => (
                  <tr key={r.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{r.repairTicketNumber}</td>
                    <td>
                      <StatusBadge status={r.restorationStatus} />
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div>{r.actionTaken || 'No action recorded'}</div>
                      <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        Started: {new Date(r.startedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{r.partsReplaced || 'None'}</td>
                    <td className="mono">${r.repairCost?.toFixed(2) || '0.00'}</td>
                    <td>{r.assignedTo?.name || 'Unassigned'}</td>
                    <td>
                      {r.verifiedBy?.name ? (
                        <div>
                          <strong>{r.verifiedBy.name}</strong>
                          <div className="mono" style={{ fontSize: '11px', color: 'var(--olive-800)' }}>
                            {r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString() : 'Verified'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isStaff && r.restorationStatus !== 'VERIFIED_OPERATIONAL' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => {
                              setSelectedRepair(r);
                              setIsRepairModalOpen(true);
                            }}
                          >
                            Update
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedRepair(r);
                              setIsVerifyModalOpen(true);
                            }}
                          >
                            Verify & Restore
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Calibration Records */}
      {activeTab === 'calibrations' && (
        <div className="table-container">
          <table className="table-dense">
            <thead>
              <tr>
                <th>Cert #</th>
                <th>Date</th>
                <th>Standard Used</th>
                <th>Result</th>
                <th>Measurements</th>
                <th>Performed By</th>
                <th>Next Due Date</th>
              </tr>
            </thead>
            <tbody>
              {equipment.calibrationRecords?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No calibration records on file for this equipment.
                  </td>
                </tr>
              ) : (
                equipment.calibrationRecords?.map((c) => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{c.certificateNumber}</td>
                    <td className="mono">{new Date(c.calibrationDate).toLocaleDateString()}</td>
                    <td>{c.standardUsed}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ maxWidth: '250px', fontSize: '12px' }}>
                      {c.measurements || 'Within spec'}
                    </td>
                    <td>{c.performedBy?.name || `User #${c.performedById}`}</td>
                    <td className="mono">
                      {new Date(c.nextDueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <FaultReportModal
        isOpen={isFaultModalOpen}
        onClose={() => setIsFaultModalOpen(false)}
        equipmentList={[equipment]}
        preselectedEquipmentId={equipment.id}
        onSuccess={handleRefreshAll}
      />

      <RepairActionModal
        isOpen={isRepairModalOpen}
        onClose={() => {
          setIsRepairModalOpen(false);
          setSelectedRepair(null);
        }}
        equipmentId={equipment.id}
        existingRepair={selectedRepair}
        onSuccess={handleRefreshAll}
      />

      <VerifyRestoreModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedRepair(null);
        }}
        repair={selectedRepair ? { ...selectedRepair, equipment } : null}
        onSuccess={handleRefreshAll}
      />

      <CalibrationModal
        isOpen={isCalibModalOpen}
        onClose={() => setIsCalibModalOpen(false)}
        equipmentId={equipment.id}
        assetCode={equipment.assetCode}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
}
