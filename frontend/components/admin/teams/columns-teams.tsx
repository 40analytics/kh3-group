'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Users } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { Team } from '@/lib/types';

interface TeamColumnsOptions {
  canManageTeams: boolean;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function createTeamColumns({
  canManageTeams,
  onEdit,
  onDelete,
}: TeamColumnsOptions): ColumnDef<Team>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const team = row.original;
        return (
          <div>
            <span className="font-medium">{team.name}</span>
            {team.description && (
              <p className="text-xs text-muted-foreground">{team.description}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('type')}</Badge>
      ),
    },
    {
      id: 'manager',
      accessorFn: (row) => row.manager?.name || '-',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Manager" />
      ),
      cell: ({ row }) => {
        const team = row.original;
        if (!team.manager) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-medium">
              {team.manager.name.charAt(0)}
            </div>
            <span className="text-sm">{team.manager.name}</span>
          </div>
        );
      },
    },
    {
      id: 'members',
      accessorFn: (row) => row._count?.members || 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Members" />
      ),
      cell: ({ row }) => {
        const team = row.original;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{team._count?.members || 0}</span>
          </div>
        );
      },
    },
    ...(canManageTeams
      ? [
          {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }: { row: { original: Team } }) => {
              const team = row.original;
              return (
                <div
                  className="flex justify-end gap-1"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(team)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(team)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            },
          } as ColumnDef<Team>,
        ]
      : []),
  ];
}
