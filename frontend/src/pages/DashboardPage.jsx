import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi, calibrationApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import CalibrationModal from '../components/CalibrationModal';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  TrendingDown,
  Wrench,
} from 'lucide-react';

export default function DashboardPage() {
  const { isStaff } = useAuth();
  const [selectedCalibrationEquipment, setSelectedCalibrationEquipment] = useState(null);
  const [isCalibModalOpen, setIsCalibModalOpen] = useState(false);

  // 1. Overview metrics
  const { data: overviewRes, isLoading: isOverviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardApi.getOverview,
  });

  // 2. CTE Downtime query
  const { data: downtimeRes, isLoading: isDowntimeLoading, refetch: refetchDowntime } = useQuery({
    queryKey: ['dashboard-downtime'],
    queryFn: dashboardApi.getDowntimeByEquipment,
  });

  // 3. Window Function Failure Rankings query
  const { data: rankingRes, isLoading: isRankingLoading, refetch: refetchRanking } = useQuery({
    queryKey: ['dashboard-failure-rankings'],
    queryFn: dashboardApi.getFailureRankings,
  });

  // 4. Recurring faults pattern
  const { data: recurringRes, isLoading: isRecurringLoading, refetch: refetchRecurring } = useQuery({
    queryKey: ['dashboard-recurring-faults'],
    queryFn: dashboardApi.getRecurringFaults,
  });

  // 5. Overdue calibrations
  const { data: overdueRes, isLoading: isOverdueLoading, refetch: refetchOverdue } = useQuery({
    queryKey: ['dashboard-overdue-calibrations'],
    queryFn: calibrationApi.getOverdue,
  });

  const overview = overviewRes?.data || {};
  const downtimeRecords = downtimeRes?.data || [];
  const failureRankings = rankingRes?.data || [];
  const recurringFaults = recurringRes?.data || [];
  const overdueCalibrations = overdueRes?.data || [];

  const handleCalibrationSuccess = () => {
    refetchOverview();
    refetchOverdue();
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Laboratory Reliability & Maintenance Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Real-time metrics, downtime CTE aggregates, and failure frequency window rankings computed directly in PostgreSQL.
        </p>
      </div>

      {/* Primary Compact Metric Strip */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">
            <span>Operational Availability</span>
            <Activity size={14} color="var(--olive-700)" />
          </div>
          <div className="metric-value">
            {isOverviewLoading ? '...' : `${overview.operationalRate ?? 0}%`}
          </div>
          <div className="metric-sub">
            {overview.operationalEquipment ?? 0} of {overview.totalEquipment ?? 0} units active
          </div>
        </div>

        <div className="metric-card accent-wine">
          <div className="metric-title">
            <span>Total System Downtime</span>
            <Clock size={14} color="var(--wine-800)" />
          </div>
          <div className="metric-value">
            {isOverviewLoading ? '...' : `${overview.totalSystemDowntimeHours ?? 0}h`}
          </div>
          <div className="metric-sub">Cumulative fault outage across all labs</div>
        </div>

        <div className="metric-card accent-wine">
          <div className="metric-title">
            <span>Open Fault Reports</span>
            <AlertTriangle size={14} color="var(--wine-800)" />
          </div>
          <div className="metric-value">
            {isOverviewLoading ? '...' : overview.openFaults ?? 0}
          </div>
          <div className="metric-sub">
            {overview.criticalFaults ?? 0} critical stop condition
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">
            <span>Active Work Orders</span>
            <Wrench size={14} color="var(--olive-700)" />
          </div>
          <div className="metric-value">
            {isOverviewLoading ? '...' : overview.activeRepairs ?? 0}
          </div>
          <div className="metric-sub">Under technician service</div>
        </div>

        <div className="metric-card accent-wine">
          <div className="metric-title">
            <span>Overdue Calibrations</span>
            <ShieldAlert size={14} color="var(--wine-800)" />
          </div>
          <div className="metric-value">
            {isOverviewLoading ? '...' : overview.overdueCalibrations ?? 0}
          </div>
          <div className="metric-sub">Requires tolerance verification</div>
        </div>
      </div>

      {/* Grid: Failure Ranking & Equipment Downtime */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* PostgreSQL Window Function: Failure Frequency Ranking */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--olive-800)" />
              Equipment Ranked by Failure Frequency
            </h3>
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
              WINDOW: DENSE_RANK()
            </span>
          </div>

          <div className="table-container">
            <table className="table-dense">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>Rank</th>
                  <th>Asset</th>
                  <th>Lab Assignment</th>
                  <th style={{ textAlign: 'center' }}>Faults</th>
                  <th style={{ textAlign: 'center' }}>Critical</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {isRankingLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Evaluating window rankings...
                    </td>
                  </tr>
                ) : failureRankings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No equipment failure records logged.
                    </td>
                  </tr>
                ) : (
                  failureRankings.map((row) => (
                    <tr key={row.equipmentId}>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="mono"
                          style={{
                            fontWeight: 700,
                            padding: '2px 6px',
                            backgroundColor: row.failureRank <= 2 ? 'var(--wine-100)' : 'var(--bg-subtle)',
                            color: row.failureRank <= 2 ? 'var(--wine-900)' : 'var(--olive-950)',
                            borderRadius: '3px',
                            border: `1px solid ${row.failureRank <= 2 ? 'var(--wine-200)' : 'var(--border-medium)'}`,
                          }}
                        >
                          #{row.failureRank}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/equipment/${row.equipmentId}`}
                          className="mono"
                          style={{ fontWeight: 600, color: 'var(--olive-900)', textDecoration: 'none' }}
                        >
                          {row.assetCode}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{row.equipmentName}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{row.labName}</td>
                      <td style={{ textAlign: 'center' }} className="mono">
                        <strong>{row.faultCount}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {row.criticalFaultCount > 0 ? (
                          <span className="mono" style={{ color: 'var(--wine-800)', fontWeight: 700 }}>
                            {row.criticalFaultCount}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>0</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={row.currentCondition} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PostgreSQL CTE: Total Downtime Ledger */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--wine-800)" />
              Equipment Total Downtime Ledger
            </h3>
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
              CTE: EquipmentDowntime
            </span>
          </div>

          <div className="table-container">
            <table className="table-dense">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Total Downtime</th>
                  <th style={{ textAlign: 'right' }}>Avg / Incident</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {isDowntimeLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Aggregating downtime CTE...
                    </td>
                  </tr>
                ) : downtimeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Zero cumulative downtime logged.
                    </td>
                  </tr>
                ) : (
                  downtimeRecords.map((row) => (
                    <tr key={row.equipmentId}>
                      <td>
                        <Link
                          to={`/equipment/${row.equipmentId}`}
                          className="mono"
                          style={{ fontWeight: 600, color: 'var(--olive-900)', textDecoration: 'none' }}
                        >
                          {row.assetCode}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{row.equipmentName}</div>
                      </td>
                      <td className="mono" style={{ fontSize: '11px' }}>
                        {row.category?.replace(/_/g, ' ')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--wine-800)' }}>
                          {row.totalDowntimeHours} hrs
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="mono">
                        {row.avgDowntimeHours} hrs
                      </td>
                      <td>
                        <StatusBadge status={row.currentCondition} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Recurring Faults & Overdue Calibrations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
        {/* Recurring Faults Analysis */}
        <div>
          <div style={{ marginBottom: '8px' }}>
            <h3>Recurring Laboratory Fault Patterns</h3>
          </div>
          <div className="table-container">
            <table className="table-dense">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Recurring Symptom Title</th>
                  <th style={{ textAlign: 'center' }}>Count</th>
                  <th style={{ textAlign: 'center' }}>Critical</th>
                  <th style={{ textAlign: 'right' }}>Avg Outage</th>
                </tr>
              </thead>
              <tbody>
                {isRecurringLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Analyzing fault patterns...
                    </td>
                  </tr>
                ) : recurringFaults.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No recurring fault trends detected.
                    </td>
                  </tr>
                ) : (
                  recurringFaults.map((rf, idx) => (
                    <tr key={idx}>
                      <td className="mono" style={{ fontSize: '11px' }}>
                        {rf.category?.replace(/_/g, ' ')}
                      </td>
                      <td style={{ fontWeight: 500 }}>{rf.faultPattern}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="mono"
                          style={{
                            fontWeight: 700,
                            padding: '1px 6px',
                            backgroundColor: 'var(--bg-subtle)',
                            borderRadius: '3px',
                          }}
                        >
                          {rf.occurrences}x
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {rf.criticalCount > 0 ? (
                          <span className="mono" style={{ color: 'var(--wine-800)', fontWeight: 700 }}>
                            {rf.criticalCount}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>0</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} className="mono">
                        {rf.avgDowntimeHours} hrs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Calibrations Board */}
        <div>
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ color: 'var(--wine-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} />
              Overdue Calibration Alert Board ({overdueCalibrations.length})
            </h3>
          </div>
          <div className="table-container">
            <table className="table-dense">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Lab Location</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isOverdueLoading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Inspecting calibration intervals...
                    </td>
                  </tr>
                ) : overdueCalibrations.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--olive-800)' }}>
                      <ShieldCheck size={16} style={{ display: 'inline', marginRight: '4px' }} />
                      All active laboratory equipment calibrations are up to date!
                    </td>
                  </tr>
                ) : (
                  overdueCalibrations.map((eq) => (
                    <tr key={eq.id}>
                      <td>
                        <Link
                          to={`/equipment/${eq.id}`}
                          className="mono"
                          style={{ fontWeight: 600, color: 'var(--wine-800)', textDecoration: 'none' }}
                        >
                          {eq.assetCode}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{eq.name}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {eq.lab?.name} (Rm {eq.lab?.roomNumber})
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--wine-800)', fontWeight: 700 }}>
                          {eq.nextCalibrationDue ? new Date(eq.nextCalibrationDue).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isStaff ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedCalibrationEquipment(eq);
                              setIsCalibModalOpen(true);
                            }}
                          >
                            Calibrate
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Staff only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Calibration Modal */}
      {selectedCalibrationEquipment && (
        <CalibrationModal
          isOpen={isCalibModalOpen}
          onClose={() => {
            setIsCalibModalOpen(false);
            setSelectedCalibrationEquipment(null);
          }}
          equipmentId={selectedCalibrationEquipment.id}
          assetCode={selectedCalibrationEquipment.assetCode}
          onSuccess={handleCalibrationSuccess}
        />
      )}
    </div>
  );
}
