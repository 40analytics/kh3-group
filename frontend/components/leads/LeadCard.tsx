import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Activity as ActivityIcon,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { Lead } from '@/lib/types';
import { getProbability } from './constants';

// Lead Card Content Component (for both draggable and overlay)
export function LeadCardContent({ lead }: { lead: Lead }) {
  const probability = getProbability(lead.stage);
  const isOverdue =
    lead.expectedCloseDate &&
    lead.stage !== 'Won' &&
    lead.stage !== 'Lost' &&
    new Date(lead.expectedCloseDate) < new Date();

  return (
    <Card className="cursor-grab hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">
              {lead.contactName || lead.name}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {lead.company}
            </p>
          </div>
          {lead.serviceType && (
            <Badge variant="outline" className="text-xs">
              {lead.serviceType}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Value
          </span>
          <span className="font-semibold">
            ${(lead.value / 1000).toFixed(1)}k
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate">
              {lead.assignedTo?.name || 'Unassigned'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="truncate">
              {lead.expectedCloseDate
                ? new Date(
                    lead.expectedCloseDate
                  ).toLocaleDateString()
                : 'No date'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{probability}% Prob.</span>
          </div>
          <div className="flex items-center gap-1">
            <ActivityIcon className="h-3 w-3" />
            <span>
              {lead.metrics?.daysSinceLastContact || 0}d ago
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>In pipeline: {lead.metrics?.daysInPipeline || 0}d</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{lead.metrics?.activityCount || 0} activities</span>
          </div>
        </div>

        {isOverdue && (
          <Badge
            variant="destructive"
            className="text-xs w-full justify-center">
            Overdue
          </Badge>
        )}

        {lead.aiRiskLevel && (
          <Badge
            variant={
              lead.aiRiskLevel === 'High'
                ? 'destructive'
                : 'secondary'
            }
            className="text-xs w-full justify-center">
            Risk: {lead.aiRiskLevel}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// Draggable Lead Card Component
export function DraggableLeadCard({
  lead,
  onSelect,
  isDragging,
}: {
  lead: Lead;
  onSelect: (lead: Lead) => void;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } =
    useDraggable({
      id: lead.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onSelect(lead)}>
      <LeadCardContent lead={lead} />
    </div>
  );
}
