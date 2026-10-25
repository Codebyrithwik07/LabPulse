import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { equipmentApi, metaApi } from '../api/client';
import { Cpu } from 'lucide-react';

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

export default function NewEquipmentModal({ isOpen, onClose, onSuccess }) {
  const [labs, setLabs] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      assetCode: '',
      name: '',
      category: 'OSCILLOSCOPE',
      modelNumber: '',
      serialNumber: '',
      manufacturer: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      currentCondition: 'OPERATIONAL',
      labId: '',
      calibrationFrequencyDays: 90,
    },
  });

  useEffect(() => {
    metaApi
      .getLabs()
      .then((res) => {
        if (res.data) setLabs(res.data);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    try {
      await equipmentApi.create({
        ...data,
        labId: Number(data.labId),
        calibrationFrequencyDays: Number(data.calibrationFrequencyDays),
        nextCalibrationDue: new Date(Date.now() + Number(data.calibrationFrequencyDays) * 24 * 60 * 60 * 1000).toISOString(),
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(`Error registering equipment: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Laboratory Equipment Asset">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Asset Code * (Unique Ledger ID)</label>
              <input
                type="text"
                className="form-control mono"
                placeholder="e.g. LP-ECE-OSC-0105"
                {...register('assetCode', { required: 'Asset code is required' })}
              />
              {errors.assetCode && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.assetCode.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Laboratory *</label>
              <select className="form-control" {...register('labId', { required: 'Lab assignment is required' })}>
                <option value="">-- Select Laboratory --</option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    [{l.code}] {l.name}
                  </option>
                ))}
              </select>
              {errors.labId && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.labId.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Equipment Model Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Tektronix TBS2104B 100MHz Digital Storage Oscilloscope"
              {...register('name', { required: 'Equipment name is required' })}
            />
            {errors.name && <span style={{ color: 'var(--wine-800)', fontSize: '11px' }}>{errors.name.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Equipment Category *</label>
              <select className="form-control" {...register('category')}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturer *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Keysight, Rigol, Fluke, Haas"
                {...register('manufacturer', { required: 'Manufacturer is required' })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Model Number *</label>
              <input
                type="text"
                className="form-control mono"
                placeholder="e.g. DG1022Z-PRO"
                {...register('modelNumber', { required: 'Model number is required' })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Serial Number *</label>
              <input
                type="text"
                className="form-control mono"
                placeholder="e.g. SN-RGL-8812903"
                {...register('serialNumber', { required: 'Serial number is required' })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input type="date" className="form-control" {...register('purchaseDate')} />
            </div>

            <div className="form-group">
              <label className="form-label">Calibration Cycle (Days)</label>
              <input type="number" className="form-control" defaultValue={90} {...register('calibrationFrequencyDays')} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Cpu size={15} />
            {isSubmitting ? 'Registering...' : 'Induct Asset into Ledger'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
