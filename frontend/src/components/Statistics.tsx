import { Shield, Activity, AlertTriangle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useColors } from '../contexts/ThemeContext';
import { SecurityLog } from '../types';

interface StatisticsProps {
  logs: SecurityLog[];
  totalLogs: number;
}

export default function Statistics({ logs, totalLogs }: StatisticsProps) {
  const COLORS = useColors();
  // 1. Distribution de sévérité (Donut Chart)
  const severityData = [
    {
      name: 'High',
      value: logs.filter((l) => l.severity === 'High').length,
      color: COLORS.severity.high,
    },
    {
      name: 'Medium',
      value: logs.filter((l) => l.severity === 'Medium').length,
      color: COLORS.severity.medium,
    },
    {
      name: 'Low',
      value: logs.filter((l) => l.severity === 'Low').length,
      color: COLORS.severity.low,
    },
  ];

  // 2. Top 10 Types d'Attaques
  const attackTypes = logs
    .filter((l) => l.attackSubtype)
    .reduce((acc, log) => {
      const type = log.attackSubtype || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topAttacks = Object.entries(attackTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // 3. Évolution temporelle (7 derniers jours)
  const getLast7Days = (): string[] => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const timelineData = getLast7Days().map((date) => {
    const dayLogs = logs.filter((l) => {
      const logDate = new Date(l.timestamp).toISOString().split('T')[0];
      return logDate === date;
    });
    return {
      date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      High: dayLogs.filter((l) => l.severity === 'High').length,
      Medium: dayLogs.filter((l) => l.severity === 'Medium').length,
      Low: dayLogs.filter((l) => l.severity === 'Low').length,
      total: dayLogs.length,
    };
  });

  // 4. Activité par Pare-feu
  const firewallStats = logs.reduce((acc, log) => {
    const fw = log.firewallId;
    if (!acc[fw]) {
      acc[fw] = { firewall: fw, High: 0, Medium: 0, Low: 0 };
    }
    acc[fw][log.severity]++;
    return acc;
  }, {} as Record<string, any>);

  const firewallData = Object.values(firewallStats);

  // 5. Bug vs Attack
  const bugVsAttack = [
    { name: 'Bugs', value: logs.filter((l) => l.type === 'Bug').length },
    { name: 'Attacks', value: logs.filter((l) => l.type === 'Attack').length },
  ];

  // 6. Top Bug Types (utilise attackSubtype pour les bugs aussi, ou crée une catégorie générique)
  const bugTypes = logs
    .filter((l) => l.type === 'Bug')
    .reduce((acc, log) => {
      // Pour les bugs, on peut utiliser attackSubtype s'il existe, sinon "Bug générique"
      const type = log.attackSubtype || 'Bug générique';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topBugs = Object.entries(bugTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // 7. Score de santé global
  const healthScore = totalLogs > 0
    ? Math.max(
        0,
        Math.min(
          100,
          100 -
            (severityData[0].value * 3 + severityData[1].value * 1.5 + severityData[2].value * 0.5) /
              totalLogs
        )
      )
    : 100; // Si aucun log, score parfait

  const getHealthColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 50) return COLORS.severity.medium;
    return COLORS.severity.high;
  };

  // 8. Taux critique
  const criticalRate = totalLogs > 0
    ? ((severityData[0].value / totalLogs) * 100).toFixed(1)
    : '0.0';

  // 9. Heatmap data (simplified - by hour)
  const heatmapData = Array.from({ length: 24 }, (_, hour) => {
    const hourLogs = logs.filter((l) => {
      const logHour = new Date(l.timestamp).getHours();
      return logHour === hour;
    });
    return {
      hour: `${hour}h`,
      count: hourLogs.length,
      intensity: hourLogs.length,
    };
  });

  const maxHeatmapValue = Math.max(...heatmapData.map((d) => d.count), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Tableau de Bord Analytique
        </h2>
        <p className="text-sm" style={{ color: COLORS.text.secondary }}>
          Analyse approfondie des menaces et tendances de sécurité
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Global */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                Score de Santé Global
              </p>
              <p className="text-4xl font-bold mt-2" style={{ color: getHealthColor(healthScore) }}>
                {healthScore.toFixed(0)}/100
              </p>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${getHealthColor(healthScore)}20` }}
            >
              <Shield size={32} style={{ color: getHealthColor(healthScore) }} />
            </div>
          </div>
          <div
            className="h-2 rounded-full"
            style={{ backgroundColor: COLORS.background.hover }}
          >
            <div
              className="h-2 rounded-full transition-all"
              style={{
                backgroundColor: getHealthColor(healthScore),
                width: `${healthScore}%`,
              }}
            />
          </div>
        </div>

        {/* Total Logs */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                Total Événements
              </p>
              <p className="text-4xl font-bold mt-2" style={{ color: COLORS.text.primary }}>
                {totalLogs.toLocaleString()}
              </p>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.accent.deepBlue}20` }}
            >
              <Activity size={32} style={{ color: COLORS.accent.deepBlue }} />
            </div>
          </div>
          <p className="text-xs" style={{ color: COLORS.text.muted }}>
            <span style={{ color: COLORS.success }}>↑ 12.5%</span> vs période précédente
          </p>
        </div>

        {/* Taux Critique */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                Taux Critique
              </p>
              <p className="text-4xl font-bold mt-2" style={{ color: COLORS.severity.high }}>
                {criticalRate}%
              </p>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.severity.high}20` }}
            >
              <AlertTriangle size={32} style={{ color: COLORS.severity.high }} />
            </div>
          </div>
          <p className="text-xs" style={{ color: COLORS.text.muted }}>
            {severityData[0].value} menaces critiques détectées
          </p>
        </div>
      </div>

      {/* Charts Row 1: Distribution & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution de Sévérité (Donut) */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
            Distribution de Sévérité
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text.primary,
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const severityName = (data.payload?.name || data.name) as string;
                    const severityValue = data.value as number;
                    const severityColor = severityData.find(s => s.name === severityName)?.color || COLORS.text.primary;
                    return (
                      <div
                        className="rounded-lg p-3 border"
                        style={{
                          backgroundColor: COLORS.background.card,
                          borderColor: COLORS.border,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: severityColor }}>
                          {severityName}: {severityValue}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ color: COLORS.text.primary }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution Temporelle (Area Chart) */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
            Évolution sur 7 Jours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.severity.high} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.severity.high} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.severity.medium} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.severity.medium} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.severity.low} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.severity.low} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="date" stroke={COLORS.text.muted} style={{ fontSize: '12px' }} />
              <YAxis stroke={COLORS.text.muted} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text.primary,
                }}
              />
              <Area
                type="monotone"
                dataKey="High"
                stackId="1"
                stroke={COLORS.severity.high}
                fillOpacity={1}
                fill="url(#colorHigh)"
              />
              <Area
                type="monotone"
                dataKey="Medium"
                stackId="1"
                stroke={COLORS.severity.medium}
                fillOpacity={1}
                fill="url(#colorMedium)"
              />
              <Area
                type="monotone"
                dataKey="Low"
                stackId="1"
                stroke={COLORS.severity.low}
                fillOpacity={1}
                fill="url(#colorLow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Top Attacks & Firewall Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Attaques */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
            Top 10 Types d'Attaques
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAttacks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis type="number" stroke={COLORS.text.muted} style={{ fontSize: '12px' }} />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                stroke={COLORS.text.muted}
                style={{ fontSize: '11px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text.primary,
                }}
              />
              <Bar dataKey="count" fill={COLORS.severity.high} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activité par Pare-feu */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
            Activité par Pare-feu
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={firewallData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="firewall" stroke={COLORS.text.muted} style={{ fontSize: '12px' }} />
              <YAxis stroke={COLORS.text.muted} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text.primary,
                }}
              />
              <Legend
                wrapperStyle={{ color: COLORS.text.primary }}
                iconType="circle"
              />
              <Bar dataKey="High" stackId="a" fill={COLORS.severity.high} />
              <Bar dataKey="Medium" stackId="a" fill={COLORS.severity.medium} />
              <Bar dataKey="Low" stackId="a" fill={COLORS.severity.low} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3: Bug Types & Bug vs Attack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Bug Types */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
            Types de Bugs les Plus Fréquents
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBugs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis type="number" stroke={COLORS.text.muted} style={{ fontSize: '12px' }} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                stroke={COLORS.text.muted}
                style={{ fontSize: '11px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text.primary,
                }}
              />
              <Bar dataKey="count" fill={COLORS.accent.deepBlue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bug vs Attack Distribution */}
        <div
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
            Répartition Bugs vs Attaques
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bugVsAttack}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              >
                <Cell fill={COLORS.accent.deepBlue} />
                <Cell fill={COLORS.severity.high} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.background.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text.primary,
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const typeName = (data.payload?.name || data.name) as string;
                    const typeValue = data.value as number;
                    // Bugs = deepBlue, Attacks = high (red)
                    const typeColor = typeName === 'Bugs' 
                      ? COLORS.accent.deepBlue 
                      : COLORS.severity.high;
                    return (
                      <div
                        className="rounded-lg p-3 border"
                        style={{
                          backgroundColor: COLORS.background.card,
                          borderColor: COLORS.border,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: typeColor }}>
                          {typeName}: {typeValue}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap Temporelle */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: COLORS.background.card,
          borderColor: COLORS.border,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
          Heatmap d'Activité par Heure
        </h3>
        <div className="grid grid-cols-12 gap-1">
          {heatmapData.map((item, index) => {
            const opacity = maxHeatmapValue > 0 ? item.count / maxHeatmapValue : 0;
            return (
              <div
                key={index}
                className="aspect-square rounded flex flex-col items-center justify-center text-xs transition-all hover:scale-110"
                style={{
                  backgroundColor: `${COLORS.severity.high}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                  color: opacity > 0.5 ? '#fff' : COLORS.text.primary,
                }}
                title={`${item.hour}: ${item.count} événements`}
              >
                <span className="font-bold">{item.count}</span>
                <span className="text-[10px]">{item.hour}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}