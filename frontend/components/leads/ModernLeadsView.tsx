'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  LayoutGrid,
  List as ListIcon,
  Loader2,
} from 'lucide-react';
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
import type { Lead } from '@/lib/types';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { api } from '@/lib/api/client';
import { pipelineApi, type PipelineStage } from '@/lib/api/pipeline-client';
import {
  activitiesApi,
  type Activity,
} from '@/lib/api/activities-client';
import { filesApi, type FileUpload } from '@/lib/api/files-client';
import { CreateLeadDialog } from './CreateLeadDialog';
import { AISummaryDialog } from './AISummaryDialog';
import { ConvertLeadDialog } from './ConvertLeadDialog';
import { useAuth } from '@/contexts/auth-context';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { toast } from 'sonner';

// Imported Refactored Components
import { PipelineStats } from './PipelineStats';
import { KanbanBoard } from './KanbanBoard';
import { LeadDetailsDialog } from './LeadDetailsDialog';

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
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(
    null
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(
    null
  );
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(
    'kanban'
  );

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
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

  // Fetch dynamic pipeline stages
  useEffect(() => {
    pipelineApi.getStages().then(setPipelineStages).catch(console.error);
  }, []);

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
    ? leads.find((lead) => lead.id === activeDragId) || null
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/leads/${selectedLead.id}/summary`,
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
      setLeads((prev) =>
        prev.filter((l) => l.id !== selectedLead.id)
      );
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
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2">
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
      <PipelineStats leads={leads} />

      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {viewMode === 'kanban' ? 'Board View' : 'List View'}
        </h3>
        <div className="flex items-center border rounded-lg p-1">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Board
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="gap-2">
            <ListIcon className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={leads}
          globalFilter={true}
        />
      ) : (
        <KanbanBoard
          leads={leads}
          mounted={mounted}
          sensors={sensors}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragCancel={handleDragCancel}
          activeDragId={activeDragId}
          activeLead={activeLead}
          setSelectedLead={setSelectedLead}
          stages={pipelineStages.length > 0 ? pipelineStages : undefined}
        />
      )}

      {/* Lead Detail Dialog */}
      <LeadDetailsDialog
        selectedLead={selectedLead}
        open={!!selectedLead}
        onOpenChange={() => setSelectedLead(null)}
        currentUser={currentUser}
        files={files}
        loadFiles={loadFiles}
        setDeleteDialogOpen={setDeleteDialogOpen}
        setConvertDialogOpen={setConvertDialogOpen}
        setLeadToConvert={setLeadToConvert}
        handleGenerateAISummary={handleGenerateAISummary}
        handleAnalyzeRisk={handleAnalyzeRisk}
        aiLoading={aiLoading}
        summaryLoading={summaryLoading}
        activities={activities}
        hasPermission={hasPermission}
        onActivitiesChanged={() =>
          selectedLead && loadActivities(selectedLead.id)
        }
      />

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
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>
                {selectedLead?.contactName || selectedLead?.name}
              </strong>{' '}
              ({selectedLead?.company}). All associated activities and
              files will also be removed. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700">
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
