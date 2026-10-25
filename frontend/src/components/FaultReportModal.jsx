import React from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { faultApi } from '../api/client';
import { AlertTriangle } from 'lucide-react';

export default function FaultReportModal({ isOpen, onClose, equipmentList = [], preselectedEquipmentId = null, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      equipmentId: preselectedEquipmentId || '',
      title: '',
      description: '',
      severity: 'MEDIUM',
      newCondition: 'DEGRADED',
      reportedAt: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (formData) => {
    try {
      await faultApi.report({
        equipmentId: Number(formData.equipmentId),
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        newCondition: formData.newCondition,
        reportedAt: formData.reportedAt,
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(`Error submitting fault report: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Laboratory Equipment Fault">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="modal-body">
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--wine-100)',
              border: '1px solid var(--wine-200)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--wine-900)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>
              Fault reports are auditable entries that immediately adjust the equipment condition and initiate downtime tracking.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Equipment Asset *</label>
            <select
              className="form-control"
              defaultValue={preselectedEquipmentId || ''}
              {...register('equipmentId', { required: 'Please select an equipment asset' })}
            >
              <option value="">-- Select Laboratory Asset --</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  [{eq.assetCode}] {eq.name} - {eq.lab?.name || `Lab #${eq.labId}`}
                </option>
              ))}
            </select>
            {errors.equipmentId && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.equipmentId.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Fault Summary / Symptom Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Channel 2 DC offset drift, Spindle drive alarm 123"
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Minimum 3 chars' } })}
            />
            {errors.title && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.title.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Severity Level *</label>
              <select className="form-control" {...register('severity', { required: true })}>
                <option value="LOW">LOW (Cosmetic / minor inaccuracy)</option>
                <option value="MEDIUM">MEDIUM (Degraded performance / 1 function impaired)</option>
                <option value="HIGH">HIGH (Major subsystem failure)</option>
                <option value="CRITICAL">CRITICAL (Safety hazard / total stoppage)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Resulting Condition *</label>
              <select className="form-control" {...register('newCondition', { required: true })}>
                <option value="DEGRADED">DEGRADED (Usable with constraints)</option>
                <option value="OUT_OF_SERVICE">OUT OF SERVICE (Lockout immediately)</option>
                <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE (Taken to workshop)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Incident Timestamp</label>
            <input type="datetime-local" className="form-control" {...register('reportedAt')} />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Fault Description & Observation *</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Provide exact error codes, readings, test conditions, or unusual sounds observed..."
              {...register('description', { required: 'Please enter a description of the fault', minLength: { value: 5, message: 'Minimum 5 characters' } })}
            />
            {errors.description && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.description.message}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-wine" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Log Fault in Ledger'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
