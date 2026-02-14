'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2 } from 'lucide-react';
import type { Lead } from '@/lib/types';

interface StageTimelineProps {
  lead: Lead;
}

export function StageTimeline({ lead }: StageTimelineProps) {
  const timeline = lead.metrics?.stageTimeline;

  if (!timeline || timeline.length === 0) {
    return null;
  }

  const totalDays = lead.metrics?.daysInPipeline ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Stage Timeline
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalDays} day{totalDays !== 1 ? 's' : ''} in pipeline
        </span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {timeline.map((entry, index) => {
          const isCurrent = index === timeline.length - 1;
          const enteredDate = new Date(entry.enteredAt).toLocaleDateString(
            'en-US',
            { month: 'short', day: 'numeric' },
          );

          return (
            <div key={index} className="flex items-center">
              <div
                className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[90px] text-center ${
                  isCurrent
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {!isCurrent && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {entry.stage}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {enteredDate}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] mt-1 px-1.5 py-0"
                >
                  {entry.daysSpent}d
                </Badge>
              </div>
              {index < timeline.length - 1 && (
                <div className="w-4 h-px bg-border mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
