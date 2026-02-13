import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Team } from '@/lib/types';
import { getTeams, deleteTeam } from '@/lib/api/teams-client';
import { CreateTeamDialog } from './CreateTeamDialog';
import { EditTeamDialog } from './EditTeamDialog';
import { UserResponse } from '@/lib/api/users-client';
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

interface TeamListProps {
  managers: UserResponse[];
  currentUserRole: string;
}

export function TeamList({
  managers,
  currentUserRole,
}: TeamListProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await getTeams();
      setTeams(data);
    } catch (error) {
      toast.error('Failed to load teams');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTeam(teamToDelete.id);
      toast.success('Team deleted successfully');
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
      loadTeams();
    } catch (error) {
      // Error is already toasted in deleteTeam if needed, but here we can handle specific messages
      const err = error as Error;
      if (err.message && err.message.includes('existing members')) {
        toast.error('Cannot delete team with members', {
          description:
            'Please reassign all members before deleting the team.',
        });
      } else {
        toast.error('Failed to delete team', {
          description: err.message || 'Unknown error occurred',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const canManageTeams = ['CEO', 'ADMIN'].includes(currentUserRole);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              Manage sales teams and assignments
            </CardDescription>
          </div>
          {canManageTeams && (
            <Button
              className="gap-2"
              onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No teams found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      {team.name}
                      {team.description && (
                        <p className="text-xs text-muted-foreground">
                          {team.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {team.manager ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-medium">
                            {team.manager.name.charAt(0)}
                          </div>
                          <span className="text-sm">
                            {team.manager.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{team._count?.members || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canManageTeams && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTeamToEdit(team);
                                setEditDialogOpen(true);
                              }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTeamToDelete(team);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTeamCreated={loadTeams}
        managers={managers}
      />

      <EditTeamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onTeamUpdated={loadTeams}
        team={teamToEdit}
        managers={managers}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{teamToDelete?.name}</strong>? This action
              cannot be undone.
              <br />
              <br />
              Note: You cannot delete a team that has active members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
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
