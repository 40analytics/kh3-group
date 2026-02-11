import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { ClientMetricsService } from './client-metrics.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private clientMetricsService: ClientMetricsService,
    private auditService: AuditService,
  ) {}

  async findAll(userId?: string, userRole?: string) {
    // Build query filters based on role
    const where: any = {};

    if (userRole === 'SALES') {
      // Sales executives see only their assigned clients
      where.accountManagerId = userId;
    } else if (userRole === 'MANAGER') {
      // Managers see their team's clients
      const manager = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { teamMembers: true },
      });

      const teamMemberIds = manager?.teamMembers.map((member) => member.id) || [];
      // Include manager's own clients and team members' clients
      where.accountManagerId = { in: [...teamMemberIds, userId] };
    }
    // CEO and ADMIN see all clients (no filter)

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        accountManager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            value: true,
            startDate: true,
            completedDate: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        convertedFromLead: {
          select: {
            id: true,
            contactName: true,
            company: true,
            value: true,
            stage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich each client with metrics
    const enrichedClients = await Promise.all(
      clients.map((client) => this.enrichClientWithMetrics(client))
    );

    return enrichedClients;
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        accountManager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            value: true,
            startDate: true,
            completedDate: true,
            description: true,
            projectManager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          select: {
            id: true,
            type: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 activities for AI context
        },
        convertedFromLead: {
          select: {
            id: true,
            contactName: true,
            company: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    if (!client) {
      return null;
    }

    // Check access permissions
    if (userRole === 'SALES' && client.accountManagerId !== userId) {
      throw new Error('You do not have permission to view this client');
    }

    if (userRole === 'MANAGER') {
      const manager = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { teamMembers: true },
      });

      const teamMemberIds = manager?.teamMembers.map((member) => member.id) || [];
      const canAccess =
        client.accountManagerId === userId || teamMemberIds.includes(client.accountManagerId || '');

      if (!canAccess) {
        throw new Error('You do not have permission to view this client');
      }
    }

    // Enrich with metrics
    return this.enrichClientWithMetrics(client);
  }

  async create(data: any, userId?: string) {
    const client = await this.prisma.client.create({
      data,
    });

    // Audit log
    await this.auditService.log({
      userId: data.accountManagerId || userId || 'system',
      action: 'CREATE_CLIENT',
      details: {
        clientId: client.id,
        name: client.name,
        segment: client.segment,
        industry: client.industry,
      },
    });

    return client;
  }

  async update(id: string, data: any, userId?: string) {
    const client = await this.prisma.client.update({
      where: { id },
      data,
    });

    // Audit log
    await this.auditService.log({
      userId: userId || 'system',
      action: 'UPDATE_CLIENT',
      details: {
        clientId: id,
        updates: data,
      },
    });

    return client;
  }

  async remove(id: string, userId?: string) {
    // Get client details before deletion for audit log
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        segment: true,
        industry: true,
      },
    });

    const deletedClient = await this.prisma.client.delete({
      where: { id },
    });

    // Audit log
    if (client) {
      await this.auditService.log({
        userId: userId || 'system',
        action: 'DELETE_CLIENT',
        details: {
          clientId: id,
          name: client.name,
          segment: client.segment,
          industry: client.industry,
        },
      });
    }

    return deletedClient;
  }

  /**
   * Convert a won lead to a client with first project
   */
  async convertLeadToClient(
    leadId: string,
    accountManagerId?: string,
    projectManagerId?: string,
  ) {
    // Get the lead
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: true,
        client: true, // Include linked client if exists
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    if (lead.stage !== 'Won') {
      throw new Error('Only Won leads can be converted to clients');
    }

    if (lead.convertedToClientId) {
      throw new Error('Lead has already been converted');
    }

    let client;
    let isNewClient = false;

    // Check if lead is already linked to an existing client (repeat business)
    if (lead.clientId && lead.client) {
      // Use existing client
      client = await this.prisma.client.findUnique({
        where: { id: lead.clientId },
        include: {
          accountManager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } else {
      // Create new client from lead data
      client = await this.prisma.client.create({
        data: {
          name: lead.company,
          email: lead.email,
          phone: lead.phone,
          segment: 'SME', // Default, can be updated later
          industry: lead.serviceType || 'General',
          accountManagerId: accountManagerId || lead.assignedToId,
        },
        include: {
          accountManager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
      isNewClient = true;
    }

    // Create first project for the client
    const project = await this.prisma.project.create({
      data: {
        name: `${lead.company} - ${lead.serviceType || 'Project'}`,
        clientId: client.id,
        leadId: lead.id,
        status: 'Planning',
        value: lead.value,
        description: lead.notes || undefined,
        projectManagerId: projectManagerId || accountManagerId || lead.assignedToId,
      },
      include: {
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update lead to mark it as converted
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        convertedToClientId: client.id,
      },
    });

    // Update client project counts (increment for existing clients)
    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        totalProjectCount: { increment: 1 },
        activeProjectCount: { increment: 1 },
      },
    });

    const message = isNewClient
      ? `Successfully converted lead "${lead.contactName}" to new client "${client.name}" with first project`
      : `Successfully converted lead "${lead.contactName}" to project for existing client "${client.name}"`;

    // Audit log
    await this.auditService.log({
      userId: accountManagerId || lead.assignedToId || 'system',
      action: 'CONVERT_LEAD_TO_CLIENT',
      details: {
        leadId,
        clientId: client.id,
        clientName: client.name,
        projectId: project.id,
        projectName: project.name,
        isNewClient,
      },
    });

    return {
      client,
      project,
      message,
      isNewClient,
    };
  }

  /**
   * Enrich client with calculated metrics and health flags
   */
  private async enrichClientWithMetrics(client: any) {
    // Calculate metrics
    const metrics = await this.clientMetricsService.calculateMetrics(
      client.id,
      client.createdAt,
    );

    // Detect health flags
    const healthFlags = this.clientMetricsService.detectHealthFlags(
      metrics,
      client.lifetimeRevenue,
    );

    // Generate suggested actions
    const suggestedActions = this.clientMetricsService.generateSuggestedActions(
      healthFlags,
      metrics,
    );

    return {
      ...client,
      metrics,
      healthFlags,
      suggestedActions,
    };
  }

  /**
   * Automatically update health status using AI + metrics
   */
  async updateHealthStatus(id: string, provider?: string) {
    const client = await this.findOne(id);
    if (!client) {
      throw new Error('Client not found');
    }

    // Skip if status is manually overridden
    if (client.statusOverride) {
      return {
        message: 'Health status is manually overridden and will not be auto-updated',
        currentStatus: client.status,
        overrideReason: client.statusOverrideReason,
      };
    }

    // Generate health report with AI (includes metrics)
    const report = await this.aiService.generateClientHealth(client, provider);

    // Determine status based on metrics
    const calculatedStatus = this.clientMetricsService.determineHealthStatus(
      client.metrics?.engagementScore || 0,
      client.metrics?.activeProjectCount || 0,
    );

    // Update client
    await this.update(id, {
      status: calculatedStatus,
      healthScore: report.healthScore,
      aiHealthSummary: report.summary,
      statusLastCalculated: new Date(),
    });

    return {
      message: 'Health status updated successfully',
      status: calculatedStatus,
      healthScore: report.healthScore,
      report,
    };
  }

  /**
   * Manually override health status
   */
  async overrideHealthStatus(
    id: string,
    status: string,
    reason: string,
    userId: string,
  ) {
    const client = await this.findOne(id);
    if (!client) {
      throw new Error('Client not found');
    }

    await this.update(id, {
      status,
      statusOverride: true,
      statusOverrideReason: reason,
    });

    return {
      message: 'Health status overridden successfully',
      status,
      reason,
    };
  }

  async generateHealthReport(id: string, provider?: string) {
    const client = await this.findOne(id);
    if (!client) {
      throw new Error('Client not found');
    }

    const report = await this.aiService.generateClientHealth(client, provider);

    // Update client with AI insights
    await this.update(id, {
      healthScore: report.healthScore,
      aiHealthSummary: report.summary,
    });

    return report;
  }

  async generateUpsellStrategy(id: string, provider?: string) {
    const client = await this.findOne(id);
    if (!client) {
      throw new Error('Client not found');
    }

    const strategy = await this.aiService.generateUpsellStrategy(
      client,
      provider,
    );

    // Update client with upsell strategy
    await this.update(id, {
      aiUpsellStrategy: JSON.stringify(strategy),
    });

    return strategy;
  }
}
