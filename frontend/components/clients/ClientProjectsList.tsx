'use client';

import { useState } from 'react';
import { Plus, Briefcase, Calendar, DollarSign, User, Trash2, Edit, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { projectsApi, type Project, type CreateProjectDto } from '@/lib/api/projects-client';
import { format } from 'date-fns';

interface ClientProjectsListProps {
  clientId: string;
  projects: Project[];
  accountManagers: Array<{ id: string; name: string; email: string }>;
  onProjectsChanged: () => void;
}

const PROJECT_STATUSES = [
  { value: 'Planning', label: 'Planning', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'Active', label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'On Hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'Completed', label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
];

const getStatusBadge = (status: string) => {
  const statusConfig = PROJECT_STATUSES.find((s) => s.value === status);
  return statusConfig || PROJECT_STATUSES[0];
};

export function ClientProjectsList({
  clientId,
  projects,
  accountManagers,
  onProjectsChanged,
}: ClientProjectsListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateProjectDto>>({
    clientId,
    status: 'Planning',
    value: 0,
  });

  const handleCreateProject = async () => {
    if (!formData.name?.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (!formData.value || formData.value <= 0) {
      toast.error('Please enter a valid project value');
      return;
    }

    setIsSubmitting(true);
    try {
      await projectsApi.create({
        name: formData.name,
        clientId,
        status: formData.status || 'Planning',
        value: formData.value,
        description: formData.description,
        projectManagerId: formData.projectManagerId,
        startDate: formData.startDate,
      });

      toast.success('Project created successfully');
      setFormData({ clientId, status: 'Planning', value: 0 });
      setCreateDialogOpen(false);
      onProjectsChanged();
    } catch (error: any) {
      toast.error('Failed to create project', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsApi.delete(projectId);
      toast.success('Project deleted');
      onProjectsChanged();
    } catch (error: any) {
      toast.error('Failed to delete project', {
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projects</h3>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>No projects yet</p>
          <p className="text-sm">Create the first project for this client</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const statusBadge = getStatusBadge(project.status);

            return (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold">{project.name}</h4>
                        <Badge className={statusBadge.color}>{project.status}</Badge>
                      </div>

                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${project.value.toLocaleString()}</span>
                        </div>

                        {project.lead && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Link2 className="h-3 w-3" />
                            <span title={`Converted from lead: ${project.lead.company}`}>
                              From Lead: {project.lead.contactName}
                            </span>
                          </div>
                        )}

                        {project.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Started {format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}

                        {project.completedDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Completed {format(new Date(project.completedDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}

                        {project.projectManager && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{project.projectManager.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project for this client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                placeholder="e.g., Website Redesign"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Value *</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Project Manager</Label>
              <Select
                value={formData.projectManagerId || ''}
                onValueChange={(value) => setFormData({ ...formData, projectManagerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project manager" />
                </SelectTrigger>
                <SelectContent>
                  {accountManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Project description..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
