'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BrainCircuit,
  Wand2,
  Lightbulb,
  Loader2,
  AlertTriangle,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { dashboardApi, type DashboardMetrics, type ExecutiveSummaryResponse } from '@/lib/api/dashboard';
import { toast } from 'sonner';

interface EnhancedDashboardProps {
  initialPeriod?: 'week' | 'month' | 'quarter';
}

export default function EnhancedDashboard({ initialPeriod = 'month' }: EnhancedDashboardProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>(initialPeriod);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [aiSummary, setAiSummary] = useState<ExecutiveSummaryResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const data = await dashboardApi.getMetrics(period);
      setMetrics(data);
    } catch (error: any) {
      toast.error('Failed to load dashboard metrics', {
        description: error.message,
      });
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleGenerateInsight = async () => {
    try {
      setLoadingAI(true);
      const summary = await dashboardApi.getExecutiveSummary(period);
      setAiSummary(summary);
      toast.success('AI executive summary generated');
    } catch (error: any) {
      toast.error('Failed to generate AI summary', {
        description: error.message,
      });
    } finally {
      setLoadingAI(false);
    }
  };

  if (loadingMetrics || !metrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const metricsCards = [
    {
      label: 'Total Revenue',
      value: `$${(metrics.totalRevenue / 1000).toFixed(0)}k`,
      change: period === 'month' ? `$${(metrics.monthlyRevenue / 1000).toFixed(0)}k this month` : `$${(metrics.quarterlyRevenue / 1000).toFixed(0)}k this quarter`,
    },
    {
      label: 'Win Rate',
      value: `${metrics.winRate}%`,
      change: `${metrics.wonLeads}/${metrics.wonLeads + metrics.lostLeads} deals closed`,
    },
    {
      label: 'Pipeline Value',
      value: `$${(metrics.pipelineValue / 1000).toFixed(0)}k`,
      change: `${metrics.highValueDeals.length} high-value deals`,
    },
    {
      label: 'Active Projects',
      value: metrics.activeProjects.toString(),
      change: `${metrics.projectsAtRisk.length} at risk`,
    },
  ];

  const timeMetrics = [
    {
      label: 'Avg Time to Quote',
      value: `${metrics.avgTimeToQuote} days`,
    },
    {
      label: 'Avg Time to Close',
      value: `${metrics.avgTimeToClose} days`,
    },
  ];

  const funnelData = metrics.funnelDropOff.filter((stage) => stage.stage !== 'Lost');

  const statusColors: Record<string, string> = {
    Planning: 'oklch(0.22 0.02 50)',
    Active: 'oklch(0.55 0.08 155)',
    'On Hold': 'oklch(0.70 0.12 85)',
    Completed: 'oklch(0.55 0.03 250)',
    Cancelled: 'oklch(0.58 0.10 35)',
  };

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display">CEO Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time business performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            size="sm">
            This Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            size="sm">
            This Month
          </Button>
          <Button
            variant={period === 'quarter' ? 'default' : 'outline'}
            onClick={() => setPeriod('quarter')}
            size="sm">
            This Quarter
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsCards.map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {metric.label}
              </p>
              <p className="text-2xl font-display">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-2">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timeMetrics.map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 flex items-center gap-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-display">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue by Client</CardTitle>
            <CardDescription>Top 10 revenue contributors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.revenueByClient.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.008 80)" vertical={false} />
                <XAxis
                  dataKey="clientName"
                  stroke="oklch(0.50 0.01 50)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="oklch(0.50 0.01 50)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.995 0.003 80)',
                    border: '1px solid oklch(0.90 0.008 80)',
                    borderRadius: '8px',
                  }}
                  formatter={(value?: number) => [`$${(value || 0).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="oklch(0.22 0.02 50)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sales Funnel</CardTitle>
            <CardDescription>Lead progression & drop-off rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.008 80)" horizontal={false} />
                <XAxis type="number" stroke="oklch(0.50 0.01 50)" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  stroke="oklch(0.50 0.01 50)"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.995 0.003 80)',
                    border: '1px solid oklch(0.90 0.008 80)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.55 0.08 155)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Project Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.projectsByStatus.filter((s) => s.count > 0).map((status, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[status.status] || 'oklch(0.55 0.03 250)' }}
                    />
                    <span className="text-sm font-medium">{status.status}</span>
                  </div>
                  <span className="text-sm font-display">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects at Risk */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg font-semibold">
                Projects at Risk
              </CardTitle>
            </div>
            <CardDescription>
              Requires attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.projectsAtRisk.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects at risk</p>
            ) : (
              <div className="space-y-2">
                {metrics.projectsAtRisk.slice(0, 5).map((project, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg border-l-2 border-l-amber-500">
                    <p className="text-sm font-medium">{project.projectName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{project.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stalled Leads & Revenue Concentration */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg font-semibold">
                Stalled Leads
              </CardTitle>
            </div>
            <CardDescription>
              No activity in 30+ days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.stalledLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stalled leads</p>
            ) : (
              <div className="space-y-2">
                {metrics.stalledLeads.slice(0, 5).map((lead, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg border-l-2 border-l-red-400">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{lead.company}</p>
                      <span className="text-xs font-semibold text-red-500">
                        {lead.daysStalled}d
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{lead.stage}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Concentration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue Concentration</CardTitle>
            <CardDescription>Client diversification risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Top Client</span>
                  <span className="text-sm font-display">
                    {metrics.revenueConcentration.topClientPercentage}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${metrics.revenueConcentration.topClientPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Top 5 Clients</span>
                  <span className="text-sm font-display">
                    {metrics.revenueConcentration.top5ClientsPercentage}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${metrics.revenueConcentration.isHighRisk ? 'bg-red-500' : 'bg-emerald-600'}`}
                    style={{ width: `${metrics.revenueConcentration.top5ClientsPercentage}%` }}
                  />
                </div>
              </div>
              {metrics.revenueConcentration.isHighRisk && (
                <div className="p-3 bg-muted rounded-lg border-l-2 border-l-red-400">
                  <p className="text-xs font-semibold">
                    HIGH RISK: Over 50% revenue from top 5 clients
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Executive Brief */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-xl font-display">
                  AI Executive Brief
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Real-time insights powered by advanced analytics
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGenerateInsight}
              disabled={loadingAI}>
              {loadingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {aiSummary ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Executive Overview</h4>
                <p className="text-sm leading-relaxed">{aiSummary.summary.overview}</p>
              </div>

              {aiSummary.summary.whatChanged.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-semibold mb-3">What Changed</h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.whatChanged.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.summary.whatIsAtRisk.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    What Is At Risk
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.whatIsAtRisk.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.summary.whatNeedsAttention.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    What Needs Attention
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.whatNeedsAttention.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-xs font-semibold text-muted-foreground mt-0.5 flex-shrink-0 w-4">
                          {idx + 1}.
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.summary.keyInsights.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-semibold mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.keyInsights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BrainCircuit className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Click &quot;Generate Insights&quot; to receive AI-powered business intelligence
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
