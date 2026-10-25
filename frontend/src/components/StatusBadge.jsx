import React from 'react';
import { CheckCircle2, AlertCircle, Wrench, XOctagon, Archive } from 'lucide-react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'OPERATIONAL':
    case 'VERIFIED_OPERATIONAL':
    case 'PASSED':
    case 'RESOLVED':
    case 'CLOSED':
      return (
        <span className="badge badge-operational">
          <CheckCircle2 size={11} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    case 'DEGRADED':
    case 'PASSED_WITH_ADJUSTMENTS':
      return (
        <span className="badge badge-degraded">
          <AlertCircle size={11} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    case 'UNDER_MAINTENANCE':
    case 'IN_REPAIR':
    case 'IN_PROGRESS':
    case 'PENDING_VERIFICATION':
    case 'SCHEDULED':
    case 'ASSIGNED':
      return (
        <span className="badge badge-maintenance">
          <Wrench size={11} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    case 'OUT_OF_SERVICE':
    case 'CRITICAL':
    case 'FAILED':
    case 'REJECTED':
      return (
        <span className="badge badge-critical">
          <XOctagon size={11} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    case 'DECOMMISSIONED':
      return (
        <span className="badge badge-decommissioned">
          <Archive size={11} />
          DECOMMISSIONED
        </span>
      );

    default:
      return (
        <span className="badge badge-neutral">
          {status.replace(/_/g, ' ')}
        </span>
      );
  }
}
