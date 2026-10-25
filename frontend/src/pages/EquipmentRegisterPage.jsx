import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { equipmentApi, metaApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import FaultReportModal from '../components/FaultReportModal';
import NewEquipmentModal from '../components/NewEquipmentModal';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, RotateCcw, Plus, AlertTriangle, ArrowUpDown, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  'OSCILLOSCOPE',
  'POWER_SUPPLY',
  'FUNCTION_GENERATOR',
  'MULTIMETER',
  'SPECTROPHOTOMETER',
  'CENTRIFUGE',
  'MICROSCOPE',
  'AUTOCLAVE',
  'CNC_MILL',
  'PRINTER_3D',
  'FURNACE',
  'ANALYTICAL_BALANCE',
];

const CONDITIONS = ['OPERATIONAL', 'DEGRADED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'];

export default function EquipmentRegisterPage() {
  const { isStaff } = useAuth();

  // Filter & Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [labId, setLabId] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('assetCode');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedEquipmentForFault, setSelectedEquipmentForFault] = useState(null);

  // Labs list for filter
  const { data: labsData } = useQuery({
    queryKey: ['labs'],
    queryFn: metaApi.getLabs,
  });

  // Main Equipment Query with server-side pagination & filters
  const {
    data: equipmentData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['equipment', page, limit, search, labId, category, condition, sortBy, sortOrder],
    queryFn: () =>
      equipmentApi.getAll({
        page,
        limit,
        search: search || undefined,
        labId: labId || undefined,
        category: category || undefined,
        condition: condition || undefined,
        sortBy,
        sortOrder,
      }),
  });

  const equipmentList = equipmentData?.data || [];
  const meta = equipmentData?.meta || { total: 0, totalPages: 1 };

  const handleResetFilters = () => {
    setSearch('');
    setLabId('');
    setCategory('');
    setCondition('');
    setSortBy('assetCode');
    setSortOrder('asc');
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div>
      {/* Top action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h2>Laboratory Equipment Register</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Comprehensive asset condition ledger, downtime status, and laboratory assignments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-wine"
            onClick={() => {
              setSelectedEquipmentForFault(null);
              setIsReportModalOpen(true);
            }}
          >
            <AlertTriangle size={15} />
            Report Equipment Fault
          </button>

          {isStaff && (
            <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
              <Plus size={15} />
              Register New Asset
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar card */}
      <div className="toolbar-card">
        <div className="toolbar-grid">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Ledger</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '30px' }}
                placeholder="Search by asset code, model name, manufacturer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Laboratory</label>
            <select
              className="form-control"
              value={labId}
              onChange={(e) => {
                setLabId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Laboratories</option>
              {labsData?.data?.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  [{lab.code}] {lab.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Condition</label>
            <select
              className="form-control"
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Conditions</option>
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sort Column</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="assetCode">Asset Code</option>
                <option value="name">Equipment Name</option>
                <option value="purchaseDate">Purchase Date</option>
                <option value="currentCondition">Condition</option>
                <option value="nextCalibrationDue">Next Calibration</option>
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={toggleSortOrder}
                title={`Sort ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown size={14} />
                <span className="mono">{sortOrder.toUpperCase()}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Dense Engineering Table */}
      <div className="table-container">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Asset Code</th>
              <th>Equipment Name</th>
              <th>Category</th>
              <th>Lab & Location</th>
              <th>Condition</th>
              <th>Calibration Due</th>
              <th>Faults / Repairs</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading laboratory equipment ledger from PostgreSQL...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--wine-800)' }}>
                  Failed to fetch equipment data. Verify PostgreSQL connection.
                </td>
              </tr>
            ) : equipmentList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No equipment matched your filters.
                </td>
              </tr>
            ) : (
              equipmentList.map((eq) => {
                const isOverdue = eq.nextCalibrationDue && new Date(eq.nextCalibrationDue) < new Date();

                return (
                  <tr key={eq.id}>
                    <td>
                      <Link
                        to={`/equipment/${eq.id}`}
                        className="mono"
                        style={{ color: 'var(--olive-900)', fontWeight: 700, textDecoration: 'none' }}
                      >
                        {eq.assetCode}
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/equipment/${eq.id}`}
                        style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {eq.name}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {eq.manufacturer} • Mod: {eq.modelNumber} • S/N: {eq.serialNumber}
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {eq.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{eq.lab?.name || `Lab #${eq.labId}`}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {eq.lab?.building} Rm {eq.lab?.roomNumber}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={eq.currentCondition} />
                    </td>
                    <td>
                      {eq.nextCalibrationDue ? (
                        <div>
                          <span
                            className="mono"
                            style={{
                              fontSize: '12px',
                              color: isOverdue ? 'var(--wine-800)' : 'var(--text-main)',
                              fontWeight: isOverdue ? 700 : 400,
                            }}
                          >
                            {new Date(eq.nextCalibrationDue).toLocaleDateString()}
                          </span>
                          {isOverdue && (
                            <span
                              className="badge badge-critical"
                              style={{ display: 'block', width: 'fit-content', marginTop: '2px', fontSize: '9.5px' }}
                            >
                              OVERDUE
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Not scheduled</span>
                      )}
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '12px' }}>
                        {eq._count?.faultReports || 0} faults / {eq._count?.repairRecords || 0} repairs
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => {
                          setSelectedEquipmentForFault(eq.id);
                          setIsReportModalOpen(true);
                        }}
                        title="Report Fault"
                      >
                        <AlertTriangle size={13} style={{ color: 'var(--wine-800)' }} />
                        Fault
                      </button>

                      <Link to={`/equipment/${eq.id}`} className="btn btn-secondary btn-sm">
                        View Detail
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Server-side Pagination Bar */}
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
        equipmentList={equipmentList}
        preselectedEquipmentId={selectedEquipmentForFault}
        onSuccess={() => refetch()}
      />

      {/* New Equipment Modal */}
      <NewEquipmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
