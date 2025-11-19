import axios from 'axios';

const BASE_URL = import.meta.env.VITE_OVH_AI_ENDPOINT_URL || 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1';
const API_KEY = import.meta.env.VITE_OVH_AI_ACCESS_TOKEN;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OVHChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_KEY || '';
    this.baseUrl = BASE_URL;

    if (!this.apiKey) {
      console.error('⚠️ OVH AI Access Token manquant. Ajoutez VITE_OVH_AI_ACCESS_TOKEN dans .env');
    }
  }

  /**
   * Appel API OVH AI Endpoints pour chat completion
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Token API OVH manquant. Configurez VITE_OVH_AI_ACCESS_TOKEN');
    }

    try {
      const response = await axios.post<OVHChatResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: options?.model || 'gpt-oss-120b',
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 512,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000, // 30 secondes
        }
      );

      return response.data.choices[0]?.message?.content || 'Pas de réponse';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Token API invalide ou expiré');
        }
        if (error.response?.status === 429) {
          throw new Error('Limite de taux atteinte. Réessayez plus tard.');
        }
        throw new Error(`Erreur API: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error('Erreur réseau inconnue');
    }
  }

  /**
   * Analyser un log de sécurité avec contexte
   */
  async analyzeSecurityLog(logData: {
    severity: string;
    type: string;
    attackSubtype?: string;
    explanation: string;
    firewallId: string;
  }): Promise<string> {
    const systemPrompt = `Tu es un expert en cybersécurité travaillant pour le Ministère des Armées français. 
Tu analyses des logs de pare-feu et fournis des recommandations claires et actionnables en français.
Sois concis, précis et technique.`;

    const userPrompt = `Analyse ce log de sécurité :

**Sévérité** : ${logData.severity}
**Type** : ${logData.type}
${logData.attackSubtype ? `**Sous-type d'attaque** : ${logData.attackSubtype}` : ''}
**Explication** : ${logData.explanation}
**Pare-feu** : ${logData.firewallId}

Fournis une analyse concise incluant :
1. Nature de la menace
2. Impact potentiel
3. Action recommandée immédiate
4. Mesures préventives`;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  }

  /**
   * Répondre à une question sur un log spécifique
   */
  async answerLogQuestion(
    logContext: string,
    userQuestion: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    const systemPrompt = `Tu es un assistant IA spécialisé en cybersécurité pour le Ministère des Armées.
Tu réponds aux questions des analystes SOC sur les logs de sécurité en français.
Sois précis, technique et fournis des recommandations concrètes.`;

    const contextMessage = `Contexte du log analysé : ${logContext}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextMessage },
      ...conversationHistory,
      { role: 'user', content: userQuestion },
    ];

    return this.chatCompletion(messages, { temperature: 0.7, maxTokens: 300 });
  }

  /**
   * Générer des suggestions de correction
   */
  async generateRemediationSteps(logData: {
    severity: string;
    type: string;
    attackSubtype?: string;
    explanation: string;
  }): Promise<string[]> {
    const prompt = `Basé sur ce log de sécurité (${logData.severity} - ${logData.type}${logData.attackSubtype ? ` - ${logData.attackSubtype}` : ''}) : "${logData.explanation}"

Génère 5 étapes concrètes de remédiation numérotées. Réponds uniquement avec les étapes, une par ligne, au format :
1. Étape 1
2. Étape 2
etc.`;

    const response = await this.chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 400 }
    );

    // Parser la réponse en array
    return response
      .split('\n')
      .filter((line) => line.trim() && /^\d+\./.test(line.trim()))
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 5);
  }
}

// Export singleton
export const llmService = new LLMService();