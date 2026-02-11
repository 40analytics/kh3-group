'use client';

import { useState } from 'react';
import { Phone, FileText, RefreshCw, Mail, Trash2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { clientActivitiesApi, type Activity, type CreateActivityDto } from '@/lib/api/client-activities';
import { formatDistanceToNow } from 'date-fns';

interface ClientActivityTimelineProps {
  clientId: string;
  activities: Activity[];
  currentUserId: string;
  onActivityAdded: () => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'call':
      return <Phone className="h-4 w-4" />;
    case 'note':
      return <FileText className="h-4 w-4" />;
    case 'status_change':
      return <RefreshCw className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'meeting':
      return <Users className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'call':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'note':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'status_change':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'email':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'meeting':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function ClientActivityTimeline({
  clientId,
  activities,
  currentUserId,
  onActivityAdded,
}: ClientActivityTimelineProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityType, setActivityType] = useState<CreateActivityDto['type']>('note');
  const [content, setContent] = useState('');

  const handleAddActivity = async () => {
    if (!content.trim()) {
      toast.error('Please enter activity details');
      return;
    }

    setIsSubmitting(true);
    try {
      await clientActivitiesApi.createActivity(clientId, {
        type: activityType,
        content: content.trim(),
      });

      toast.success('Activity added successfully');
      setContent('');
      setActivityType('note');
      setAddDialogOpen(false);
      onActivityAdded();
    } catch (error: any) {
      toast.error('Failed to add activity', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await clientActivitiesApi.deleteActivity(clientId, activityId);
      toast.success('Activity deleted');
      onActivityAdded();
    } catch (error: any) {
      toast.error('Failed to delete activity', {
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Timeline</h3>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No activities yet. Add the first one!
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{activity.user.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {activity.userId === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {activity.content}
                </p>
                {activity.metadata && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                    {JSON.stringify(activity.metadata, null, 2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>
              Record a call, meeting, note, or other activity for this client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select
                value={activityType}
                onValueChange={(value) => setActivityType(value as CreateActivityDto['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                placeholder="Enter activity details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddActivity} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Activity'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
