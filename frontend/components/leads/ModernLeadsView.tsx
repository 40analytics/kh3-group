'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  DollarSign,
  Building2,
  AlertCircle,
  Sparkles,
  Loader2,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { useEffect } from 'react';
import type { Lead } from '@/lib/types';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { api } from '@/lib/api/client';
import { activitiesApi, type Activity } from '@/lib/api/activities-client';
import { filesApi, type FileUpload } from '@/lib/api/files-client';
import { CreateLeadDialog } from './CreateLeadDialog';
import { ActivityTimeline } from './ActivityTimeline';
import { FileUploadSection } from './FileUploadSection';
import { LeadMetricsPanel } from './LeadMetricsPanel';
import { AISummaryDialog } from './AISummaryDialog';
import { ConvertLeadDialog } from './ConvertLeadDialog';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Manager {
  id: string;
  name: string;
  email: string;
  teamName?: string;
}

interface ModernLeadsViewProps {
  leads: Lead[];
  currentUser: {
    id: string;
    role: string;
    name?: string;
  };
  managers: Manager[];
}

const PIPELINE_STAGES = [
  {
    name: 'New',
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50',
    border: 'border-gray-200',
  },
  {
    name: 'Contacted',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    name: 'Quoted',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    name: 'Negotiation',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    name: 'Won',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    name: 'Lost',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    border: 'border-red-200',
  },
];

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

// Lead Card Content Component (for both draggable and overlay)
function LeadCardContent({ lead }: { lead: Lead }) {
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
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Value
          </span>
          <span className="font-semibold">
            ${(lead.value / 1000).toFixed(1)}k
          </span>
        </div>
        {lead.aiRiskLevel && (
          <Badge
            variant="secondary"
            className="text-xs w-full justify-center">
            Risk: {lead.aiRiskLevel}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// Draggable Lead Card Component
function DraggableLeadCard({
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

export default function ModernLeadsView({
  leads: initialLeads = [],
  currentUser,
  managers,
}: ModernLeadsViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Load activities when a lead is selected
  const loadActivities = async (leadId: string) => {
    setActivitiesLoading(true);
    try {
      const data = await activitiesApi.getActivities(leadId);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Load files when a lead is selected
  const loadFiles = async (leadId: string) => {
    setFilesLoading(true);
    try {
      const data = await filesApi.getFiles(leadId);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  // Load activities and files when selected lead changes
  useEffect(() => {
    if (selectedLead) {
      loadActivities(selectedLead.id);
      loadFiles(selectedLead.id);
    } else {
      setActivities([]);
      setFiles([]);
    }
  }, [selectedLead?.id]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;

    // Optimistic Update
    const oldLeads = [...leads];
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, stage: newStage } : lead
      )
    );

    // Call API
    api.leads.update(leadId, { stage: newStage }).catch((error) => {
      console.error('Failed to update lead stage:', error);
      // Revert on failure
      setLeads(oldLeads);
    });
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const activeLead = activeDragId
    ? leads.find((lead) => lead.id === activeDragId)
    : null;

  const handleAnalyzeRisk = async (lead: Lead) => {
    setAiLoading(true);
    try {
      const result = await api.leads.analyzeRisk(lead.id);
      router.refresh();
      const updatedLead = {
        ...lead,
        aiRiskLevel: result.riskLevel,
        aiSummary: result.summary,
        aiRecommendations: result.recommendations?.join('; '),
      };
      setSelectedLead(updatedLead);
      // Update the lead in the main list as well
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? updatedLead : l))
      );
    } catch (error) {
      console.error('Failed to analyze risk:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateAISummary = async () => {
    if (!selectedLead) return;

    setSummaryLoading(true);
    try {
      const response = await fetch(
        `http://localhost:4000/api/leads/${selectedLead.id}/summary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }

      const summary = await response.json();
      setAiSummary(summary);
      setSummaryDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    setIsDeleting(true);
    try {
      await api.leads.delete(selectedLead.id);
      setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id));
      setSelectedLead(null);
      setDeleteDialogOpen(false);
      toast.success('Lead deleted');
    } catch (error) {
      toast.error('Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display tracking-tight">
            Sales Pipeline
          </h2>
          <p className="text-muted-foreground mt-1">
            Track and manage your sales opportunities
          </p>
        </div>
        {hasPermission('leads:create') && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        )}
      </div>

      <CreateLeadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentUser={currentUser}
        managers={managers}
      />

      {/* Pipeline Stats */}
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

      {/* Kanban Board */}

      {/* Kanban Board */}
      {mounted && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 min-w-max">
              {PIPELINE_STAGES.map((stage) => {
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
      )}
      {!mounted && (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {PIPELINE_STAGES.map((stage) => {
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
      )}

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <Dialog
          open={!!selectedLead}
          onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedLead.contactName || selectedLead.name}
              </DialogTitle>
              <DialogDescription>
                {selectedLead.company}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Key Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Deal Value
                  </p>
                  <p className="text-lg font-semibold">
                    ${selectedLead.value.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Stage
                  </p>
                  <Badge variant="outline">
                    {selectedLead.stage}
                  </Badge>
                </div>
                {selectedLead.serviceType && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Service Type
                    </p>
                    <Badge variant="outline">
                      {selectedLead.serviceType}
                    </Badge>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Source
                  </p>
                  <p className="text-sm">{selectedLead.source}</p>
                </div>
              </div>

              {/* Convert to Client Button (only for Won leads not yet converted) */}
              {selectedLead.stage === 'Won' && (
                <>
                  <Separator />
                  {selectedLead.clientId ? (
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-blue-900">
                          Converted to Client
                        </p>
                        <p className="text-sm text-blue-700">
                          This lead has already been converted
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.location.href = '/clients';
                        }}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        View Clients
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-green-900">
                          Lead is Won! Ready to convert
                        </p>
                        <p className="text-sm text-green-700">
                          Create a client and first project from this lead
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setLeadToConvert(selectedLead);
                          setConvertDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700">
                        Convert to Client
                      </Button>
                    </div>
                  )}
                </>
              )}

              <Separator />

              {/* Lead Metrics & Risk Flags */}
              <LeadMetricsPanel
                metrics={(selectedLead as any).metrics}
                riskFlags={(selectedLead as any).riskFlags}
                suggestedActions={(selectedLead as any).suggestedActions}
                onGenerateSummary={handleGenerateAISummary}
                loadingSummary={summaryLoading}
              />

              <Separator />

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedLead.notes}
                  </p>
                </div>
              )}

              {/* AI Analysis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Risk Analysis
                  </h4>
                  {!selectedLead.aiRiskLevel && (
                    <Button
                      size="sm"
                      onClick={() => handleAnalyzeRisk(selectedLead)}
                      disabled={aiLoading}>
                      {aiLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </Button>
                  )}
                </div>
                {selectedLead.aiSummary ? (
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <p className="text-sm">
                      {selectedLead.aiSummary}
                    </p>
                    {selectedLead.aiRecommendations && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold mb-2">
                          Recommendations:
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                          {(() => {
                            try {
                              const recs = JSON.parse(selectedLead.aiRecommendations);
                              return Array.isArray(recs)
                                ? recs.map((rec, i) => <li key={i}>{rec}</li>)
                                : <li>{selectedLead.aiRecommendations}</li>;
                            } catch {
                              return selectedLead.aiRecommendations
                                .split('; ')
                                .map((rec, i) => <li key={i}>{rec}</li>);
                            }
                          })()}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No AI analysis generated yet
                  </p>
                )}
              </div>

              <Separator />

              {/* Activity Timeline */}
              <ActivityTimeline
                leadId={selectedLead.id}
                activities={activities}
                currentUserId={currentUser.id}
                onActivityAdded={() => loadActivities(selectedLead.id)}
              />

              <Separator />

              {/* File Uploads */}
              <FileUploadSection
                leadId={selectedLead.id}
                files={files}
                currentUserId={currentUser.id}
                onFilesChanged={() => loadFiles(selectedLead.id)}
              />

              {/* Danger Zone */}
              {hasPermission('leads:delete') && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Danger Zone</h4>
                    <p className="text-xs text-red-700 mb-3">
                      Permanently remove this lead and all associated data. This cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Lead
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Summary Dialog */}
      <AISummaryDialog
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
        summary={aiSummary}
      />

      {/* Convert Lead Dialog */}
      <ConvertLeadDialog
        lead={leadToConvert}
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        managers={managers}
      />

      {/* Delete Lead Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>{selectedLead?.contactName || selectedLead?.name}</strong> ({selectedLead?.company}).
              All associated activities and files will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
