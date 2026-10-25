import React from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export default function SeverityBadge({ severity }) {
  if (!severity) return null;

  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return (
        <span className="badge badge-critical" title="Equipment safety or function completely interrupted">
          <ShieldAlert size={11} />
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span className="badge" style={{ backgroundColor: '#FBE8E8', color: '#901D2D', borderColor: '#DA8A95' }}>
          <AlertTriangle size={11} />
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="badge badge-degraded">
          <AlertCircle size={11} />
          MEDIUM
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="badge badge-neutral">
          <Info size={11} />
          LOW
        </span>
      );
  }
}
