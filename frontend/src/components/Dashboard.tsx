import { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { SeverityStats, SecurityLog } from '../types';
import { useColors } from '../contexts/ThemeContext';
import LogCard from './LogCard';
import { TutorialButton, Tutorial } from './Tutorial';

interface DashboardProps {
  stats: SeverityStats;
  totalLogs: number;
  logs: SecurityLog[];
  resolvedLogs: Set<string>;
}

export default function Dashboard({ stats, totalLogs, logs, resolvedLogs }: DashboardProps) {
  const COLORS = useColors();
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  
  const tutorialSteps = [
    {
      target: 'derniers-logs',
      text: 'Ici apparaissent les Attaques et Bug reçu sur les Firewall en temps réel.',
      position: 'top' as const
    },
    {
      target: 'nav-logs',
      text: 'Pour accéder à l\'ensembles des logs malvaillants reçu et les filtrer.',
      position: 'bottom' as const
    }
  ];
  
  // Trier les logs par timestamp (plus récents en premier) et prendre les 3 derniers
  const lastThreeLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  }, [logs]);

  const [enteringLogs, setEnteringLogs] = useState<Set<string>>(new Set());
  const previousLogsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef(true);

  // Détecter les nouveaux logs et appliquer l'animation
  useEffect(() => {
    const currentLogIds = new Set(lastThreeLogs.map(log => log.id.toString()));
    const previousLogIds = previousLogsRef.current;

    // Au premier chargement, initialiser la référence sans animation
    if (isInitialMountRef.current) {
      previousLogsRef.current = currentLogIds;
      isInitialMountRef.current = false;
      return;
    }

    // Trouver les nouveaux logs (présents maintenant mais pas avant)
    const newLogIds = new Set<string>();
    currentLogIds.forEach(id => {
      if (!previousLogIds.has(id)) {
        newLogIds.add(id);
      }
    });

    if (newLogIds.size > 0) {
      // Marquer les nouveaux logs pour l'animation
      setEnteringLogs(newLogIds);

      // Retirer le marqueur après l'animation
      const timer = setTimeout(() => {
        setEnteringLogs(prev => {
          const updated = new Set(prev);
          newLogIds.forEach(id => updated.delete(id));
          return updated;
        });
      }, 500); // Durée de l'animation

      // Mettre à jour la référence
      previousLogsRef.current = currentLogIds;

      return () => clearTimeout(timer);
    } else {
      // Mettre à jour la référence même s'il n'y a pas de nouveaux logs
      previousLogsRef.current = currentLogIds;
    }
  }, [lastThreeLogs]);
  
  const StatCard = ({
    label,
    value,
    color,
    percentage,
  }: {
    label: string;
    value: number;
    color: string;
    percentage: number;
  }) => (
    <div
      className="rounded-lg p-6 border"
      style={{
        backgroundColor: COLORS.background.card,
        borderColor: COLORS.border,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
            {label}
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: COLORS.text.primary }}>
            {value}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <AlertTriangle size={24} style={{ color }} />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: COLORS.background.hover }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ backgroundColor: color, width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );

  const highPercentage = totalLogs > 0 ? (stats.high / totalLogs) * 100 : 0;
  const mediumPercentage = totalLogs > 0 ? (stats.medium / totalLogs) * 100 : 0;
  const lowPercentage = totalLogs > 0 ? (stats.low / totalLogs) * 100 : 0;

  return (
    <div className="space-y-6">
      {showTutorial && (
        <Tutorial 
          steps={tutorialSteps} 
          onComplete={() => setShowTutorial(false)} 
        />
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            Vue d'Ensemble
          </h2>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
            Surveillance en temps réel des menaces et événements de sécurité
          </p>
        </div>
        <TutorialButton onStart={() => setShowTutorial(true)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Menaces Critiques"
          value={stats.high}
          color={COLORS.severity.high}
          percentage={highPercentage}
        />
        <StatCard
          label="Menaces Moyennes"
          value={stats.medium}
          color={COLORS.severity.medium}
          percentage={mediumPercentage}
        />
        <StatCard
          label="Menaces Faibles"
          value={stats.low}
          color={COLORS.severity.low}
          percentage={lowPercentage}
        />
      </div>

      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: COLORS.background.card,
          borderColor: COLORS.border,
        }}
        data-tutorial="derniers-logs"
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
          Derniers Logs
        </h3>
        <div className="space-y-3 relative min-h-[200px]">
          {lastThreeLogs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: COLORS.text.secondary }}>
              Aucun log disponible
            </p>
          ) : (
            lastThreeLogs.map((log) => {
              const isResolved = resolvedLogs.has(log.id.toString());
              const isEntering = enteringLogs.has(log.id.toString());
              
              return (
                <div 
                  key={log.id}
                  className={isEntering ? 'log-enter' : ''}
                  onClick={() => navigate(`/logs/${log.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <LogCard log={log} isResolved={isResolved} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}