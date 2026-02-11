import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  private isAvailable(): boolean {
    return !!this.client;
  }

  async analyzeLeadRisk(lead: any): Promise<LeadRiskAnalysis> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: buildLeadRiskPrompt(lead),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  async generateClientHealth(client: any): Promise<ClientHealthReport> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: buildClientHealthPrompt(client),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  async generateExecutiveSummary(metrics: any): Promise<ExecutiveSummary> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: buildExecutiveSummaryPrompt(metrics),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  async generateUpsellStrategy(client: any): Promise<UpsellStrategy> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: buildUpsellPrompt(client),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  async chat(message: string, context: any): Promise<ChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: buildChatPrompt(message, context),
        },
      ],
    });

    const content = response.choices[0].message.content || '';
    return { message: content };
  }
}
