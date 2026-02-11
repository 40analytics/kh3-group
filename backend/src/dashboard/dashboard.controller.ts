import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private aiService: AiService,
  ) {}

  /**
   * Get dashboard metrics
   * CEO and ADMIN only (as per description.txt: "Business Performance Dashboard (CEO View)")
   */
  @Get('metrics')
  async getMetrics(
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
    @Request() req: any,
  ) {
    // Check role permissions - CEO and ADMIN only
    const userRole = req.user?.role;
    if (!['CEO', 'ADMIN'].includes(userRole)) {
      throw new HttpException(
        'Insufficient permissions to view dashboard. CEO access required.',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.dashboardService.getMetrics(period);
  }

  /**
   * Get AI-generated executive summary
   * CEO and ADMIN only
   */
  @Get('executive-summary')
  async getExecutiveSummary(
    @Query('provider') provider: string = 'anthropic',
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
    @Request() req: any,
  ) {
    // Check role permissions - CEO and ADMIN only
    const userRole = req.user?.role;
    if (!['CEO', 'ADMIN'].includes(userRole)) {
      throw new HttpException(
        'Insufficient permissions to view executive summary. CEO access required.',
        HttpStatus.FORBIDDEN,
      );
    }

    // Get dashboard metrics
    const metrics = await this.dashboardService.getMetrics(period);

    // Generate AI summary
    const summary = await this.aiService.generateExecutiveSummary(
      metrics,
      provider,
    );

    return {
      period,
      generatedAt: new Date().toISOString(),
      summary,
      metrics: {
        totalRevenue: metrics.totalRevenue,
        pipelineValue: metrics.pipelineValue,
        winRate: metrics.winRate,
        activeClients: metrics.activeClients,
        activeProjects: metrics.activeProjects,
      },
    };
  }

  /**
   * Get revenue breakdown
   * CEO and ADMIN only
   */
  @Get('revenue-breakdown')
  async getRevenueBreakdown(
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
    @Request() req: any,
  ) {
    // Check role permissions - CEO and ADMIN only
    const userRole = req.user?.role;
    if (!['CEO', 'ADMIN'].includes(userRole)) {
      throw new HttpException(
        'Insufficient permissions to view revenue breakdown. CEO access required.',
        HttpStatus.FORBIDDEN,
      );
    }

    const metrics = await this.dashboardService.getMetrics(period);

    return {
      totalRevenue: metrics.totalRevenue,
      monthlyRevenue: metrics.monthlyRevenue,
      quarterlyRevenue: metrics.quarterlyRevenue,
      byClient: metrics.revenueByClient.slice(0, 10), // Top 10
      byProject: metrics.revenueByProject.slice(0, 10), // Top 10
      concentration: metrics.revenueConcentration,
    };
  }

  /**
   * Get project analytics
   * CEO and ADMIN only
   */
  @Get('project-analytics')
  async getProjectAnalytics(
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
    @Request() req: any,
  ) {
    // Check role permissions - CEO and ADMIN only
    const userRole = req.user?.role;
    if (!['CEO', 'ADMIN'].includes(userRole)) {
      throw new HttpException(
        'Insufficient permissions to view project analytics. CEO access required.',
        HttpStatus.FORBIDDEN,
      );
    }

    const metrics = await this.dashboardService.getMetrics(period);

    return {
      totalProjects: metrics.totalProjects,
      activeProjects: metrics.activeProjects,
      byStatus: metrics.projectsByStatus,
      atRisk: metrics.projectsAtRisk,
    };
  }
}
