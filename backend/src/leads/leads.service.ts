import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { LeadMetricsService } from './lead-metrics.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private leadMetricsService: LeadMetricsService,
    private auditService: AuditService,
  ) {}

  async findAll(userId?: string, userRole?: string) {
    // Build query filters based on role
    const where: any = {};

    if (userRole === 'SALES') {
      // Sales executives see only their assigned leads
      where.assignedToId = userId;
    } else if (userRole === 'MANAGER') {
      // Managers see their team's leads
      const manager = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { teamMembers: true },
      });

      const teamMemberIds = manager?.teamMembers.map((member) => member.id) || [];
      // Include manager's own leads and team members' leads
      where.assignedToId = { in: [...teamMemberIds, userId] };
    }
    // CEO and ADMIN see all leads (no filter)

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich each lead with metrics and risk flags
    const enrichedLeads = await Promise.all(
      leads.map((lead) => this.enrichLeadWithMetrics(lead))
    );

    return enrichedLeads;
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!lead) {
      return null;
    }

    // Check access permissions
    if (userRole === 'SALES' && lead.assignedToId !== userId) {
      throw new Error('You do not have permission to view this lead');
    }

    if (userRole === 'MANAGER') {
      const manager = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { teamMembers: true },
      });

      const teamMemberIds = manager?.teamMembers.map((member) => member.id) || [];
      const canAccess =
        lead.assignedToId === userId || teamMemberIds.includes(lead.assignedToId || '');

      if (!canAccess) {
        throw new Error('You do not have permission to view this lead');
      }
    }

    // Enrich with metrics and risk flags
    return this.enrichLeadWithMetrics(lead);
  }

  async create(data: any, userId?: string) {
    const lead = await this.prisma.lead.create({
      data,
    });

    // Record initial stage in stage history
    if (userId) {
      await this.prisma.stageHistory.create({
        data: {
          leadId: lead.id,
          fromStage: null,
          toStage: lead.stage || 'New',
          changedBy: userId,
        },
      });
    }

    // Audit log
    await this.auditService.log({
      userId: data.assignedToId || userId || 'system',
      action: 'CREATE_LEAD',
      details: {
        leadId: lead.id,
        company: lead.company,
        contactName: lead.contactName,
        value: lead.value,
        stage: lead.stage,
      },
    });

    return lead;
  }

  async update(id: string, data: any, userId?: string) {
    // Check if stage is being changed
    if (data.stage && userId) {
      const currentLead = await this.prisma.lead.findUnique({
        where: { id },
        select: { stage: true },
      });

      if (currentLead && currentLead.stage !== data.stage) {
        // Record stage change in history
        await this.prisma.stageHistory.create({
          data: {
            leadId: id,
            fromStage: currentLead.stage,
            toStage: data.stage,
            changedBy: userId,
          },
        });
      }
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data,
    });

    // Audit log
    await this.auditService.log({
      userId: userId || 'system',
      action: 'UPDATE_LEAD',
      details: {
        leadId: id,
        updates: data,
      },
    });

    return updatedLead;
  }

  async remove(id: string, userId?: string) {
    // Get lead details before deletion for audit log
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        company: true,
        contactName: true,
        value: true,
      },
    });

    const deletedLead = await this.prisma.lead.delete({
      where: { id },
    });

    // Audit log
    if (lead) {
      await this.auditService.log({
        userId: userId || 'system',
        action: 'DELETE_LEAD',
        details: {
          leadId: id,
          company: lead.company,
          contactName: lead.contactName,
          value: lead.value,
        },
      });
    }

    return deletedLead;
  }

  async analyzeRisk(id: string, provider?: string) {
    const lead = await this.findOne(id);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const analysis = await this.aiService.analyzeLeadRisk(lead, provider);

    // Update lead with AI insights
    await this.update(id, {
      aiRiskLevel: analysis.riskLevel,
      aiSummary: analysis.summary,
      aiRecommendations: JSON.stringify(analysis.recommendations),
    });

    return analysis;
  }

  /**
   * Enrich lead with calculated metrics and risk flags
   */
  private async enrichLeadWithMetrics(lead: any) {
    // Calculate metrics
    const metrics = await this.leadMetricsService.calculateMetrics(lead.id, lead.createdAt);

    // Detect risk flags
    const riskFlags = this.leadMetricsService.detectRiskFlags(
      metrics,
      lead.value,
      lead.stage
    );

    // Generate suggested actions
    const suggestedActions = this.leadMetricsService.generateSuggestedActions(
      riskFlags,
      metrics,
      lead.stage
    );

    return {
      ...lead,
      metrics,
      riskFlags,
      suggestedActions,
    };
  }

  /**
   * Generate AI summary of lead based on activities and data
   */
  async generateAISummary(id: string, provider?: string) {
    // Get lead with all related data
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { name: true, email: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        files: {
          select: { category: true, originalName: true, createdAt: true },
        },
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get metrics
    const metrics = await this.leadMetricsService.calculateMetrics(lead.id, lead.createdAt);

    // Build context for AI
    const context = {
      leadName: lead.contactName,
      company: lead.company,
      status: lead.stage,
      estimatedValue: lead.value,
      source: lead.source,
      assignedTo: lead.assignedTo?.name,
      daysInPipeline: metrics.daysInPipeline,
      daysSinceLastContact: metrics.daysSinceLastContact,
      activityCount: metrics.activityCount,
      recentActivities: lead.activities.map((a) => ({
        type: a.type,
        content: a.content,
        date: a.createdAt,
      })),
      fileCategories: lead.files.map((f) => f.category),
    };

    // Generate AI summary
    const prompt = `Analyze this sales lead and provide:
1. A concise summary of the current situation (2-3 sentences)
2. Key insights about the lead's progress
3. Top 3 recommended next actions

Lead Information:
${JSON.stringify(context, null, 2)}

Format your response as JSON with fields: summary, insights (array), nextActions (array).`;

    try {
      const response = await this.aiService.chat(
        prompt,
        {},
        provider
      );

      const aiResponse = JSON.parse(response.message);

      // Update lead with AI summary
      await this.update(id, {
        aiSummary: aiResponse.summary,
        aiRecommendations: JSON.stringify(aiResponse.nextActions),
      });

      return {
        summary: aiResponse.summary,
        insights: aiResponse.insights || [],
        nextActions: aiResponse.nextActions || [],
        metrics,
      };
    } catch (error) {
      // Fallback to basic summary if AI fails
      return {
        summary: `${lead.contactName} from ${lead.company} - ${lead.stage} status. In pipeline for ${metrics.daysInPipeline} days.`,
        insights: [
          `Last contact: ${metrics.daysSinceLastContact} days ago`,
          `Total activities: ${metrics.activityCount}`,
          `Files uploaded: ${metrics.fileCount}`,
        ],
        nextActions: this.leadMetricsService.generateSuggestedActions(
          this.leadMetricsService.detectRiskFlags(metrics, lead.value, lead.stage),
          metrics,
          lead.stage
        ),
        metrics,
      };
    }
  }
}
