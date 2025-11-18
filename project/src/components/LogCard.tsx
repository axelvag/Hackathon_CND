import { Clock, Shield, AlertCircle } from 'lucide-react';
import { SecurityLog } from '../types';
import { COLORS } from '../constants/theme';

interface LogCardProps {
  log: SecurityLog;
}

export default function LogCard({ log }: LogCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return COLORS.severity.high;
      case 'Medium':
        return COLORS.severity.medium;
      case 'Low':
        return COLORS.severity.low;
      default:
        return COLORS.text.muted;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  return (
    <div
      className="rounded-lg p-4 border transition-all hover:border-opacity-50"
      style={{
        backgroundColor: COLORS.background.card,
        borderColor: COLORS.border,
        borderLeftWidth: '4px',
        borderLeftColor: getSeverityColor(log.severity),
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide"
            style={{
              backgroundColor: `${getSeverityColor(log.severity)}20`,
              color: getSeverityColor(log.severity),
            }}
          >
            {log.severity}
          </div>
          <div
            className="px-2.5 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: COLORS.background.hover,
              color: log.type === 'Attack' ? COLORS.accent.frenchRed : COLORS.text.secondary,
            }}
          >
            {log.type}
          </div>
          {log.attackSubtype && (
            <div
              className="px-2.5 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: `${COLORS.accent.frenchRed}15`,
                color: COLORS.accent.frenchRed,
              }}
            >
              {log.attackSubtype}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2" style={{ color: COLORS.text.muted }}>
          <Clock size={14} />
          <span className="text-xs font-mono">{formatTimestamp(log.timestamp)}</span>
        </div>
      </div>

      <div className="mb-3">
        <p
          className="text-sm leading-relaxed"
          style={{ color: COLORS.text.primary }}
        >
          {log.explanation}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center space-x-2">
          <Shield size={14} style={{ color: COLORS.accent.deepBlue }} />
          <span
            className="text-xs font-mono"
            style={{ color: COLORS.text.secondary }}
          >
            {log.firewallId}
          </span>
        </div>
        <div className="flex items-center space-x-1.5" style={{ color: COLORS.text.muted }}>
          <AlertCircle size={12} />
          <span className="text-xs">ID: {log.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}
