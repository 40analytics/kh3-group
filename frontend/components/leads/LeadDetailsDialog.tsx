'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Sparkles, Loader2, CalendarClock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Lead } from '@/lib/types';
import type { Activity } from '@/lib/api/activities-client';
import type { FileUpload } from '@/lib/api/files-client';
import { ActivityTimeline } from './ActivityTimeline';
import { FileUploadSection } from './FileUploadSection';
import { LeadMetricsPanel } from './LeadMetricsPanel';
import { StageTimeline } from './StageTimeline';

interface LeadDetailsDialogProps {
  selectedLead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { id: string };
  files: FileUpload[];
  loadFiles: (leadId: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setConvertDialogOpen: (open: boolean) => void;
  setLeadToConvert: (lead: Lead) => void;
  handleGenerateAISummary: () => void;
  handleAnalyzeRisk: (lead: Lead) => void;
  aiLoading: boolean;
  summaryLoading: boolean;
  activities: Activity[];
  hasPermission: (permission: string) => boolean;
  onActivitiesChanged: () => void;
}

export function LeadDetailsDialog({
  selectedLead,
  open,
  onOpenChange,
  currentUser,
  files,
  loadFiles,
  setDeleteDialogOpen,
  setConvertDialogOpen,
  setLeadToConvert,
  handleGenerateAISummary,
  handleAnalyzeRisk,
  aiLoading,
  summaryLoading,
  activities,
  hasPermission,
  onActivitiesChanged,
}: LeadDetailsDialogProps) {
  if (!selectedLead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <p className="text-xs text-muted-foreground">Stage</p>
              <Badge variant="outline">{selectedLead.stage}</Badge>
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
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm">{selectedLead.source}</p>
            </div>
          </div>

          {/* Date Tracking & Overdue */}
          {selectedLead.expectedCloseDate && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expected Close:</span>
                <span className="font-medium">
                  {new Date(selectedLead.expectedCloseDate).toLocaleDateString()}
                </span>
              </div>
              {selectedLead.dealClosedAt && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">Closed:</span>
                  <span className="font-medium">
                    {new Date(selectedLead.dealClosedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {(() => {
                const expected = new Date(selectedLead.expectedCloseDate!);
                const now = new Date();
                const closed = selectedLead.dealClosedAt
                  ? new Date(selectedLead.dealClosedAt)
                  : null;

                if (
                  selectedLead.stage === 'Won' &&
                  closed &&
                  closed <= expected
                ) {
                  return (
                    <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                      <CheckCircle className="h-3 w-3" /> On Time
                    </Badge>
                  );
                }
                if (
                  selectedLead.stage === 'Won' &&
                  closed &&
                  closed > expected
                ) {
                  return (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </Badge>
                  );
                }
                if (
                  !closed &&
                  selectedLead.stage !== 'Won' &&
                  selectedLead.stage !== 'Lost' &&
                  expected < now
                ) {
                  return (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </Badge>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Stage Timeline */}
          <StageTimeline lead={selectedLead} />

          {/* Convert to Client Button (only for Won leads not yet converted) */}
          {selectedLead.stage === 'Won' && (
            <>
              <Separator />
              {selectedLead.clientId || selectedLead.convertedToClientId ? (
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
                    Convert to Client & Project
                  </Button>
                </div>
              )}
            </>
          )}

          {/* AI Analysis Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Analysis
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAISummary}
                  disabled={summaryLoading}>
                  {summaryLoading && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Generate Summary
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyzeRisk(selectedLead)}
                  disabled={aiLoading}>
                  {aiLoading && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Re-analyze Risk
                </Button>
              </div>
            </div>

            {selectedLead.aiSummary && (
              <div className="rounded-lg bg-purple-50 p-4 text-sm text-purple-900">
                <p>{selectedLead.aiSummary}</p>
              </div>
            )}

            {selectedLead.aiRecommendations && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations</p>
                <div className="grid gap-2">
                  {selectedLead.aiRecommendations
                    .split(';')
                    .map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">
                          {rec.trim()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Metrics Panel */}
          <LeadMetricsPanel metrics={selectedLead.metrics} />

          {/* Activity Timeline */}
          <ActivityTimeline
            leadId={selectedLead.id}
            activities={activities}
            currentUserId={currentUser.id}
            onActivityAdded={onActivitiesChanged}
          />

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
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  Danger Zone
                </h4>
                <p className="text-xs text-red-700 mb-3">
                  Permanently remove this lead and all associated
                  data. This cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Lead
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
