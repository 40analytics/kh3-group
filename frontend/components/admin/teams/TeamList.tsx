import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Team } from '@/lib/types';
import { getTeams, deleteTeam } from '@/lib/api/teams-client';
import { CreateTeamDialog } from './CreateTeamDialog';
import { EditTeamDialog } from './EditTeamDialog';
import { TeamDetailDialog } from './TeamDetailDialog';
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
import { DataTable } from '@/components/ui/data-table';
import { createTeamColumns } from './columns-teams';

interface TeamListProps {
  managers: UserResponse[];
  allUsers: UserResponse[];
  currentUserRole: string;
}

export function TeamList({
  managers,
  allUsers,
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
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);

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

  const columns = useMemo(
    () =>
      createTeamColumns({
        canManageTeams,
        onEdit: (team) => {
          setTeamToEdit(team);
          setEditDialogOpen(true);
        },
        onDelete: (team) => {
          setTeamToDelete(team);
          setDeleteDialogOpen(true);
        },
      }),
    [canManageTeams]
  );

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
            <DataTable
              columns={columns}
              data={teams}
              globalFilter
              onRowClick={(team) => setDetailTeamId(team.id)}
              exportFilename="teams"
            />
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

      <TeamDetailDialog
        teamId={detailTeamId}
        open={!!detailTeamId}
        onClose={() => setDetailTeamId(null)}
        managers={managers}
        allUsers={allUsers}
        canEdit={canManageTeams}
        onTeamUpdated={loadTeams}
      />
    </div>
  );
}
