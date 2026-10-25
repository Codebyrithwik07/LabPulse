import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { repairApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import RepairActionModal from '../components/RepairActionModal';
import VerifyRestoreModal from '../components/VerifyRestoreModal';
import { useAuth } from '../context/AuthContext';
import { Wrench, CheckCircle2, ShieldCheck, Filter, RotateCcw } from 'lucide-react';

const REPAIR_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'VERIFIED_OPERATIONAL', 'UNRESOLVED'];

export default function RepairsListPage() {
  const { isStaff } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('');

  // Modals state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [activeRepair, setActiveRepair] = useState(null);

  const {
    data: repairsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['repairs', page, limit, status],
    queryFn: () =>
      repairApi.getAll({
        page,
        limit,
        status: status || undefined,
        sortBy: 'startedAt',
        sortOrder: 'desc',
      }),
  });

  const repairList = repairsData?.data || [];
  const meta = repairsData?.meta || { total: 0, totalPages: 1 };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h2>Maintenance & Repair Work Orders</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Work order tracking, technician action logs, parts replacement records, and supervisor operational certification.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="toolbar-card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: '220px' }}>
            <label className="form-label">Filter by Restoration Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {REPAIR_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setStatus('');
              setPage(1);
            }}
          >
            <RotateCcw size={14} />
            Reset Filter
          </button>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Equipment Asset</th>
              <th>Linked Fault</th>
              <th>Status</th>
              <th>Assigned Tech</th>
              <th>Action Log & Parts</th>
              <th>Cost</th>
              <th>Verification</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading repair ledger...
                </td>
              </tr>
            ) : repairList.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No repair work orders found.
                </td>
              </tr>
            ) : (
              repairList.map((rep) => {
                const isVerified = rep.restorationStatus === 'VERIFIED_OPERATIONAL';

                return (
                  <tr key={rep.id}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--olive-900)' }}>
                      {rep.repairTicketNumber}
                    </td>
                    <td>
                      <Link
                        to={`/equipment/${rep.equipmentId}`}
                        className="mono"
                        style={{ fontWeight: 600, color: 'var(--olive-900)', textDecoration: 'none' }}
                      >
                        {rep.equipment?.assetCode}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {rep.equipment?.name} ({rep.equipment?.lab?.code})
                      </div>
                    </td>
                    <td>
                      {rep.faultReport ? (
                        <div>
                          <span className="mono" style={{ fontSize: '11px', color: 'var(--wine-800)', fontWeight: 600 }}>
                            {rep.faultReport.faultCode}
                          </span>
                          <div style={{ fontSize: '12px' }}>{rep.faultReport.title}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Preventative</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={rep.restorationStatus} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{rep.assignedTo?.name || 'Unassigned'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{rep.assignedTo?.role}</div>
                    </td>
                    <td style={{ maxWidth: '260px' }}>
                      <div style={{ fontSize: '12.5px' }}>{rep.actionTaken || 'Awaiting diagnostics'}</div>
                      {rep.partsReplaced && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <strong>Parts:</strong> {rep.partsReplaced}
                        </div>
                      )}
                    </td>
                    <td className="mono">${rep.repairCost?.toFixed(2) || '0.00'}</td>
                    <td>
                      {isVerified ? (
                        <div>
                          <span className="badge badge-operational">
                            <ShieldCheck size={11} />
                            VERIFIED
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {rep.verifiedBy?.name}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Pending Signoff</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isStaff && !isVerified && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => {
                              setActiveRepair(rep);
                              setIsActionModalOpen(true);
                            }}
                          >
                            Update
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setActiveRepair(rep);
                              setIsVerifyModalOpen(true);
                            }}
                          >
                            <CheckCircle2 size={13} />
                            Verify & Restore
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
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

      {/* Update Repair Modal */}
      {activeRepair && (
        <RepairActionModal
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false);
            setActiveRepair(null);
          }}
          equipmentId={activeRepair.equipmentId}
          existingRepair={activeRepair}
          onSuccess={() => refetch()}
        />
      )}

      {/* Verify & Restore Modal */}
      {activeRepair && (
        <VerifyRestoreModal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setActiveRepair(null);
          }}
          repair={activeRepair}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
