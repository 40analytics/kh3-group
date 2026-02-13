'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Crown, Users, Mail, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Team } from '@/lib/types';
import { getTeam, updateTeam, addTeamMember, removeTeamMember } from '@/lib/api/teams-client';
import { UserResponse } from '@/lib/api/users-client';

interface TeamDetailDialogProps {
  teamId: string | null;
  open: boolean;
  onClose: () => void;
  managers: UserResponse[];
  allUsers: UserResponse[];
  canEdit: boolean;
  onTeamUpdated: () => void;
}

export function TeamDetailDialog({
  teamId,
  open,
  onClose,
  managers,
  allUsers,
  canEdit,
  onTeamUpdated,
}: TeamDetailDialogProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [changingManager, setChangingManager] = useState(false);

  const loadTeam = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const data = await getTeam(teamId);
      setTeam(data);
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId && open) {
      loadTeam();
    } else {
      setTeam(null);
      setSelectedUserId('');
    }
  }, [teamId, open]);

  // Users who are not already members of this team
  const availableUsers = useMemo(() => {
    if (!team) return [];
    const memberIds = new Set(team.members?.map((m) => m.id) || []);
    return allUsers.filter(
      (u) => !memberIds.has(u.id) && u.status === 'Active'
    );
  }, [team, allUsers]);

  const handleAddMember = async () => {
    if (!teamId || !selectedUserId) return;
    setAddingMember(true);
    try {
      await addTeamMember(teamId, selectedUserId);
      toast.success('Member added');
      setSelectedUserId('');
      await loadTeam();
      onTeamUpdated();
    } catch {
      toast.error('Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!teamId) return;
    setRemovingMemberId(userId);
    try {
      await removeTeamMember(teamId, userId);
      toast.success('Member removed');
      await loadTeam();
      onTeamUpdated();
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleChangeManager = async (managerId: string) => {
    if (!teamId) return;
    setChangingManager(true);
    try {
      await updateTeam(teamId, {
        managerId: managerId === 'none' ? undefined : managerId,
      });
      toast.success('Manager updated');
      await loadTeam();
      onTeamUpdated();
    } catch {
      toast.error('Failed to update manager');
    } finally {
      setChangingManager(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'CEO':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MANAGER':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'SALES':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700';
      case 'Inactive':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {loading ? 'Loading...' : team ? team.name : 'Team not found'}
          </DialogTitle>
          <DialogDescription>
            {loading
              ? 'Fetching team details'
              : team
                ? team.description || 'Team details and members'
                : 'Unable to load team'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : team ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{team.type}</Badge>
              <Badge variant="secondary">
                {team.members?.length || 0} member
                {(team.members?.length || 0) !== 1 ? 's' : ''}
              </Badge>
            </div>

            <Separator />

            {/* Manager Section */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Team Manager
              </h4>

              {canEdit ? (
                <div className="space-y-2">
                  <Select
                    value={team.managerId || 'none'}
                    onValueChange={handleChangeManager}
                    disabled={changingManager}
                  >
                    <SelectTrigger>
                      {changingManager ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a manager" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {team.manager && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-medium">
                          {getInitials(team.manager.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {team.manager.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {team.manager.email}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(
                          team.manager.role || 'MANAGER'
                        )}
                      >
                        {team.manager.role || 'MANAGER'}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : team.manager ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-medium">
                      {getInitials(team.manager.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{team.manager.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {team.manager.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getRoleBadgeColor(
                      team.manager.role || 'MANAGER'
                    )}
                  >
                    {team.manager.role || 'MANAGER'}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic p-3 rounded-lg border border-dashed">
                  No manager assigned
                </p>
              )}
            </div>

            <Separator />

            {/* Members Section */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </h4>

              {/* Add Member */}
              {canEdit && availableUsers.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a user to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAddMember}
                    disabled={!selectedUserId || addingMember}
                    className="gap-1 shrink-0"
                  >
                    {addingMember ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              )}

              {team.members && team.members.length > 0 ? (
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getRoleBadgeColor(member.role)}
                        >
                          {member.role}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(member.status)}
                        >
                          {member.status}
                        </Badge>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            disabled={removingMemberId === member.id}
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            {removingMemberId === member.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic p-3 rounded-lg border border-dashed">
                  No members in this team
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Team not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
