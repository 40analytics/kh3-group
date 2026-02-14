'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { UserResponse } from '@/lib/api/users-client';

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'CEO':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ADMIN':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'SALES':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'MANAGER':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

interface UserColumnsOptions {
  currentUserId: string;
  canEditUser: (user: UserResponse) => boolean;
  canDeleteUser: (user: UserResponse) => boolean;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
}

export function createUserColumns({
  currentUserId,
  canEditUser,
  canDeleteUser,
  onEdit,
  onDelete,
}: UserColumnsOptions): ColumnDef<UserResponse>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="font-medium">
            {user.name}
            {user.id === currentUserId && (
              <Badge variant="outline" className="ml-2 text-xs">
                You
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('email')}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge variant="outline" className={getRoleBadge(role)}>
            {role}
          </Badge>
        );
      },
    },
    {
      id: 'team',
      accessorFn: (row) => row.teamName || row.team?.name || '-',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Team" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-sm text-muted-foreground">
            {user.teamName || user.team?.name || '-'}
            {user.manager && (
              <div className="text-xs">Reports to: {user.manager.name}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant="outline"
            className={
              status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-muted text-muted-foreground border-border'
            }>
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;
        const showEdit = canEditUser(user);
        const showDelete = canDeleteUser(user);

        if (!showEdit && !showDelete) {
          return (
            <div className="text-right">
              <span className="text-xs text-muted-foreground px-2">-</span>
            </div>
          );
        }

        return (
          <div
            className="flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}>
            {showEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {showDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(user)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
