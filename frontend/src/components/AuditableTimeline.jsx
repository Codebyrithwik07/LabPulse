import React from 'react';
import { AlertTriangle, Wrench, ShieldCheck, RefreshCw, Clock, User } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';

export default function AuditableTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No historical events recorded in ledger for this asset yet.
      </div>
    );
  }

  const getEventIcon = (type, severity) => {
    switch (type) {
      case 'FAULT_REPORT':
        return <AlertTriangle size={12} color="var(--wine-800)" />;
      case 'REPAIR_RECORD':
        return <Wrench size={12} color="var(--olive-800)" />;
      case 'CALIBRATION':
        return <ShieldCheck size={12} color="var(--olive-700)" />;
      case 'CONDITION_CHANGE':
      default:
        return <RefreshCw size={12} color="var(--olive-800)" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="timeline">
      {events.map((evt, idx) => {
        const isFault = evt.type === 'FAULT_REPORT';
        const isCritical = evt.severity === 'CRITICAL' || evt.status === 'OUT_OF_SERVICE';

        return (
          <div key={`${evt.id}-${idx}`} className="timeline-item">
            <div className={`timeline-pin ${isFault || isCritical ? 'pin-wine' : ''}`}>
              {getEventIcon(evt.type, evt.severity)}
            </div>

            <div className="timeline-content-box">
              <div className="timeline-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="timeline-title">{evt.title}</span>
                  {evt.code && <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>[{evt.code}]</span>}
                  {evt.severity && <SeverityBadge severity={evt.severity} />}
                  {evt.status && <StatusBadge status={evt.status} />}
                </div>
                <div className="timeline-date">
                  <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  {formatDate(evt.timestamp)}
                </div>
              </div>

              {evt.details && (
                <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.4 }}>
                  {evt.details}
                </div>
              )}

              {evt.parts && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <strong>Parts:</strong> {evt.parts} {evt.cost > 0 && `(Cost: $${evt.cost.toFixed(2)})`}
                </div>
              )}

              {evt.standard && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <strong>Standard:</strong> {evt.standard}
                  {evt.nextDueDate && (
                    <span style={{ marginLeft: '12px' }}>
                      <strong>Next Due:</strong> {new Date(evt.nextDueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              <div className="timeline-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {evt.author && (
                  <span>
                    <User size={11} style={{ display: 'inline', marginRight: '3px' }} />
                    Recorded by: <strong>{evt.author}</strong> {evt.authorRole && `(${evt.authorRole})`}
                  </span>
                )}
                {evt.assignedTo && (
                  <span>
                    Assigned: <strong>{evt.assignedTo}</strong>
                  </span>
                )}
                {evt.verifiedBy && (
                  <span>
                    Verified: <strong>{evt.verifiedBy}</strong>
                  </span>
                )}
                {evt.resolvedAt && (
                  <span style={{ color: 'var(--olive-800)' }}>
                    Resolved at: {formatDate(evt.resolvedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
