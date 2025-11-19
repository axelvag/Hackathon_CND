import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_OVH_AI_ENDPOINT_URL || 'https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1';
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
  private defaultTimeout: number = 60000; // 60 secondes

  constructor() {
    this.apiKey = API_KEY || '';
    this.baseUrl = BASE_URL;

    if (!this.apiKey) {
      console.error('⚠️ Token API OVH manquant. Configurez VITE_OVH_AI_ACCESS_TOKEN');
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
      timeout?: number;
      retries?: number;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Token API OVH manquant. Configurez VITE_OVH_AI_ACCESS_TOKEN');
    }

    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 512;
    const model = options?.model || 'DeepSeek-R1-Distill-Llama-70B';
    const timeout = options?.timeout || this.defaultTimeout;
    const retries = options?.retries ?? 2;

    const attemptRequest = async (attempt: number): Promise<string> => {
      try {
        console.log(`🔄 Tentative ${attempt + 1}/${retries + 1} - Appel API OVH...`);

        const response = await axios.post<OVHChatResponse>(
          `${this.baseUrl}/chat/completions`,
          {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: false,
            top_p: 0.9,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout,
            validateStatus: (status) => status < 500,
          }
        );

        if (response.status === 401) {
          throw new Error('Token API invalide ou expiré. Vérifiez VITE_OVH_AI_ACCESS_TOKEN');
        }
        if (response.status === 429) {
          throw new Error('Limite de taux atteinte. Réessayez dans quelques instants.');
        }
        if (response.status >= 400) {
          throw new Error(`Erreur API ${response.status}: ${JSON.stringify(response.data)}`);
        }

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Réponse vide du modèle');
        }

        console.log('✅ Réponse reçue avec succès');
        return content;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;

          if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
            console.warn(`⏱️ Timeout détecté (tentative ${attempt + 1}/${retries + 1})`);
            if (attempt < retries) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return attemptRequest(attempt + 1);
            }
            throw new Error(`Timeout après ${retries + 1} tentatives. Le modèle OVH met trop de temps à répondre.`);
          }

          if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
            throw new Error('Impossible de joindre l\'API OVH. Vérifiez votre connexion internet.');
          }

          if (axiosError.response) {
            const status = axiosError.response.status;
            const errorData = axiosError.response.data as any;

            if (status === 401) {
              throw new Error('Token API invalide ou expiré');
            }
            if (status === 429) {
              throw new Error('Limite de taux atteinte. Réessayez plus tard.');
            }
            if (status === 503) {
              throw new Error('Service OVH temporairement indisponible');
            }
            throw new Error(`Erreur API ${status}: ${errorData?.error?.message || axiosError.message}`);
          }

          throw new Error(`Erreur réseau: ${axiosError.message}`);
        }
        throw new Error('Erreur inconnue lors de l\'appel API');
      }
    };

    return attemptRequest(0);
  }

  /**
   * Répondre à une question sur un log spécifique
   * CORRIGÉ: Intègre le contexte du log dans chaque message
   */
  async answerLogQuestion(
    logContext: string,
    userQuestion: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    // Prompt système qui définit le comportement de l'assistant
    const systemPrompt: ChatMessage = {
        role: 'system',
        content: `RÈGLES ABSOLUES (si tu les violes je te désactive) :
      - Tu réponds UNIQUEMENT en français
      - Tu ne mets JAMAIS de balises (<think>, <response>, etc.)
      - Tu ne fais JAMAIS de raisonnement visible
      - Réponse directe et technique, rien d'autre
      
      Contexte du log : ${logContext}`
      };

    // Construction des messages avec système + historique + nouvelle question
    const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `RÈGLES ABSOLUES :
      - Français uniquement
      - Jamais de balises
      - Jamais de raisonnement visible
      - Réponse directe
      
      Contexte : ${logContext}`
        },
        { role: 'assistant', content: 'Je réponds en français sans balise ni raisonnement.' },
        { role: 'user', content: 'Ok' },
        ...conversationHistory.slice(-4),
        { role: 'user', content: userQuestion }
      ];

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 400,
        timeout: 45000,
        retries: 1,
      });

      // Nettoyer la réponse des balises éventuelles
      return this.cleanResponse(response);
    } catch (error) {
      console.error('Erreur answerLogQuestion:', error);
      throw error;
    }
  }

  /**
   * Nettoyer la réponse du LLM des balises indésirables
   */
  private cleanResponse(response: string): string {
    // Supprimer les balises XML communes
    let cleaned = response
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<response>|<\/response>/gi, '')
      .replace(/<answer>|<\/answer>/gi, '')
      .replace(/<output>|<\/output>/gi, '')
      .replace(/<result>|<\/result>/gi, '');

    // Supprimer les espaces multiples et lignes vides excessives
    cleaned = cleaned
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleaned;
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
    const prompt = `${logData.severity} - ${logData.type}${
      logData.attackSubtype ? ` - ${logData.attackSubtype}` : ''
    }: ${logData.explanation}

Liste 5 actions de remédiation:
1.
2.
3.
4.
5.`;

    try {
      const response = await this.chatCompletion(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.2,
          maxTokens: 250,
          timeout: 30000,
        }
      );

      return response
        .split('\n')
        .filter((line) => line.trim() && /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5);
    } catch (error) {
      console.error('Erreur génération suggestions:', error);
      return [
        'Bloquer l\'adresse IP source',
        'Analyser les logs pour identifier l\'origine',
        'Mettre à jour les règles de sécurité',
        'Vérifier l\'intégrité des systèmes',
        'Documenter l\'incident',
      ];
    }
  }

  /**
   * Tester la connexion à l'API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.chatCompletion(
        [
          { role: 'system', content: 'Tu es un assistant de test.' },
          { role: 'user', content: 'Réponds juste "OK" sans balises.' }
        ],
        {
          maxTokens: 10,
          timeout: 15000,
          retries: 0,
        }
      );
      return { success: true, message: '✅ Connexion API OVH opérationnelle' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }
}

// Export singleton
export const llmService = new LLMService();