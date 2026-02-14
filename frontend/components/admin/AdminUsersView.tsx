'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { CreateUserDialog } from './CreateUserDialog';
import { UpdateUserDialog } from './UpdateUserDialog';
import { usersApi, type UserResponse } from '@/lib/api/users-client';
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
import { DataTable } from '@/components/ui/data-table';
import { createUserColumns } from './columns-users';

interface AdminUsersViewProps {
  currentUser: {
    id: string;
    role: string;
    name: string;
  };
}

export default function AdminUsersView({
  currentUser,
}: AdminUsersViewProps) {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] =
    useState<UserResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] =
    useState<UserResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers();
      setUsers(response.users);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred while loading users.';
      toast.error('Failed to load users', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await usersApi.deleteUser(userToDelete.id);
      toast.success('User deleted', {
        description: `${userToDelete.name} has been removed from the system.`,
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred while deleting the user.';
      toast.error('Failed to delete user', { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeleteUser = (user: UserResponse) => {
    if (!['CEO', 'ADMIN'].includes(currentUser.role)) return false;
    if (user.id === currentUser.id) return false;
    if (user.role === 'CEO') return false;
    if (user.role === 'ADMIN' && currentUser.role !== 'CEO')
      return false;
    return true;
  };

  const canEditUser = (user: UserResponse) => {
    if (user.id === currentUser.id) return false;
    if (currentUser.role === 'CEO') return true;
    if (currentUser.role === 'ADMIN') {
      return ['MANAGER', 'SALES'].includes(user.role);
    }
    if (currentUser.role === 'MANAGER') {
      return (
        user.role === 'SALES' && user.managerId === currentUser.id
      );
    }
    return false;
  };

  const managers = users.filter((u) => u.role === 'MANAGER');

  const columns = useMemo(
    () =>
      createUserColumns({
        currentUserId: currentUser.id,
        canEditUser,
        canDeleteUser,
        onEdit: (user) => {
          setUserToUpdate(user);
          setUpdateDialogOpen(true);
        },
        onDelete: (user) => {
          setUserToDelete(user);
          setDeleteDialogOpen(true);
        },
      }),
    [currentUser.id, currentUser.role]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display tracking-tight">
          User Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage system users and their roles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Total Users
            </p>
            <p className="text-2xl font-display">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Active Users
            </p>
            <p className="text-2xl font-display">
              {users.filter((u) => u.status === 'Active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Managers</p>
            <p className="text-2xl font-display">{managers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage system users and their permissions
            </CardDescription>
          </div>
          {hasPermission('users:create') && (
            <Button
              className="gap-2"
              onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              globalFilter
              exportFilename="users"
            />
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={loadUsers}
        currentUserRole={currentUser.role}
        managers={managers}
      />

      <UpdateUserDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        onUserUpdated={loadUsers}
        user={userToUpdate}
        currentUserRole={currentUser.role}
        managers={managers}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>{userToDelete?.name}</strong> (
              {userToDelete?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
