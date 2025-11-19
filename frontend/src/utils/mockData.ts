import { SecurityLog, SeverityLevel, LogType } from '../types';

// Dataset basé sur le fichier CSV fourni
interface CSVLogRow {
  firewall_id: string;
  timestamp: string;
  bug_type: string;
  severity: SeverityLevel;
  explanation: string;
  type: LogType;
  attack_type: string;
}

// Données extraites du CSV
const csvData: CSVLogRow[] = [
  // Bugs
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:00:07Z', bug_type: 'malformed_timestamp', severity: 'High', explanation: 'Timestamp invalide — tri temporel impossible.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:00:25Z', bug_type: 'corrupt_line', severity: 'High', explanation: 'Ligne corrompue — impossible à parser correctement.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:00:41Z', bug_type: 'corrupt_line', severity: 'High', explanation: 'Ligne corrompue — impossible à parser correctement.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:00:59Z', bug_type: 'nonnumeric_port', severity: 'Medium', explanation: 'Port non numérique — empêche mapping service/port.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:01:10Z', bug_type: 'nonnumeric_port', severity: 'Medium', explanation: 'Port non numérique — empêche mapping service/port.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:01:22Z', bug_type: 'missing_field', severity: 'Low', explanation: 'Champ manquant — perte d\'information contextuelle.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:01:39Z', bug_type: 'missing_field', severity: 'Low', explanation: 'Champ manquant — perte d\'information contextuelle.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:01:40Z', bug_type: 'negative_bytes', severity: 'Medium', explanation: 'Octets négatifs — incohérence de comptage.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:02:02Z', bug_type: 'nonnumeric_port', severity: 'Medium', explanation: 'Port non numérique — empêche mapping service/port.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:02:09Z', bug_type: 'missing_field', severity: 'Low', explanation: 'Champ manquant — perte d\'information contextuelle.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:02:13Z', bug_type: 'missing_field', severity: 'Low', explanation: 'Champ manquant — perte d\'information contextuelle.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:02:19Z', bug_type: 'corrupt_line', severity: 'High', explanation: 'Ligne corrompue — impossible à parser correctement.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:02:25Z', bug_type: 'invalid_ip', severity: 'High', explanation: 'IP invalide — données corrompues ou erronées.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:02:36Z', bug_type: 'missing_field', severity: 'Low', explanation: 'Champ manquant — perte d\'information contextuelle.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:02:37Z', bug_type: 'corrupt_line', severity: 'High', explanation: 'Ligne corrompue — impossible à parser correctement.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:02:55Z', bug_type: 'corrupt_line', severity: 'High', explanation: 'Ligne corrompue — impossible à parser correctement.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:03:06Z', bug_type: 'duplicate_fields', severity: 'Low', explanation: 'Champs dupliqués — peut provoquer ambiguïté de parsing.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:03:09Z', bug_type: 'malformed_timestamp', severity: 'High', explanation: 'Timestamp invalide — tri temporel impossible.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:03:23Z', bug_type: 'corrupt_line', severity: 'High', explanation: 'Ligne corrompue — impossible à parser correctement.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:03:31Z', bug_type: 'corrupt_line', severity: 'High', explanation: 'Ligne corrompue — impossible à parser correctement.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:03:42Z', bug_type: 'invalid_ip', severity: 'High', explanation: 'IP invalide — données corrompues ou erronées.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:03:45Z', bug_type: 'nonnumeric_port', severity: 'Medium', explanation: 'Port non numérique — empêche mapping service/port.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:03:55Z', bug_type: 'malformed_timestamp', severity: 'High', explanation: 'Timestamp invalide — tri temporel impossible.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:04:18Z', bug_type: 'malformed_timestamp', severity: 'High', explanation: 'Timestamp invalide — tri temporel impossible.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-B', timestamp: '2025-04-01T00:04:52Z', bug_type: 'negative_bytes', severity: 'Medium', explanation: 'Octets négatifs — incohérence de comptage.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:04:54Z', bug_type: 'malformed_timestamp', severity: 'High', explanation: 'Timestamp invalide — tri temporel impossible.', type: 'Bug', attack_type: '' },
  { firewall_id: 'FW-A', timestamp: '2025-04-01T00:05:16Z', bug_type: 'invalid_ip', severity: 'High', explanation: 'IP invalide — données corrompues ou erronées.', type: 'Bug', attack_type: '' },
  // Attacks - je vais inclure un échantillon représentatif, le reste sera généré aléatoirement depuis le dataset
  { firewall_id: 'FW-B', timestamp: '2025-04-07T10:39:22Z', bug_type: '', severity: 'Medium', explanation: 'Scan de ports — activité de reconnaissance.', type: 'Attack', attack_type: 'port_scan' },
  { firewall_id: 'FW-A', timestamp: '2025-04-07T10:39:23Z', bug_type: '', severity: 'High', explanation: 'Brute-force SSH — tentative de compromission de comptes.', type: 'Attack', attack_type: 'brute_force_ssh' },
  { firewall_id: 'FW-A', timestamp: '2025-04-07T10:39:37Z', bug_type: '', severity: 'Medium', explanation: 'Tentative XSS — attaque applicative visant scripts côté client.', type: 'Attack', attack_type: 'xss' },
  { firewall_id: 'FW-B', timestamp: '2025-04-07T10:39:44Z', bug_type: '', severity: 'Medium', explanation: 'Tentative XSS — attaque applicative visant scripts côté client.', type: 'Attack', attack_type: 'xss' },
  { firewall_id: 'FW-B', timestamp: '2025-04-07T10:39:46Z', bug_type: '', severity: 'High', explanation: 'Téléchargement malveillant — risque d\'infection.', type: 'Attack', attack_type: 'malware_download' },
  { firewall_id: 'FW-A', timestamp: '2025-04-07T10:44:05Z', bug_type: '', severity: 'High', explanation: 'Tentative d\'injection SQL — attaque applicative critique.', type: 'Attack', attack_type: 'sql_injection' },
  { firewall_id: 'FW-A', timestamp: '2025-04-07T10:43:02Z', bug_type: '', severity: 'High', explanation: 'Potentiel DDoS détecté — schéma de volume ou de fréquence malveillant.', type: 'Attack', attack_type: 'ddos' },
];

// Types d'attaques disponibles dans le dataset
const attackTypes = ['port_scan', 'brute_force_ssh', 'xss', 'malware_download', 'sql_injection', 'ddos'];

// Firewalls disponibles
const firewalls = ['FW-A', 'FW-B'];

// Fonction pour convertir une ligne CSV en SecurityLog
function csvRowToLog(row: CSVLogRow, id: number): SecurityLog {
  const log: SecurityLog = {
    id: id, // Stocker uniquement le nombre
    timestamp: new Date(row.timestamp),
    firewallId: row.firewall_id,
    severity: row.severity,
    explanation: row.explanation,
    type: row.type,
  };

  // Ajouter le subtype selon le type
  if (row.type === 'Attack' && row.attack_type) {
    log.attackSubtype = row.attack_type;
  } else if (row.type === 'Bug' && row.bug_type) {
    // Pour les bugs, on utilise attackSubtype pour stocker bug_type
    log.attackSubtype = row.bug_type;
  }

  return log;
}

// Fonction pour obtenir un élément aléatoire d'un tableau
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Générer des valeurs aléatoires pour les métadonnées réseau
function generateRandomIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateRandomPort(): number {
  return Math.floor(Math.random() * 65535) + 1024;
}

function generateSessionId(): string {
  return Array.from({ length: 12 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
}

// Fonction pour générer un log basé sur le dataset
function generateLogFromDataset(id: number, useCurrentTime: boolean = false): SecurityLog {
  // Choisir aléatoirement une ligne du dataset comme base
  const baseRow = randomItem(csvData);
  
  // Créer un log basé sur cette ligne
  const log = csvRowToLog(baseRow, id);
  
  // Si on veut utiliser le temps actuel (pour les nouveaux logs)
  if (useCurrentTime) {
    log.timestamp = new Date();
  } else {
    // Sinon, utiliser le timestamp du dataset mais avec une variation aléatoire
    const baseTime = new Date(baseRow.timestamp);
    const variation = Math.random() * 24 * 60 * 60 * 1000; // Variation de 0 à 24h
    log.timestamp = new Date(baseTime.getTime() - variation);
  }

  // Parfois varier le firewall aléatoirement
  if (Math.random() > 0.7) {
    log.firewallId = randomItem(firewalls);
  }

  // Pour les attaques, parfois varier le type d'attaque
  if (log.type === 'Attack' && Math.random() > 0.5) {
    log.attackSubtype = randomItem(attackTypes);
    // Mettre à jour l'explication selon le type d'attaque
    const attackExplanations: Record<string, string> = {
      'port_scan': 'Scan de ports — activité de reconnaissance.',
      'brute_force_ssh': 'Brute-force SSH — tentative de compromission de comptes.',
      'xss': 'Tentative XSS — attaque applicative visant scripts côté client.',
      'malware_download': 'Téléchargement malveillant — risque d\'infection.',
      'sql_injection': 'Tentative d\'injection SQL — attaque applicative critique.',
      'ddos': 'Potentiel DDoS détecté — schéma de volume ou de fréquence malveillant.',
    };
    log.explanation = attackExplanations[log.attackSubtype] || log.explanation;
    
    // Ajuster la sévérité selon le type d'attaque
    if (['brute_force_ssh', 'sql_injection', 'ddos', 'malware_download'].includes(log.attackSubtype)) {
      log.severity = 'High';
    } else {
      log.severity = 'Medium';
    }
  }

  // Générer les métadonnées des logs bruts
  const protocols = ['TCP', 'UDP', 'ICMP', 'HTTPS'];
  const actions = ['ALLOW', 'DENY', 'DROP'];
  const statuses = ['OK', 'FAILED', 'BLOCKED'];
  const flagsList = ['SYN', 'RST', 'FIN', 'ACK', ''];
  
  log.srcIp = generateRandomIp();
  log.dstIp = generateRandomIp();
  log.srcPort = generateRandomPort();
  log.dstPort = generateRandomPort();
  log.protocol = randomItem(protocols);
  log.action = randomItem(actions);
  log.bytes = Math.floor(Math.random() * 10000) + 100;
  log.durationMs = Math.floor(Math.random() * 1000);
  log.ruleId = `R${Math.floor(Math.random() * 200)}`;
  log.sessionId = generateSessionId();
  log.user = Math.random() > 0.7 ? ['dana', 'admin', 'system', 'user'][Math.floor(Math.random() * 4)] : undefined;
  log.status = randomItem(statuses);
  log.flags = randomItem(flagsList);

  // Pour les bugs, s'assurer que bug_type est préservé (déjà fait dans csvRowToLog)
  // Si on veut varier, on peut le faire ici

  return log;
}

/**
 * Génère des logs mockup basés sur le dataset CSV
 */
export function generateMockLogs(count: number): SecurityLog[] {
  return Array.from({ length: count }, (_, i) => generateLogFromDataset(i + 1));
}

/**
 * Génère un nouveau log avec un ID incrémental
 * Le log aura un timestamp actuel pour apparaître comme le plus récent
 */
export function generateNewLog(getNextId: () => number): SecurityLog {
  // Utiliser un ID incrémental
  const nextId = getNextId();
  const log = generateLogFromDataset(nextId, true);
  // S'assurer que le timestamp est actuel pour les nouveaux logs
  log.timestamp = new Date();
  return log;
}
