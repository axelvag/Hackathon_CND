import { useState, useEffect } from 'react';
import { Clock, Shield, AlertCircle, X } from 'lucide-react';
import { SecurityLog, formatLogId } from '../types';
import { useColors } from '../contexts/ThemeContext';
import { formatRelativeTime } from '../utils/timeUtils';

interface LogCardProps {
  log: SecurityLog;
  isResolved?: boolean;
  onDismiss?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export default function LogCard({ log, isResolved = false, onDismiss, onClick }: LogCardProps) {
  const COLORS = useColors();
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(log.timestamp));

  // Mettre à jour le temps relatif toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(log.timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [log.timestamp]);

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

  // Formater le subtype (remplacer les underscores et capitaliser)
  const formatSubtype = (subtype: string): string => {
    return subtype
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div
      className="rounded-lg p-4 border transition-all hover:border-opacity-50 relative cursor-pointer"
      style={{
        backgroundColor: COLORS.background.card,
        borderColor: isResolved ? COLORS.success : COLORS.border,
        borderLeftWidth: '4px',
        borderLeftColor: isResolved ? COLORS.success : getSeverityColor(log.severity),
        opacity: isResolved ? 0.7 : 1,
      }}
      onClick={onClick}
    >
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(e);
          }}
          className="absolute top-2 right-2 p-1 rounded-md transition-all hover:opacity-80"
          style={{
            color: COLORS.severity.high,
          }}
        >
          <X size={16} />
        </button>
      )}
      <div className="flex items-start justify-between mb-3 pr-6">
        <div className="flex items-center flex-wrap gap-2">
          {/* Tag Severity */}
          <div
            className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide"
            style={{
              backgroundColor: `${getSeverityColor(log.severity)}20`,
              color: getSeverityColor(log.severity),
            }}
          >
            {log.severity}
          </div>
          {/* Tag Type */}
          <div
            className="px-2.5 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: COLORS.background.hover,
              color: log.type === 'Attack' ? COLORS.accent.frenchRed : COLORS.text.secondary,
            }}
          >
            {log.type}
          </div>
          {/* Tag Attack Type / Bug Type */}
          {log.attackSubtype && (
            <div
              className="px-2.5 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: log.type === 'Attack' 
                  ? `${COLORS.accent.frenchRed}15` 
                  : `${COLORS.accent.deepBlue}15`,
                color: log.type === 'Attack' 
                  ? COLORS.accent.frenchRed 
                  : COLORS.accent.deepBlue,
              }}
            >
              {formatSubtype(log.attackSubtype)}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2" style={{ color: COLORS.text.muted }}>
          <Clock size={14} />
          <span className="text-xs">{relativeTime}</span>
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
          <span className="text-xs">ID: {formatLogId(log.id)}</span>
        </div>
      </div>
    </div>
  );
}
