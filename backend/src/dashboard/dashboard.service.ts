import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface DashboardMetrics {
  // Revenue metrics
  totalRevenue: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  revenueByClient: { clientId: string; clientName: string; revenue: number }[];
  revenueByProject: { projectId: string; projectName: string; revenue: number }[];

  // Conversion metrics
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  winRate: number; // Percentage
  avgDealSize: number;

  // Funnel metrics
  funnelDropOff: {
    stage: string;
    count: number;
    dropOffRate: number; // Percentage lost from previous stage
  }[];

  // Time metrics
  avgTimeToQuote: number; // Days from lead created to quote sent
  avgTimeToClose: number; // Days from lead created to deal closed

  // Project metrics
  totalProjects: number;
  activeProjects: number;
  projectsByStatus: { status: string; count: number }[];
  projectsAtRisk: { projectId: string; projectName: string; reason: string }[];

  // Pipeline health
  pipelineValue: number;
  highValueDeals: { leadId: string; company: string; value: number; stage: string }[];
  stalledLeads: { leadId: string; company: string; daysStalled: number; stage: string }[];

  // Client metrics
  activeClients: number;
  topClients: { clientId: string; clientName: string; revenue: number }[];

  // Risk indicators
  revenueConcentration: {
    topClientPercentage: number; // % of revenue from top client
    top5ClientsPercentage: number; // % of revenue from top 5 clients
    isHighRisk: boolean; // True if >50% from top 5
  };
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<DashboardMetrics> {
    const now = new Date();
    const periodStart = this.getPeriodStart(period, now);

    // Fetch all data in parallel
    const [leads, clients, projects] = await Promise.all([
      this.prisma.lead.findMany({
        include: {
          assignedTo: true,
        },
      }),
      this.prisma.client.findMany({
        include: {
          projects: true,
        },
      }),
      this.prisma.project.findMany({
        include: {
          client: true,
          lead: true,
        },
      }),
    ]);

    // Calculate metrics
    const totalRevenue = clients.reduce((sum, c) => sum + (c.lifetimeRevenue || 0), 0);
    const monthlyRevenue = this.calculatePeriodRevenue(clients, projects, 'month', now);
    const quarterlyRevenue = this.calculatePeriodRevenue(clients, projects, 'quarter', now);

    const revenueByClient = clients
      .map((c) => ({
        clientId: c.id,
        clientName: c.name,
        revenue: c.lifetimeRevenue || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByProject = projects
      .map((p) => ({
        projectId: p.id,
        projectName: p.name,
        revenue: p.value || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Conversion metrics
    const wonLeads = leads.filter((l) => l.stage === 'Won').length;
    const lostLeads = leads.filter((l) => l.stage === 'Lost').length;
    const closedLeads = wonLeads + lostLeads;
    const winRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;

    const pipelineValue = leads
      .filter((l) => l.stage !== 'Won' && l.stage !== 'Lost')
      .reduce((sum, l) => sum + l.value, 0);

    const avgDealSize = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.value, 0) / leads.length)
      : 0;

    // Funnel drop-off
    const funnelDropOff = this.calculateFunnelDropOff(leads);

    // Time metrics
    const { avgTimeToQuote, avgTimeToClose } = this.calculateTimeMetrics(leads);

    // Project metrics
    const activeProjects = projects.filter((p) => p.status === 'Active').length;
    const projectsByStatus = this.groupProjectsByStatus(projects);
    const projectsAtRisk = this.identifyProjectsAtRisk(projects);

    // High value deals (top 5 open deals)
    const highValueDeals = leads
      .filter((l) => l.stage !== 'Won' && l.stage !== 'Lost')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((l) => ({
        leadId: l.id,
        company: l.company,
        value: l.value,
        stage: l.stage,
      }));

    // Stalled leads (no activity in 30+ days, not Won/Lost)
    const stalledLeads = this.identifyStalledLeads(leads);

    // Top clients
    const topClients = revenueByClient.slice(0, 5);

    // Revenue concentration risk
    const revenueConcentration = this.calculateRevenueConcentration(revenueByClient, totalRevenue);

    return {
      totalRevenue,
      monthlyRevenue,
      quarterlyRevenue,
      revenueByClient,
      revenueByProject,
      totalLeads: leads.length,
      wonLeads,
      lostLeads,
      winRate,
      avgDealSize,
      funnelDropOff,
      avgTimeToQuote,
      avgTimeToClose,
      totalProjects: projects.length,
      activeProjects,
      projectsByStatus,
      projectsAtRisk,
      pipelineValue,
      highValueDeals,
      stalledLeads,
      activeClients: clients.filter((c) => c.status === 'Active').length,
      topClients,
      revenueConcentration,
    };
  }

  private getPeriodStart(period: 'week' | 'month' | 'quarter', now: Date): Date {
    const date = new Date(now);

    switch (period) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
    }

    return date;
  }

  private calculatePeriodRevenue(
    clients: any[],
    projects: any[],
    period: 'week' | 'month' | 'quarter',
    now: Date
  ): number {
    const periodStart = this.getPeriodStart(period, now);

    // Sum completed projects in period
    const periodProjectRevenue = projects
      .filter((p) => {
        if (!p.completedDate) return false;
        const completedDate = new Date(p.completedDate);
        return completedDate >= periodStart && completedDate <= now;
      })
      .reduce((sum, p) => sum + (p.value || 0), 0);

    return periodProjectRevenue;
  }

  private calculateFunnelDropOff(leads: any[]): DashboardMetrics['funnelDropOff'] {
    const stages = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
    const stageCounts: { [key: string]: number } = {};

    stages.forEach((stage) => {
      stageCounts[stage] = leads.filter((l) => l.stage === stage).length;
    });

    const result: DashboardMetrics['funnelDropOff'] = [];
    let previousCount = stageCounts['New'];

    stages.forEach((stage, idx) => {
      const count = stageCounts[stage];
      let dropOffRate = 0;

      if (idx > 0 && previousCount > 0) {
        // Calculate how many were "lost" from the previous stage
        dropOffRate = Math.round(((previousCount - count) / previousCount) * 100);
      }

      result.push({
        stage,
        count,
        dropOffRate: Math.max(0, dropOffRate),
      });

      previousCount = count;
    });

    return result;
  }

  private calculateTimeMetrics(leads: any[]): { avgTimeToQuote: number; avgTimeToClose: number } {
    // Time to quote (days from created to quoteSentAt)
    const leadsWithQuote = leads.filter((l) => l.quoteSentAt);
    const avgTimeToQuote = leadsWithQuote.length > 0
      ? Math.round(
          leadsWithQuote.reduce((sum, l) => {
            const created = new Date(l.createdAt);
            const quoted = new Date(l.quoteSentAt);
            const days = (quoted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / leadsWithQuote.length
        )
      : 0;

    // Time to close (days from created to dealClosedAt)
    const leadsWithClose = leads.filter((l) => l.dealClosedAt);
    const avgTimeToClose = leadsWithClose.length > 0
      ? Math.round(
          leadsWithClose.reduce((sum, l) => {
            const created = new Date(l.createdAt);
            const closed = new Date(l.dealClosedAt);
            const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / leadsWithClose.length
        )
      : 0;

    return { avgTimeToQuote, avgTimeToClose };
  }

  private groupProjectsByStatus(projects: any[]): { status: string; count: number }[] {
    const statuses = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
    return statuses.map((status) => ({
      status,
      count: projects.filter((p) => p.status === status).length,
    }));
  }

  private identifyProjectsAtRisk(projects: any[]): DashboardMetrics['projectsAtRisk'] {
    const now = new Date();
    const atRisk: DashboardMetrics['projectsAtRisk'] = [];

    projects.forEach((project) => {
      const reasons: string[] = [];

      // Project on hold
      if (project.status === 'On Hold') {
        reasons.push('Project on hold');
      }

      // No start date but status is Active
      if (project.status === 'Active' && !project.startDate) {
        reasons.push('Active but no start date');
      }

      // Active for over 6 months without completion
      if (project.status === 'Active' && project.startDate) {
        const startDate = new Date(project.startDate);
        const monthsActive = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsActive > 6) {
          reasons.push(`Active for ${Math.round(monthsActive)} months`);
        }
      }

      if (reasons.length > 0) {
        atRisk.push({
          projectId: project.id,
          projectName: project.name,
          reason: reasons.join(', '),
        });
      }
    });

    return atRisk;
  }

  private identifyStalledLeads(leads: any[]): DashboardMetrics['stalledLeads'] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return leads
      .filter((l) => {
        // Must be in open stages (not Won/Lost)
        if (l.stage === 'Won' || l.stage === 'Lost') return false;

        // Check if updated more than 30 days ago
        const updatedAt = new Date(l.updatedAt);
        return updatedAt < thirtyDaysAgo;
      })
      .map((l) => {
        const updatedAt = new Date(l.updatedAt);
        const daysStalled = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        return {
          leadId: l.id,
          company: l.company,
          daysStalled,
          stage: l.stage,
        };
      })
      .sort((a, b) => b.daysStalled - a.daysStalled);
  }

  private calculateRevenueConcentration(
    revenueByClient: { clientId: string; clientName: string; revenue: number }[],
    totalRevenue: number
  ): DashboardMetrics['revenueConcentration'] {
    if (totalRevenue === 0 || revenueByClient.length === 0) {
      return {
        topClientPercentage: 0,
        top5ClientsPercentage: 0,
        isHighRisk: false,
      };
    }

    const topClient = revenueByClient[0];
    const top5Revenue = revenueByClient
      .slice(0, 5)
      .reduce((sum, c) => sum + c.revenue, 0);

    const topClientPercentage = Math.round((topClient.revenue / totalRevenue) * 100);
    const top5ClientsPercentage = Math.round((top5Revenue / totalRevenue) * 100);

    return {
      topClientPercentage,
      top5ClientsPercentage,
      isHighRisk: top5ClientsPercentage > 50,
    };
  }
}
