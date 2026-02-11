import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  AIProvider,
  LeadRiskAnalysis,
  ClientHealthReport,
  ExecutiveSummary,
  UpsellStrategy,
  ChatResponse,
} from '../interfaces/provider.interface';
import { buildLeadRiskPrompt, buildClientHealthPrompt, buildExecutiveSummaryPrompt, buildUpsellPrompt, buildChatPrompt } from '../prompts';

@Injectable()
export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  private isAvailable(): boolean {
    return !!this.client;
  }

  async analyzeLeadRisk(lead: any): Promise<LeadRiskAnalysis> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: buildLeadRiskPrompt(lead),
    });

    const content = response.text || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      return {
        riskLevel: 'Medium',
        summary: content,
        recommendations: [],
        confidence: 0.75,
      };
    }
  }

  async generateClientHealth(client: any): Promise<ClientHealthReport> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: buildClientHealthPrompt(client),
    });

    const content = response.text || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      return {
        healthScore: 75,
        summary: content,
        riskFactors: [],
        strengths: [],
        recommendations: [],
      };
    }
  }

  async generateExecutiveSummary(metrics: any): Promise<ExecutiveSummary> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: buildExecutiveSummaryPrompt(metrics),
    });

    const content = response.text || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      return {
        overview: content,
        whatChanged: [],
        whatIsAtRisk: [],
        whatNeedsAttention: [],
        keyInsights: [],
      };
    }
  }

  async generateUpsellStrategy(client: any): Promise<UpsellStrategy> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: buildUpsellPrompt(client),
    });

    const content = response.text || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      return {
        opportunities: [],
        approach: content,
        timing: 'Immediate',
      };
    }
  }

  async chat(message: string, context: any): Promise<ChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: buildChatPrompt(message, context),
    });

    const content = response.text || '';

    return { message: content };
  }
}
