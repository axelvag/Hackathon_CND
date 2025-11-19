/**
 * Service pour lire progressivement le fichier CSV des logs firewall
 */

import { RawCSVLog } from '../types';

export class CSVService {
  private csvUrl: string;
  private currentLineIndex: number = 0;
  private allLines: string[] | null = null;
  private isLoading: boolean = false;

  constructor(csvUrl: string = '/firewall_logs.csv') {
    this.csvUrl = csvUrl;
  }

  /**
   * Charge le fichier CSV et parse les lignes
   */
  async loadCSV(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    if (this.allLines !== null) {
      return; // Déjà chargé
    }

    this.isLoading = true;
    try {
      const response = await fetch(this.csvUrl);
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement du CSV: ${response.statusText}`);
      }

      const text = await response.text();
      // Séparer les lignes (en gérant les retours à la ligne Windows/Unix)
      this.allLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      // Ignorer la première ligne (header)
      if (this.allLines.length > 0 && this.allLines[0].includes('timestamp')) {
        this.allLines = this.allLines.slice(1);
      }

      console.log(`✅ CSV chargé: ${this.allLines.length} lignes`);
    } catch (error) {
      console.error('Erreur lors du chargement du CSV:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse une ligne CSV en objet RawCSVLog
   */
  private parseCSVLine(line: string): RawCSVLog | null {
    // Parser CSV simple (gère les virgules dans les champs entre guillemets)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Dernière valeur

    // Vérifier qu'on a assez de colonnes
    if (values.length < 16) {
      console.warn(`Ligne CSV invalide (${values.length} colonnes au lieu de 16):`, line.substring(0, 100));
      return null;
    }

    return {
      timestamp: values[0] || '',
      firewall_id: values[1] || '',
      src_ip: values[2] || '',
      dst_ip: values[3] || '',
      src_port: values[4] || '',
      dst_port: values[5] || '',
      protocol: values[6] || '',
      action: values[7] || '',
      bytes: values[8] || '',
      duration_ms: values[9] || '',
      rule_id: values[10] || '',
      session_id: values[11] || '',
      user: values[12] || '',
      reason: values[13] || '',
      status: values[14] || '',
      flags: values[15] || '',
    };
  }

  /**
   * Récupère la prochaine ligne de log brut depuis le CSV
   * Retourne null si toutes les lignes ont été lues
   */
  async getNextLog(): Promise<RawCSVLog | null> {
    // S'assurer que le CSV est chargé
    await this.loadCSV();

    if (!this.allLines || this.currentLineIndex >= this.allLines.length) {
      return null; // Toutes les lignes ont été lues
    }

    const line = this.allLines[this.currentLineIndex];
    this.currentLineIndex++;

    const parsed = this.parseCSVLine(line);
    
    // Si la ligne est invalide, essayer la suivante
    if (!parsed) {
      return this.getNextLog();
    }

    return parsed;
  }

  /**
   * Réinitialise l'index pour recommencer depuis le début
   */
  reset(): void {
    this.currentLineIndex = 0;
  }

  /**
   * Retourne le nombre total de lignes dans le CSV
   */
  getTotalLines(): number {
    return this.allLines?.length || 0;
  }

  /**
   * Retourne l'index de la ligne actuelle
   */
  getCurrentIndex(): number {
    return this.currentLineIndex;
  }

  /**
   * Vérifie s'il reste des lignes à lire
   */
  hasMore(): boolean {
    return this.allLines !== null && this.currentLineIndex < this.allLines.length;
  }
}

// Export singleton
export const csvService = new CSVService();

