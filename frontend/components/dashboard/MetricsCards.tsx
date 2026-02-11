import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}

function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-100',
}: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center mt-2 space-x-2">
            {trend === 'up' && (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200 bg-green-50">
                  {change}
                </Badge>
              </>
            )}
            {trend === 'down' && (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-200 bg-red-50">
                  {change}
                </Badge>
              </>
            )}
            {trend === 'neutral' && (
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-200 bg-gray-50">
                {change}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsCardsProps {
  totalRevenue: number;
  pipelineValue: number;
  activeClients: number;
  activeLeads: number;
  conversionRate: string;
  avgDealSize: number;
}

export function MetricsCards({
  totalRevenue,
  pipelineValue,
  activeClients,
  conversionRate,
}: MetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Revenue"
        value={`$${(totalRevenue / 1000).toFixed(0)}k`}
        change="+12.5% from last month"
        trend="up"
        icon={DollarSign}
        iconColor="text-green-600"
        iconBg="bg-green-100"
      />
      <MetricCard
        title="Pipeline Value"
        value={`$${(pipelineValue / 1000).toFixed(0)}k`}
        change="8 active opportunities"
        trend="neutral"
        icon={Target}
        iconColor="text-blue-600"
        iconBg="bg-blue-100"
      />
      <MetricCard
        title="Active Clients"
        value={activeClients}
        change="+2 this month"
        trend="up"
        icon={Users}
        iconColor="text-purple-600"
        iconBg="bg-purple-100"
      />
      <MetricCard
        title="Conversion Rate"
        value={conversionRate}
        change="Pipeline to won"
        trend="up"
        icon={Activity}
        iconColor="text-orange-600"
        iconBg="bg-orange-100"
      />
    </div>
  );
}
