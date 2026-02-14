'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  SensorDescriptor,
  SensorOptions,
} from '@dnd-kit/core';
import type { Lead } from '@/lib/types';
import { DEFAULT_PIPELINE_STAGES } from './constants';
import { LeadCardContent, DraggableLeadCard } from './LeadCard';

interface StageConfig {
  name: string;
  color: string;
  lightColor: string;
  border: string;
}

interface KanbanBoardProps {
  leads: Lead[];
  mounted: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  activeDragId: string | null;
  activeLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  stages?: StageConfig[];
}

// Droppable Column Component
function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });

  return <div ref={setNodeRef}>{children}</div>;
}

export function KanbanBoard({
  leads,
  mounted,
  sensors,
  handleDragStart,
  handleDragEnd,
  handleDragCancel,
  activeDragId,
  activeLead,
  setSelectedLead,
  stages,
}: KanbanBoardProps) {
  const pipelineStages = stages || DEFAULT_PIPELINE_STAGES;

  if (!mounted) {
    return (
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {pipelineStages.map((stage) => {
            const stageLeads = leads.filter(
              (lead) => lead.stage === stage.name
            );
            const stageValue = stageLeads.reduce(
              (acc, lead) => acc + lead.value,
              0
            );

            return (
              <div key={stage.name} className="w-80 shrink-0">
                <div
                  className={`rounded-lg border-2 ${stage.border} ${stage.lightColor} p-4 min-h-[200px]`}>
                  {/* Stage Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${stage.color}`}
                        />
                        <h3 className="font-semibold">
                          {stage.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="text-xs">
                          {stageLeads.length}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${(stageValue / 1000).toFixed(0)}k total
                    </p>
                  </div>

                  {/* Lead Cards (Static) */}
                  <div className="space-y-3">
                    {stageLeads.map((lead) => (
                      <LeadCardContent key={lead.id} lead={lead} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      // collisionDetection={closestCenter} // Passed from parent or imported if needed, but safer to use default if not critical
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {pipelineStages.map((stage) => {
            const stageLeads = leads.filter(
              (lead) => lead.stage === stage.name
            );
            const stageValue = stageLeads.reduce(
              (acc, lead) => acc + lead.value,
              0
            );

            return (
              <DroppableColumn key={stage.name} id={stage.name}>
                <div className="w-80 shrink-0">
                  <div
                    className={`rounded-lg border-2 ${stage.border} ${stage.lightColor} p-4 min-h-[200px]`}>
                    {/* Stage Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${stage.color}`}
                          />
                          <h3 className="font-display text-base">
                            {stage.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="text-xs">
                            {stageLeads.length}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${(stageValue / 1000).toFixed(0)}k total
                      </p>
                    </div>

                    {/* Lead Cards */}
                    <div className="space-y-3">
                      {stageLeads.map((lead) => (
                        <DraggableLeadCard
                          key={lead.id}
                          lead={lead}
                          onSelect={setSelectedLead}
                          isDragging={activeDragId === lead.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </DroppableColumn>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeLead ? (
          <div className="opacity-80">
            <LeadCardContent lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
