import React from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { repairApi } from '../api/client';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function VerifyRestoreModal({ isOpen, onClose, repair, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      verificationNotes: 'Physical safety check and diagnostic benchmark verified within tolerance.',
      restorationDate: new Date().toISOString().slice(0, 16),
    },
  });

  if (!repair) return null;

  const onSubmit = async (data) => {
    try {
      await repairApi.verifyAndRestore(repair.id, {
        verificationNotes: data.verificationNotes,
        restorationDate: data.restorationDate,
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Repair & Restore to Operational">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="modal-body">
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--olive-100)',
              border: '1px solid var(--olive-500)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              color: 'var(--olive-950)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--olive-800)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong>Audit Ledger Certification:</strong> By submitting verification, you confirm that equipment{' '}
              <strong>[{repair.equipment?.assetCode || repair.equipmentId}]</strong> has undergone inspection,
              meets lab safety parameters, and its condition will be recorded as <strong>OPERATIONAL</strong>.
              Associated fault report will be marked <strong>RESOLVED</strong>.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Repair Ticket Reference</label>
            <input
              type="text"
              className="form-control mono"
              disabled
              value={`${repair.repairTicketNumber} - ${repair.equipment?.name || ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Actions Previously Recorded</label>
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
              }}
            >
              {repair.actionTaken || 'No written action log'}
              {repair.partsReplaced && <div><strong>Parts:</strong> {repair.partsReplaced}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Verification Timestamp</label>
            <input type="datetime-local" className="form-control" {...register('restorationDate')} />
          </div>

          <div className="form-group">
            <label className="form-label">Supervisor / Staff Verification Notes *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Test cycle ran 30 minutes at nominal load. Temperature and current draw normal."
              {...register('verificationNotes', { required: 'Verification notes required' })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <CheckCircle2 size={15} />
            {isSubmitting ? 'Verifying...' : 'Certify & Mark Operational'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
