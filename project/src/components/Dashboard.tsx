import { AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { SeverityStats } from '../types';
import { COLORS } from '../constants/theme';

interface DashboardProps {
  stats: SeverityStats;
  totalLogs: number;
}

export default function Dashboard({ stats, totalLogs }: DashboardProps) {
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity size={20} style={{ color: COLORS.accent.deepBlue }} />
            <h3 className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
              Activité Système
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp size={16} style={{ color: COLORS.success }} />
            <span className="text-sm font-medium" style={{ color: COLORS.success }}>
              Opérationnel
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
              {totalLogs}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Total Événements
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.accent.deepBlue }}>
              12
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Pare-feu Actifs
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
              98.7%
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Disponibilité
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
              247ms
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Latence Moyenne
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: COLORS.background.card,
          borderColor: COLORS.border,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
          Résumé de Sécurité
        </h3>
        <div className="space-y-3">
          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: COLORS.background.hover,
              borderLeftColor: COLORS.severity.high,
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: COLORS.text.primary }}>
              <span className="font-semibold" style={{ color: COLORS.severity.high }}>
                Alerte Critique:
              </span>{' '}
              Détection de {stats.high} tentatives d'intrusion à haute priorité nécessitant une attention immédiate.
              Protocoles de réponse activés.
            </p>
          </div>
          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: COLORS.background.hover,
              borderLeftColor: COLORS.severity.medium,
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: COLORS.text.primary }}>
              <span className="font-semibold" style={{ color: COLORS.severity.medium }}>
                Surveillance Active:
              </span>{' '}
              {stats.medium} événements de priorité moyenne identifiés. Analyse comportementale en cours pour
              évaluation des risques potentiels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
