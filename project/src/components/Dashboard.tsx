import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SeverityStats, SecurityLog } from '../types';
import { COLORS } from '../constants/theme';
import LogCard from './LogCard';

interface DashboardProps {
  stats: SeverityStats;
  totalLogs: number;
  logs: SecurityLog[];
}

export default function Dashboard({ stats, totalLogs, logs }: DashboardProps) {
  const [visibleLogs, setVisibleLogs] = useState<SecurityLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitingLogs, setExitingLogs] = useState<Set<string>>(new Set());
  const [enteringLogs, setEnteringLogs] = useState<Set<string>>(new Set());

  // Trier les logs par timestamp (plus récents en premier) et prendre les logs nécessaires
  const sortedLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs]);

  // Réinitialiser quand les logs changent
  useEffect(() => {
    setVisibleLogs([]);
    setCurrentIndex(0);
    setExitingLogs(new Set());
    setEnteringLogs(new Set());
  }, [logs]);

  useEffect(() => {
    if (currentIndex < sortedLogs.length) {
      // Délai aléatoire entre 1 et 5 secondes
      const delay = Math.random() * 4000 + 1000; // 1000ms à 5000ms
      
      const timer = setTimeout(() => {
        const newLog = sortedLogs[currentIndex];
        const now = new Date();
        
        setVisibleLogs((prev) => {
          // Le nouveau log a le timestamp le plus récent (maintenant)
          const adjustedLog = {
            ...newLog,
            timestamp: new Date(now)
          };

          // Marquer le nouveau log pour l'animation d'entrée
          setEnteringLogs((prevEntering) => new Set(prevEntering).add(adjustedLog.id));
          
          // Retirer le marqueur d'entrée après l'animation
          setTimeout(() => {
            setEnteringLogs((prevEntering) => {
              const newSet = new Set(prevEntering);
              newSet.delete(adjustedLog.id);
              return newSet;
            });
          }, 400); // Durée de l'animation

          // Les logs existants sont décalés d'une seconde vers le passé
          // pour maintenir la cohérence : log[0] = maintenant, log[1] = -1s, log[2] = -2s
          const updatedPrev = prev.map((log, idx) => ({
            ...log,
            timestamp: new Date(now.getTime() - ((idx + 1) * 1000))
          }));

          const updated = [adjustedLog, ...updatedPrev];
          
          // Si on a plus de 3 logs, marquer le plus ancien pour animation de sortie
          if (updated.length > 3) {
            const oldestLog = updated[updated.length - 1];
            // Marquer le plus ancien pour animation de sortie
            setExitingLogs((prevExiting) => new Set(prevExiting).add(oldestLog.id));
            
            // Retirer le plus ancien après l'animation
            setTimeout(() => {
              setVisibleLogs((current) => {
                // Retirer le log le plus ancien de la liste
                return current.filter((log) => log.id !== oldestLog.id);
              });
              setExitingLogs((prevExiting) => {
                const newSet = new Set(prevExiting);
                newSet.delete(oldestLog.id);
                return newSet;
              });
            }, 400); // Durée de l'animation
            
            // Garder temporairement le log dans la liste pour l'animation
            return updated;
          }
          return updated;
        });
        
        setCurrentIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, sortedLogs, visibleLogs.length]);
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

  const highPercentage = (stats.high / totalLogs) * 100;
  const mediumPercentage = (stats.medium / totalLogs) * 100;
  const lowPercentage = (stats.low / totalLogs) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Vue d'Ensemble
        </h2>
        <p className="text-sm" style={{ color: COLORS.text.secondary }}>
          Surveillance en temps réel des menaces et événements de sécurité
        </p>
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
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
          Derniers Logs
        </h3>
        <div className="space-y-3 relative min-h-[200px]">
          {visibleLogs.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: COLORS.text.secondary }}>
              Chargement des logs...
            </p>
          )}
          {visibleLogs.slice(0, 4).map((log) => {
            const isExiting = exitingLogs.has(log.id);
            const isEntering = enteringLogs.has(log.id);
            return (
              <div
                key={log.id}
                className={isExiting ? 'log-exit' : isEntering ? 'log-enter' : ''}
              >
                <LogCard log={log} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
