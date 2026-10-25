import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { faultApi, equipmentApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import Pagination from '../components/Pagination';
import FaultReportModal from '../components/FaultReportModal';
import RepairActionModal from '../components/RepairActionModal';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Wrench, Plus, RotateCcw, ArrowUpDown } from 'lucide-react';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['REPORTED', 'ASSIGNED', 'IN_REPAIR', 'RESOLVED', 'CLOSED'];

export default function FaultsListPage() {
  const { isStaff } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('reportedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetFaultForRepair, setTargetFaultForRepair] = useState(null);

  // Equipment list for the fault modal dropdown
  const { data: equipmentRes } = useQuery({
    queryKey: ['equipment-simple-list'],
    queryFn: () => equipmentApi.getAll({ limit: 100 }),
  });

  const {
    data: faultsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['faults', page, limit, severity, status, sortBy, sortOrder],
    queryFn: () =>
      faultApi.getAll({
        page,
        limit,
        severity: severity || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
      }),
  });

  const faultsList = faultsData?.data || [];
  const meta = faultsData?.meta || { total: 0, totalPages: 1 };
  const equipmentOptions = equipmentRes?.data || [];

  const handleReset = () => {
    setSeverity('');
    setStatus('');
    setSortBy('reportedAt');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h2>Equipment Fault Reports & Incidents</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Comprehensive fault audit log with severity classifications, timestamps, and technician response tracking.
          </p>
        </div>

        <button className="btn btn-wine" onClick={() => setIsReportModalOpen(true)}>
          <Plus size={15} />
          Report Fault
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="form-group">
            <label className="form-label">Filter Severity</label>
            <select
              className="form-control"
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Filter Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sort By</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="reportedAt">Reported Timestamp</option>
                <option value="severity">Severity Level</option>
                <option value="status">Status</option>
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))}
              >
                <ArrowUpDown size={14} />
                <span className="mono">{sortOrder.toUpperCase()}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleReset}>
              <RotateCcw size={14} />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Faults Table */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Fault Code</th>
              <th>Equipment Asset</th>
              <th>Fault Summary</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reported Date</th>
              <th>Reported By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading fault reports...
                </td>
              </tr>
            ) : faultsList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No fault reports match the selected criteria.
                </td>
              </tr>
            ) : (
              faultsList.map((f) => (
                <tr key={f.id}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--wine-800)' }}>
                    {f.faultCode}
                  </td>
                  <td>
                    <Link
                      to={`/equipment/${f.equipmentId}`}
                      className="mono"
                      style={{ fontWeight: 600, color: 'var(--olive-900)', textDecoration: 'none' }}
                    >
                      {f.equipment?.assetCode}
                    </Link>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {f.equipment?.name} ({f.equipment?.lab?.code})
                    </div>
                  </td>
                  <td style={{ maxWidth: '320px' }}>
                    <strong>{f.title}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
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
                    <div style={{ fontWeight: 500 }}>{f.reportedBy?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {f.reportedBy?.role} • {f.reportedBy?.department}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isStaff && f.status !== 'RESOLVED' && f.status !== 'CLOSED' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setTargetFaultForRepair(f);
                          setIsAssignModalOpen(true);
                        }}
                      >
                        <Wrench size={13} />
                        Assign Work
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          limit={limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Fault Report Modal */}
      <FaultReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        equipmentList={equipmentOptions}
        onSuccess={() => refetch()}
      />

      {/* Assign Repair Modal */}
      {targetFaultForRepair && (
        <RepairActionModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setTargetFaultForRepair(null);
          }}
          equipmentId={targetFaultForRepair.equipmentId}
          faultReportId={targetFaultForRepair.id}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
