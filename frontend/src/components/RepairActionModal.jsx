import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { repairApi, metaApi } from '../api/client';
import { Wrench } from 'lucide-react';

export default function RepairActionModal({ isOpen, onClose, equipmentId, faultReportId = null, existingRepair = null, onSuccess }) {
  const [technicians, setTechnicians] = useState([]);

  const isEditing = Boolean(existingRepair);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      equipmentId: equipmentId || existingRepair?.equipmentId || '',
      faultReportId: faultReportId || existingRepair?.faultReportId || '',
      assignedToId: existingRepair?.assignedToId || '',
      actionTaken: existingRepair?.actionTaken || '',
      partsReplaced: existingRepair?.partsReplaced || '',
      repairCost: existingRepair?.repairCost || 0,
      restorationStatus: existingRepair?.restorationStatus || 'IN_PROGRESS',
      notes: '',
    },
  });

  useEffect(() => {
    metaApi
      .getUsers({ role: 'LAB_STAFF' })
      .then((res) => {
        if (res.data) setTechnicians(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (existingRepair) {
      reset({
        equipmentId: existingRepair.equipmentId,
        faultReportId: existingRepair.faultReportId || '',
        assignedToId: existingRepair.assignedToId || '',
        actionTaken: existingRepair.actionTaken || '',
        partsReplaced: existingRepair.partsReplaced || '',
        repairCost: existingRepair.repairCost || 0,
        restorationStatus: existingRepair.restorationStatus || 'IN_PROGRESS',
      });
    }
  }, [existingRepair, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await repairApi.updateAction(existingRepair.id, {
          actionTaken: data.actionTaken,
          partsReplaced: data.partsReplaced,
          repairCost: Number(data.repairCost),
          restorationStatus: data.restorationStatus,
        });
      } else {
        await repairApi.assign({
          equipmentId: Number(data.equipmentId || equipmentId),
          faultReportId: data.faultReportId ? Number(data.faultReportId) : null,
          assignedToId: data.assignedToId ? Number(data.assignedToId) : undefined,
          notes: data.notes || data.actionTaken,
        });
      }
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(`Error updating repair ticket: ${err.message}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Update Repair Ticket [${existingRepair.repairTicketNumber}]` : 'Create / Assign Repair Work Order'}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="modal-body">
          {!isEditing && (
            <div className="form-group">
              <label className="form-label">Assign Technician / Staff *</label>
              <select className="form-control" {...register('assignedToId', { required: 'Please select assigned staff' })}>
                <option value="">-- Select Lab Staff / Technician --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - {t.department}
                  </option>
                ))}
              </select>
              {errors.assignedToId && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.assignedToId.message}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{isEditing ? 'Action Taken / Service Log *' : 'Initial Diagnosis / Work Scope *'}</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Detail diagnostics, repairs performed, component checks, wiring fixes..."
              {...register(isEditing ? 'actionTaken' : 'notes', { required: 'Details are required' })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Parts Replaced / Installed</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Capacitor 47uF, Door gasket, Vacuum hose"
                {...register('partsReplaced')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Repair Cost ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                {...register('repairCost')}
              />
            </div>
          </div>

          {isEditing && (
            <div className="form-group">
              <label className="form-label">Work Order Status</label>
              <select className="form-control" {...register('restorationStatus')}>
                <option value="IN_PROGRESS">IN PROGRESS (Work actively undergoing)</option>
                <option value="PENDING_VERIFICATION">PENDING VERIFICATION (Repairs completed, awaiting staff check)</option>
                <option value="UNRESOLVED">UNRESOLVED (Awaiting external parts / manufacturer RMA)</option>
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Work Order' : 'Assign Work Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
