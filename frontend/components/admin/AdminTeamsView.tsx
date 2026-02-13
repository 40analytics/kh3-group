'use client';

import { useState, useEffect } from 'react';
import { TeamList } from './teams/TeamList';
import { usersApi, type UserResponse } from '@/lib/api/users-client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminTeamsViewProps {
  currentUser: {
    id: string;
    role: string;
    name: string;
  };
}

export default function AdminTeamsView({ currentUser }: AdminTeamsViewProps) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await usersApi.getUsers();
        setUsers(response.users);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load users.';
        toast.error('Failed to load users', { description: message });
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const managers = users.filter((u) => u.role === 'MANAGER');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display tracking-tight">Teams</h2>
        <p className="text-muted-foreground mt-1">Manage teams and team assignments</p>
      </div>
      <TeamList
        managers={managers}
        allUsers={users}
        currentUserRole={currentUser.role}
      />
    </div>
  );
}
