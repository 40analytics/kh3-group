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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Loader2,
  AlertTriangle,
  Clock,
  FolderKanban,
  AlertCircle,
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Metrics cards data
  const metricsCards = [
    {
      label: 'Total Revenue',
      value: `$${(metrics.totalRevenue / 1000).toFixed(0)}k`,
      change: period === 'month' ? `$${(metrics.monthlyRevenue / 1000).toFixed(0)}k this month` : `$${(metrics.quarterlyRevenue / 1000).toFixed(0)}k this quarter`,
      icon: DollarSign,
      color: 'blue',
    },
    {
      label: 'Win Rate',
      value: `${metrics.winRate}%`,
      change: `${metrics.wonLeads}/${metrics.wonLeads + metrics.lostLeads} deals closed`,
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Pipeline Value',
      value: `$${(metrics.pipelineValue / 1000).toFixed(0)}k`,
      change: `${metrics.highValueDeals.length} high-value deals`,
      icon: Target,
      color: 'purple',
    },
    {
      label: 'Active Projects',
      value: metrics.activeProjects.toString(),
      change: `${metrics.projectsAtRisk.length} at risk`,
      icon: FolderKanban,
      color: 'amber',
    },
  ];

  // Time metrics cards
  const timeMetrics = [
    {
      label: 'Avg Time to Quote',
      value: `${metrics.avgTimeToQuote} days`,
      icon: Clock,
    },
    {
      label: 'Avg Time to Close',
      value: `${metrics.avgTimeToClose} days`,
      icon: Clock,
    },
  ];

  // Pipeline funnel data
  const funnelData = metrics.funnelDropOff.filter((stage) => stage.stage !== 'Lost');

  // Project status colors
  const statusColors: Record<string, string> = {
    Planning: '#3b82f6',
    Active: '#10b981',
    'On Hold': '#f59e0b',
    Completed: '#6b7280',
    Cancelled: '#ef4444',
  };

  return (
    <div className="min-h-screen space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CEO Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
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

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsCards.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 bg-${metric.color}-50 rounded-lg`}>
                    <Icon className={`h-5 w-5 text-${metric.color}-600`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-sm font-medium text-gray-600 mb-1">
                  {metric.label}
                </CardTitle>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timeMetrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Client */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue by Client</CardTitle>
            <CardDescription>Top 10 revenue contributors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.revenueByClient.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="clientName"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value?: number) => [`$${(value || 0).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Funnel */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sales Funnel</CardTitle>
            <CardDescription>Lead progression & drop-off rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Status Distribution */}
        <Card className="bg-white border border-gray-200 shadow-sm">
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
                      style={{ backgroundColor: statusColors[status.status] || '#6b7280' }}
                    />
                    <span className="text-sm font-medium">{status.status}</span>
                  </div>
                  <span className="text-sm font-bold">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects at Risk */}
        <Card className="bg-amber-50 border border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg font-semibold text-amber-900">
                Projects at Risk
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Requires attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.projectsAtRisk.length === 0 ? (
              <p className="text-sm text-amber-700">No projects at risk</p>
            ) : (
              <div className="space-y-2">
                {metrics.projectsAtRisk.slice(0, 5).map((project, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-gray-900">{project.projectName}</p>
                    <p className="text-xs text-gray-600 mt-1">{project.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stalled Leads & Revenue Concentration */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stalled Leads */}
        <Card className="bg-red-50 border border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg font-semibold text-red-900">
                Stalled Leads
              </CardTitle>
            </div>
            <CardDescription className="text-red-700">
              No activity in 30+ days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.stalledLeads.length === 0 ? (
              <p className="text-sm text-red-700">No stalled leads</p>
            ) : (
              <div className="space-y-2">
                {metrics.stalledLeads.slice(0, 5).map((lead, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{lead.company}</p>
                      <span className="text-xs font-semibold text-red-600">
                        {lead.daysStalled}d
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{lead.stage}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Concentration */}
        <Card className={metrics.revenueConcentration.isHighRisk ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue Concentration</CardTitle>
            <CardDescription>Client diversification risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Top Client</span>
                  <span className="text-sm font-bold">
                    {metrics.revenueConcentration.topClientPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${metrics.revenueConcentration.topClientPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Top 5 Clients</span>
                  <span className="text-sm font-bold">
                    {metrics.revenueConcentration.top5ClientsPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${metrics.revenueConcentration.isHighRisk ? 'bg-red-600' : 'bg-green-600'}`}
                    style={{ width: `${metrics.revenueConcentration.top5ClientsPercentage}%` }}
                  />
                </div>
              </div>
              {metrics.revenueConcentration.isHighRisk && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-xs font-semibold text-red-900">
                    ⚠️ HIGH RISK: Over 50% revenue from top 5 clients
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Executive Brief */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 rounded-full blur-2xl"></div>

        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-40"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  AI Executive Brief
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    LIVE
                  </span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 font-medium mt-1">
                  Real-time insights powered by advanced analytics
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGenerateInsight}
              disabled={loadingAI}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
              <span className="flex items-center gap-2">
                {loadingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Insights
                  </>
                )}
              </span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative pt-4">
          {aiSummary ? (
            <div className="space-y-4">
              {/* Overview */}
              <div className="p-5 bg-white/80 backdrop-blur-sm border-2 border-blue-100 rounded-xl shadow-md">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Executive Overview</h4>
                <p className="text-base text-gray-800 leading-relaxed">{aiSummary.summary.overview}</p>
              </div>

              {/* What Changed */}
              {aiSummary.summary.whatChanged.length > 0 && (
                <div className="p-4 bg-white/80 backdrop-blur-sm border-2 border-green-100 rounded-xl">
                  <h4 className="text-sm font-bold text-green-900 mb-3">What Changed</h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.whatChanged.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800">
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What Is At Risk */}
              {aiSummary.summary.whatIsAtRisk.length > 0 && (
                <div className="p-4 bg-white/80 backdrop-blur-sm border-2 border-amber-100 rounded-xl">
                  <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    What Is At Risk
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.whatIsAtRisk.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What Needs Attention */}
              {aiSummary.summary.whatNeedsAttention.length > 0 && (
                <div className="p-4 bg-white/80 backdrop-blur-sm border-2 border-red-100 rounded-xl">
                  <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    What Needs Attention
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.whatNeedsAttention.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                          {idx + 1}
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Insights */}
              {aiSummary.summary.keyInsights.length > 0 && (
                <div className="p-4 bg-white/80 backdrop-blur-sm border-2 border-purple-100 rounded-xl">
                  <h4 className="text-sm font-bold text-purple-900 mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    {aiSummary.summary.keyInsights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800">
                        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-200 mb-6">
                <Sparkles className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-base text-gray-700 font-semibold max-w-md mx-auto">
                Click &quot;Generate Insights&quot; to receive AI-powered business intelligence
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
