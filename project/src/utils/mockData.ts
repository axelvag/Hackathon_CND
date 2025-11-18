import { SecurityLog, SeverityLevel, LogType } from '../types';

const attackSubtypes = [
  'DDoS',
  'SQL Injection',
  'XSS',
  'Brute Force',
  'Port Scanning',
  'Ransomware',
  'Phishing',
  'Man-in-the-Middle',
];

const explanations = {
  High: [
    'Tentative d\'intrusion détectée sur le serveur principal avec exploitation de vulnérabilité CVE-2024-1234',
    'Attaque DDoS massive identifiée - 45000 requêtes/seconde en provenance de 127 adresses IP distinctes',
    'Injection SQL réussie détectée sur la base de données critique - accès non autorisé aux tables sensibles',
    'Ransomware en cours d\'exécution détecté - chiffrement de fichiers systèmes critiques en cours',
    'Exfiltration de données sensibles détectée vers serveur externe non autorisé (2.3 GB transférés)',
  ],
  Medium: [
    'Scan de ports détecté sur infrastructure réseau - analyse de 1024 ports depuis IP suspecte',
    'Tentative de force brute sur comptes administrateurs - 847 tentatives en 15 minutes',
    'Accès répété aux ressources sensibles avec credentials invalides - possible reconnaissance',
    'Activité suspecte détectée - multiples requêtes anormales depuis zone géographique inhabituelle',
    'Violation de politique de sécurité - transfert de fichiers non chiffrés sur réseau externe',
  ],
  Low: [
    'Échec d\'authentification légitime - utilisateur a oublié son mot de passe (3 tentatives)',
    'Tentative de connexion depuis nouvel appareil nécessitant validation secondaire',
    'Alerte de configuration mineure - certificat SSL proche de l\'expiration (14 jours)',
    'Mise à jour de sécurité disponible pour composant non-critique du système',
    'Activité inhabituelle de faible priorité détectée - analyse comportementale en cours',
  ],
};

const firewalls = [
  'FW-PARIS-01',
  'FW-LYON-02',
  'FW-MARSEILLE-03',
  'FW-TOULOUSE-04',
  'FW-BORDEAUX-05',
  'FW-STRASBOURG-06',
  'FW-DMZ-01',
  'FW-DMZ-02',
  'FW-CORE-01',
  'FW-EDGE-01',
  'FW-BACKUP-01',
  'FW-CLOUD-01',
];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateLog(id: number): SecurityLog {
  const severities: SeverityLevel[] = ['High', 'Medium', 'Low'];
  const weights = [0.15, 0.35, 0.5];

  const random = Math.random();
  let severity: SeverityLevel;
  if (random < weights[0]) {
    severity = 'High';
  } else if (random < weights[0] + weights[1]) {
    severity = 'Medium';
  } else {
    severity = 'Low';
  }

  const type: LogType = Math.random() > 0.3 ? 'Attack' : 'Bug';
  const attackSubtype = type === 'Attack' && severity !== 'Low' ? randomItem(attackSubtypes) : undefined;

  const now = new Date();
  const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);

  return {
    id: `LOG-${String(id).padStart(8, '0')}`,
    timestamp,
    firewallId: randomItem(firewalls),
    severity,
    explanation: randomItem(explanations[severity]),
    type,
    attackSubtype,
  };
}

export function generateMockLogs(count: number): SecurityLog[] {
  return Array.from({ length: count }, (_, i) => generateLog(i + 1));
}
