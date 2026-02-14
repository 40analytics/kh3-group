import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building2,
} from 'lucide-react';
import type { Lead } from '@/lib/types';

interface PipelineStatsProps {
  leads: Lead[];
}

export function PipelineStats({ leads }: PipelineStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                Total Pipeline
              </p>
              <p className="text-lg font-bold">
                $
                {(
                  leads.reduce((acc, l) => acc + l.value, 0) / 1000
                ).toFixed(0)}
                k
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                Won Deals
              </p>
              <p className="text-lg font-bold">
                {leads.filter((l) => l.stage === 'Won').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                In Progress
              </p>
              <p className="text-lg font-bold">
                {
                  leads.filter(
                    (l) => l.stage !== 'Won' && l.stage !== 'Lost'
                  ).length
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                Total Leads
              </p>
              <p className="text-lg font-bold">{leads.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
