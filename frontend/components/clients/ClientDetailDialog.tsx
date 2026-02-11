'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Heart, Sparkles, Mail, Phone, MapPin, Globe, Link2 } from 'lucide-react';
import type { Client } from '@/lib/types';
import { api } from '@/lib/api/client';
import { clientActivitiesApi, type Activity } from '@/lib/api/client-activities';
import { clientFilesApi, type FileUpload } from '@/lib/api/client-files';
import { projectsApi, type Project } from '@/lib/api/projects-client';
import { ClientMetricsPanel } from './ClientMetricsPanel';
import { ClientActivityTimeline } from './ClientActivityTimeline';
import { ClientFileUploadSection } from './ClientFileUploadSection';
import { ClientProjectsList } from './ClientProjectsList';

interface ClientDetailDialogProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  accountManagers: Array<{ id: string; name: string; email: string }>;
  onClientUpdated: () => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'at risk':
    case 'dormant':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getHealthColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getHealthBgColor = (score: number) => {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
};

export function ClientDetailDialog({
  client,
  open,
  onClose,
  currentUserId,
  accountManagers,
  onClientUpdated,
}: ClientDetailDialogProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(client);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingUpsell, setLoadingUpsell] = useState(false);
  const [loadingAutoUpdate, setLoadingAutoUpdate] = useState(false);
  const [upsellData, setUpsellData] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setSelectedClient(client);
    if (client?.id) {
      loadClientData(client.id);
    }
  }, [client]);

  const loadClientData = async (clientId: string) => {
    try {
      const [activitiesData, filesData, projectsData] = await Promise.all([
        clientActivitiesApi.getActivities(clientId),
        clientFilesApi.getFiles(clientId),
        projectsApi.getByClient(clientId),
      ]);
      setActivities(activitiesData);
      setFiles(filesData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load client data:', error);
    }
  };

  const handleGenerateHealth = async () => {
    if (!selectedClient?.id) return;
    setLoadingHealth(true);
    try {
      const result = await api.clients.generateHealthReport(selectedClient.id);
      const updated = {
        ...selectedClient,
        healthScore: result.healthScore,
        aiHealthSummary: result.summary,
      };
      setSelectedClient(updated);
      onClientUpdated();
    } catch (error) {
      console.error('Failed to generate health report:', error);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleAutoUpdateStatus = async () => {
    if (!selectedClient?.id) return;
    setLoadingAutoUpdate(true);
    try {
      await api.clients.updateHealthStatus(selectedClient.id);
      // Refresh client data
      const updated = await api.clients.getById(selectedClient.id);
      setSelectedClient(updated);
      onClientUpdated();
    } catch (error) {
      console.error('Failed to auto-update health status:', error);
    } finally {
      setLoadingAutoUpdate(false);
    }
  };

  const handleGenerateUpsell = async () => {
    if (!selectedClient?.id) return;
    setLoadingUpsell(true);
    try {
      const result = await api.clients.generateUpsellStrategy(selectedClient.id);
      setUpsellData(result);
    } catch (error) {
      console.error('Failed to generate upsell strategy:', error);
    } finally {
      setLoadingUpsell(false);
    }
  };

  const handleDataRefresh = () => {
    if (selectedClient?.id) {
      loadClientData(selectedClient.id);
      onClientUpdated();
    }
  };

  if (!selectedClient) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl">
                {selectedClient.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{selectedClient.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{selectedClient.industry}</span>
                <span>•</span>
                <Badge variant="outline" className={getStatusColor(selectedClient.status)}>
                  {selectedClient.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Lifetime Revenue</p>
                  <p className="text-2xl font-bold">
                    ${((selectedClient.lifetimeRevenue || 0) / 1000).toFixed(0)}k
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Segment</p>
                  <Badge className="mt-1">{selectedClient.segment}</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            {(selectedClient.email || selectedClient.phone || selectedClient.address || selectedClient.website) && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedClient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Email</p>
                        <p className="font-medium">{selectedClient.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <p className="font-medium">{selectedClient.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Address</p>
                        <p className="font-medium">{selectedClient.address}</p>
                      </div>
                    </div>
                  )}
                  {selectedClient.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Website</p>
                        <p className="font-medium">{selectedClient.website}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Details */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Account Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Account Manager</p>
                  <p className="font-medium">
                    {selectedClient.accountManager?.name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Industry</p>
                  <p className="font-medium">{selectedClient.industry}</p>
                </div>
              </div>
            </div>

            {/* Original Lead Conversion */}
            {selectedClient.convertedFromLead && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-500" />
                  Converted From Lead
                </h4>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{selectedClient.convertedFromLead.contactName}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedClient.convertedFromLead.stage}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{selectedClient.convertedFromLead.company}</p>
                      <p className="text-xs text-muted-foreground">
                        Original Value: ${selectedClient.convertedFromLead.value.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Metrics Panel */}
            {selectedClient.metrics && (
              <ClientMetricsPanel
                metrics={selectedClient.metrics}
                healthFlags={selectedClient.healthFlags}
                suggestedActions={selectedClient.suggestedActions}
              />
            )}
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-4">
            <ClientActivityTimeline
              clientId={selectedClient.id}
              activities={activities}
              currentUserId={currentUserId}
              onActivityAdded={handleDataRefresh}
            />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="mt-4">
            <ClientFileUploadSection
              clientId={selectedClient.id}
              files={files}
              currentUserId={currentUserId}
              onFilesChanged={handleDataRefresh}
            />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-4">
            <ClientProjectsList
              clientId={selectedClient.id}
              projects={projects}
              accountManagers={accountManagers}
              onProjectsChanged={handleDataRefresh}
            />
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Client Health Analysis
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAutoUpdateStatus}
                  disabled={loadingAutoUpdate}>
                  {loadingAutoUpdate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Auto-Update Status'
                  )}
                </Button>
                {(!selectedClient.aiHealthSummary || !selectedClient.healthScore) && (
                  <Button
                    size="sm"
                    onClick={handleGenerateHealth}
                    disabled={loadingHealth}>
                    {loadingHealth ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Generate Report'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {selectedClient.healthScore !== null &&
            selectedClient.healthScore !== undefined ? (
              <Card className={getHealthBgColor(selectedClient.healthScore)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Overall Health</span>
                    <span
                      className={`text-2xl font-bold ${getHealthColor(
                        selectedClient.healthScore
                      )}`}>
                      {selectedClient.healthScore}%
                    </span>
                  </div>
                  <Progress value={selectedClient.healthScore} className="h-3" />
                </CardContent>
              </Card>
            ) : null}

            {selectedClient.aiHealthSummary ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm leading-relaxed text-gray-700">
                  {selectedClient.aiHealthSummary}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No health analysis available yet</p>
                <p className="text-sm">Click "Generate Report" to analyze this client</p>
              </div>
            )}
          </TabsContent>

          {/* Growth Tab */}
          <TabsContent value="growth" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Growth Opportunities
              </h4>
              {!upsellData && (
                <Button
                  size="sm"
                  onClick={handleGenerateUpsell}
                  disabled={loadingUpsell}>
                  {loadingUpsell ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Generate Strategy'
                  )}
                </Button>
              )}
            </div>

            {upsellData ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-semibold text-sm mb-2">Strategy</h5>
                  <p className="text-sm text-gray-700">{upsellData.approach}</p>
                </div>

                {upsellData.opportunities && upsellData.opportunities.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-sm">Opportunities</h5>
                    {upsellData.opportunities.map((opp: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h6 className="font-semibold">{opp.service}</h6>
                              <p className="text-sm text-muted-foreground mt-1">
                                {opp.rationale}
                              </p>
                              <p className="text-sm font-medium mt-2">
                                Est. Value: {opp.estimatedValue}
                              </p>
                            </div>
                            <Badge>{opp.priority}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No upsell strategy available yet</p>
                <p className="text-sm">
                  Click "Generate Strategy" to discover opportunities
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
