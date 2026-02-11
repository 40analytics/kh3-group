'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { Lead, Client, DashboardMetrics } from '@/lib/types';
import { REVENUE_DATA } from '@/lib/constants';

interface DashboardClientProps {
  leads: Lead[];
  clients: Client[];
}

export default function RedesignedDashboard({
  leads,
  clients,
}: DashboardClientProps) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiData, setAiData] = useState<{
    summary: string;
    flags: string[];
  } | null>(null);

  // Calculate metrics
  const { metrics } = useMemo(() => {
    const totalRevenue = clients.reduce(
      (acc, c) => acc + (c.totalRevenue || c.lifetimeRevenue || 0),
      0
    );
    const pipelineValue = leads.reduce((acc, l) => acc + l.value, 0);

    const wonLeads = leads.filter((l) => l.stage === 'Won');
    const won = wonLeads.length;

    const conversionRateNum =
      leads.length > 0 ? Math.round((won / leads.length) * 100) : 0;

    const metrics: DashboardMetrics = {
      totalRevenue,
      pipelineValue,
      activeClients: clients.length,
      activeLeads: leads.length,
      conversionRate: `${conversionRateNum}%`,
      avgDealSize:
        leads.length > 0
          ? Math.round(pipelineValue / leads.length)
          : 0,
    };

    return { metrics, conversionRateNum };
  }, [leads, clients]);

  // Pipeline data with colors
  const pipelineData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    const stageColors: { [key: string]: string } = {
      New: '#10b981',
      Contacted: '#f59e0b',
      Qualified: '#3b82f6',
      Proposal: '#ec4899',
      Negotiation: '#8b5cf6',
      Won: '#14b8a6',
      Lost: '#6b7280',
    };
    const stages = [
      'New',
      'Contacted',
      'Qualified',
      'Proposal',
      'Negotiation',
      'Won',
      'Lost',
    ];

    stages.forEach((stage) => (counts[stage] = 0));
    leads.forEach((l) => {
      if (counts[l.stage] !== undefined) counts[l.stage]++;
    });

    return Object.keys(counts)
      .map((name) => ({
        name,
        value: counts[name],
        color: stageColors[name],
      }))
      .filter((d) => d.value > 0);
  }, [leads]);

  const handleGenerateInsight = async () => {
    setLoadingAI(true);
    // Mock AI generation for demo
    setTimeout(() => {
      setAiData({
        summary:
          'Revenue is tracking 12% above Q1 projections with strong pipeline health. Two enterprise deals in negotiation require executive attention to close by month-end. Client retention remains excellent at 94%.',
        flags: [
          'High-value deal at risk - TechCorp renewal',
          'Pipeline weighted toward early stages',
          'Strong month-over-month growth trajectory',
        ],
      });
      setLoadingAI(false);
    }, 1500);
  };

  const metricsData = [
    {
      label: 'Total Revenue',
      value: `$${metrics.totalRevenue}`,
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      label: 'Active Clients',
      value: metrics.activeClients.toString(),
      change: '+8.2%',
      trend: 'up' as const,
      icon: Users,
    },
    {
      label: 'Conversion Rate',
      value: metrics.conversionRate,
      change: '+5.3%',
      trend: 'up' as const,
      icon: TrendingUp,
    },
    {
      label: 'Pipeline Value',
      value: `$${metrics.pipelineValue}`,
      change: '+15.7%',
      trend: 'up' as const,
      icon: Target,
    },
  ];

  return (
    <div className="min-h-screen space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Last refreshed {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Today
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            This Week
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700">
            This Month
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, idx) => {
          const Icon = metric.icon;
          const TrendIcon =
            metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;

          return (
            <Card
              key={idx}
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      metric.trend === 'up'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {metric.change}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-sm font-medium text-gray-600 mb-1">
                  {metric.label}
                </CardTitle>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-full lg:col-span-4 bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Revenue Trajectory
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 mt-1">
                  6-month performance overview
                </CardDescription>
              </div>
              <div className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-md text-xs font-medium text-green-700">
                +12% Growth
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="col-span-full lg:col-span-3 bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Pipeline Stages
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              Lead distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value">
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pipelineData.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}></div>
                  <span className="text-xs text-gray-600">
                    {stage.name} ({stage.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Executive Brief - Distinctive Design */}
      <Card className="relative overflow-hidden bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-indigo-200/20 to-blue-200/20 rounded-full blur-2xl"></div>

        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-40"></div>
                <div className="relative p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  AI Executive Brief
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    BETA
                  </span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 font-medium mt-1">
                  Powered by advanced analytics engine
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGenerateInsight}
              disabled={loadingAI}
              className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
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
          {aiData ? (
            <div className="space-y-4">
              <div className="p-5 bg-white/80 backdrop-blur-sm border-2 border-blue-100 rounded-xl shadow-md">
                <p className="text-base text-gray-800 leading-relaxed font-medium">
                  {aiData.summary}
                </p>
              </div>

              {aiData.flags.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/80 backdrop-blur-sm border-2 border-amber-300 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-700" />
                    <h4 className="text-sm font-bold text-amber-900">
                      Key Alerts & Action Items
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {aiData.flags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-amber-200 hover:border-amber-300 rounded-xl transition-all shadow-sm hover:shadow-md">
                        <div className="shrink-0 w-7 h-7 rounded-full bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-gray-800 font-medium flex-1 pt-0.5">
                          {flag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 border-2 border-blue-200 mb-6">
                <Sparkles className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-base text-gray-700 font-semibold max-w-md mx-auto">
                Click &quot;Generate Insights&quot; to receive
                AI-powered business intelligence
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Clients */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Top Clients
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Highest revenue contributors
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2">
              {clients
                .sort(
                  (a, b) =>
                    (b.lifetimeRevenue || 0) -
                    (a.lifetimeRevenue || 0)
                )
                .slice(0, 5)
                .map((client, idx) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {client.industry}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        $
                        {(
                          (client.lifetimeRevenue || 0) / 1000
                        ).toFixed(0)}
                        k
                      </p>
                      <div className="px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-600 font-medium mt-0.5">
                        #{idx + 1}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* High-Value Leads */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              High-Value Leads
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Top opportunities in pipeline
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2">
              {leads
                .filter((l) => l.value && l.value > 0)
                .sort((a, b) => (b.value || 0) - (a.value || 0))
                .slice(0, 5)
                .map((lead, idx) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lead.company}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${((lead.value || 0) / 1000).toFixed(0)}k
                      </p>
                      <div className="px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-600 font-medium mt-0.5">
                        {lead.stage}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
