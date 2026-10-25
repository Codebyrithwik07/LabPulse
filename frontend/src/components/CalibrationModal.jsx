import React from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { calibrationApi } from '../api/client';
import { ShieldCheck } from 'lucide-react';

export default function CalibrationModal({ isOpen, onClose, equipmentId, assetCode = '', onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      standardUsed: '',
      status: 'PASSED',
      calibrationDate: new Date().toISOString().slice(0, 10),
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      measurements: '',
      notes: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await calibrationApi.record({
        equipmentId: Number(equipmentId),
        standardUsed: data.standardUsed,
        status: data.status,
        calibrationDate: data.calibrationDate,
        nextDueDate: data.nextDueDate,
        measurements: data.measurements,
        notes: data.notes,
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(`Error logging calibration: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Calibration Certificate [${assetCode}]`}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Reference Standard / Calibrator Kit *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Fluke 9500B Calibrator (NIST Traceable #FLK-9500-9812)"
              {...register('standardUsed', { required: 'Standard is required' })}
            />
            {errors.standardUsed && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.standardUsed.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Calibration Result *</label>
              <select className="form-control" {...register('status')}>
                <option value="PASSED">PASSED (All tolerances within limits)</option>
                <option value="PASSED_WITH_ADJUSTMENTS">PASSED WITH ADJUSTMENTS (Trimmed/Zeroed)</option>
                <option value="FAILED">FAILED (Out of tolerance - marks DEGRADED)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Calibration Date</label>
              <input type="date" className="form-control" {...register('calibrationDate')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Next Calibration Due Date *</label>
            <input type="date" className="form-control" {...register('nextDueDate', { required: true })} />
          </div>

          <div className="form-group">
            <label className="form-label">Measured Tolerances / Readouts</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. DC voltage accuracy +/- 0.05%, Frequency stability +/- 2ppm..."
              {...register('measurements')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Technician Inspection Notes</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Physical condition, cleanliness of optics/connectors, environmental temp..."
              {...register('notes')}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <ShieldCheck size={15} />
            {isSubmitting ? 'Recording...' : 'Affix Calibration Certificate'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
