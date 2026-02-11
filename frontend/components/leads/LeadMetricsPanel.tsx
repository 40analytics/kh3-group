'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, Clock, Activity, FileText } from 'lucide-react';

interface LeadMetrics {
  daysInPipeline: number;
  daysSinceLastContact: number;
  activityCount: number;
  fileCount: number;
  daysToQuotation?: number;
  daysFromQuotationToClose?: number;
}

interface RiskFlag {
  type: 'NO_CONTACT' | 'LONG_PIPELINE' | 'HIGH_VALUE_STALE' | 'NO_ACTIVITY' | 'HIGH_PROBABILITY';
  severity: 'low' | 'medium' | 'high' | 'positive';
  message: string;
  icon: string;
}

interface LeadMetricsPanelProps {
  metrics?: LeadMetrics;
  riskFlags?: RiskFlag[];
  suggestedActions?: string[];
  onGenerateSummary?: () => void;
  loadingSummary?: boolean;
}

export function LeadMetricsPanel({
  metrics,
  riskFlags = [],
  suggestedActions = [],
  onGenerateSummary,
  loadingSummary = false,
}: LeadMetricsPanelProps) {
  if (!metrics) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      case 'positive':
        return 'default'; // Will use custom styling
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Lead Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Days in Pipeline
              </div>
              <div className="text-2xl font-bold">{metrics.daysInPipeline}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                Days Since Contact
              </div>
              <div className="text-2xl font-bold">{metrics.daysSinceLastContact}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                Activities
              </div>
              <div className="text-2xl font-bold">{metrics.activityCount}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                Files
              </div>
              <div className="text-2xl font-bold">{metrics.fileCount}</div>
            </div>

            {metrics.daysToQuotation !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  Days to Quotation
                </div>
                <div className="text-2xl font-bold">{metrics.daysToQuotation}</div>
              </div>
            )}

            {metrics.daysFromQuotationToClose !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  Days Quote to Close
                </div>
                <div className="text-2xl font-bold">{metrics.daysFromQuotationToClose}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Flags & Positive Indicators */}
      {riskFlags.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {riskFlags.some((f) => f.severity === 'positive') ? '📊' : '⚠️'}
            {riskFlags.some((f) => f.severity === 'positive') ? 'Indicators' : 'Risk Flags'}
          </h3>
          <div className="space-y-2">
            {riskFlags.map((flag, index) => (
              <Alert
                key={index}
                variant={flag.severity === 'high' ? 'destructive' : 'default'}
                className={flag.severity === 'positive' ? 'border-green-200 bg-green-50' : ''}
              >
                <AlertDescription className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{flag.icon}</span>
                    {flag.message}
                  </span>
                  <Badge
                    variant={getSeverityColor(flag.severity) as any}
                    className={flag.severity === 'positive' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                  >
                    {flag.severity === 'positive' ? 'high probability' : flag.severity}
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
              <Lightbulb className="w-5 h-5" />
              Suggested Next Actions
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

            {onGenerateSummary && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateSummary}
                disabled={loadingSummary}
                className="w-full mt-4"
              >
                {loadingSummary ? 'Generating AI Summary...' : '✨ Generate AI Summary'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
