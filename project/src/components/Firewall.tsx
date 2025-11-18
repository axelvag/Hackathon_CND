import { Activity, TrendingUp } from 'lucide-react';
import { COLORS } from '../constants/theme';

interface FirewallProps {
  totalLogs: number;
}

export default function Firewall({ totalLogs }: FirewallProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Firewall
        </h2>
        <p className="text-sm" style={{ color: COLORS.text.secondary }}>
          Analyse avancée des menaces et surveillance du système
        </p>
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
    </div>
  );
}

