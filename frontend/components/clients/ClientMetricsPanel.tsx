'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Clock,
  Activity,
  Briefcase,
  DollarSign,
  Target,
} from 'lucide-react';

interface ClientMetrics {
  daysSinceLastContact: number;
  totalActivityCount: number;
  recentActivityCount: number;
  totalProjectCount: number;
  activeProjectCount: number;
  completedProjectCount: number;
  totalRevenue: number;
  recentRevenue: number;
  avgProjectValue: number;
  engagementScore: number;
}

interface ClientHealthFlag {
  type:
    | 'NO_CONTACT'
    | 'DECLINING_ENGAGEMENT'
    | 'HIGH_VALUE_AT_RISK'
    | 'STRONG_RELATIONSHIP';
  severity: 'low' | 'medium' | 'high' | 'positive';
  message: string;
  icon: string;
}

interface ClientMetricsPanelProps {
  metrics?: ClientMetrics;
  healthFlags?: ClientHealthFlag[];
  suggestedActions?: string[];
}

export function ClientMetricsPanel({
  metrics,
  healthFlags = [],
  suggestedActions = [],
}: ClientMetricsPanelProps) {
  if (!metrics) {
    return null;
  }

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      case 'positive':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Engagement Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5" />
            Engagement Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div
              className={`text-4xl font-bold ${getEngagementColor(metrics.engagementScore)}`}>
              {metrics.engagementScore}/100
            </div>
            <Badge
              variant={
                metrics.engagementScore >= 70
                  ? 'default'
                  : metrics.engagementScore >= 40
                    ? 'secondary'
                    : 'destructive'
              }
              className={
                metrics.engagementScore >= 70
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : ''
              }>
              {metrics.engagementScore >= 70
                ? 'Strong'
                : metrics.engagementScore >= 40
                  ? 'Moderate'
                  : 'At Risk'}
            </Badge>
          </div>
          <Progress value={metrics.engagementScore} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Based on recent contact, activity level, and active
            projects
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Last Contact
              </div>
              <div className="text-2xl font-bold">
                {metrics.daysSinceLastContact}d
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                Activities (30d)
              </div>
              <div className="text-2xl font-bold">
                {metrics.recentActivityCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.totalActivityCount} total
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                Active Projects
              </div>
              <div className="text-2xl font-bold">
                {metrics.activeProjectCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.totalProjectCount} total
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Recent Revenue
              </div>
              <div className="text-2xl font-bold">
                ${(metrics.recentRevenue / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-muted-foreground">
                Last 12 months
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                Completed Projects
              </div>
              <div className="text-2xl font-bold">
                {metrics.completedProjectCount}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Avg Project Value
              </div>
              <div className="text-2xl font-bold">
                ${(metrics.avgProjectValue / 1000).toFixed(0)}k
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Flags */}
      {healthFlags.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {healthFlags.some((f) => f.severity === 'positive')
              ? '📊'
              : '⚠️'}
            {healthFlags.some((f) => f.severity === 'positive')
              ? 'Health Indicators'
              : 'Health Flags'}
          </h3>
          <div className="space-y-2">
            {healthFlags.map((flag, index) => (
              <Alert
                key={index}
                variant={
                  flag.severity === 'high' ? 'destructive' : 'default'
                }
                className={
                  flag.severity === 'positive'
                    ? 'border-green-200 bg-green-50'
                    : ''
                }>
                <AlertDescription className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{flag.icon}</span>
                    {flag.message}
                  </span>
                  <Badge
                    variant={getSeverityColor(flag.severity) as any}
                    className={
                      flag.severity === 'positive'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : ''
                    }>
                    {flag.severity}
                  </Badge>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Suggested Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-sm">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
