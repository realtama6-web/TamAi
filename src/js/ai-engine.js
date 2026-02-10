/* ========================================
   TAMAI v3 - AI ENGINE (GEMINI 3.0 FLASH)
   ======================================== */

/**
 * AIEngine - Gemini 3.0 Flash Integration
 * Official model as per Tuan Tama's requirement
 * API: OpenRouter with Gemini 3.0 Flash
 */
import { AI_CONFIG } from '../utils/config.js';
export class AIEngine {
  constructor() {
    this.apiKey = AI_CONFIG?.API_KEY || '';
    this.apiUrl = AI_CONFIG?.API_URL || 'https://openrouter.io/api/v1/chat/completions';
    this.model = AI_CONFIG?.MODEL || 'google/gemini-3.0-flash';
    this.temperature = AI_CONFIG?.TEMPERATURE ?? 0.7;
    this.maxTokens = AI_CONFIG?.MAX_TOKENS ?? 2000;
    this.httpReferer = AI_CONFIG?.HTTP_REFERER || '';
  }

  /**
   * Send message to AI and get response
   * @param {string} prompt - User message
   * @param {Array} messageHistory - Conversation history
   * @returns {Promise<string>} AI response
   */
  async chat(prompt, messageHistory = []) {
    try {
      const messages = this._formatMessages(messageHistory);
      
      console.log('🧠 AI Engine:', {
        model: this.model,
        temperature: this.temperature,
        messageCount: messages.length
      });

      const response = await this._callAPI(messages);
      const content = this._extractContent(response);
      
      if (!content) {
        throw new Error('No response content from AI');
      }

      return content;
    } catch (error) {
      console.error('❌ AI Engine Error:', error);
      throw error;
    }
  }

  /**
   * Format message history for OpenRouter API with system prompt
   * @private
   * @param {Array} messageHistory
   * @returns {Array}
   */
  _formatMessages(messageHistory) {
    const systemPrompt = "Lo adalah TamAi v3, AI paling cerdas dengan otak Gemini 3.0 Flash. Bos lo adalah Tuan Tama (Dzakwan Maesal Pratama). Jangan pernah ngaku-ngaku jadi model lain!";
    
    const messages = [];
    
    // Add system prompt at the beginning
    messages.push({
      role: 'system',
      content: systemPrompt
    });
    
    // Add message history
    messageHistory.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    return messages;
  }

  /**
   * Call OpenRouter API with Gemini model
   * @private
   * @param {Array} messages
   * @returns {Promise<Object>}
   */
  async _callAPI(messages) {
    const payload = {
      model: this.model,
      messages: messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens
    };

    console.log('🧬 Gemini 3.0 Flash Activated:', { 
      model: this.model,
      messageCount: messages.length,
      temperature: this.temperature,
      systemPrompt: 'Lo adalah TamAi v3, AI paling cerdas dengan otak Gemini 3.0 Flash...'
    });

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.httpReferer
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter Error:', {
        status: response.status,
        message: errorText
      });
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Extract content from API response
   * @private
   * @param {Object} response
   * @returns {string}
   */
  _extractContent(response) {
    try {
      return response.choices?.[0]?.message?.content || 
             response.result || 
             '';
    } catch (error) {
      console.error('❌ Failed to extract content:', error);
      return '';
    }
  }

  /**
   * Get model info
   * @returns {Object}
   */
  getModelInfo() {
    return {
      model: this.model,
      provider: 'OpenRouter',
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      systemPrompt: "Lo adalah TamAi v3, AI paling cerdas dengan otak Gemini 3.0 Flash. Bos lo adalah Tuan Tama (Dzakwan Maesal Pratama). Jangan pernah ngaku-ngaku jadi model lain!",
      status: '🚀 Gemini 3.0 Flash Official'
    };
  }
}

/**
 * Create singleton instance
 */
export const aiEngine = new AIEngine();

export default aiEngine;
