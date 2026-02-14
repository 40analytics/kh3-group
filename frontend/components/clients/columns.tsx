'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { Client } from '@/lib/types';

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'at risk':
    case 'dormant':
      return 'bg-red-50 text-red-600 border-red-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getHealthColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const clientColumns: ColumnDef<Client>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {client.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{client.name}</p>
            {client.email && (
              <p className="text-xs text-muted-foreground">{client.email}</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'industry',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Industry" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue('industry')}
      </span>
    ),
  },
  {
    accessorKey: 'segment',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Segment" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.getValue('segment')}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant="outline" className={getStatusBadge(status)}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'healthScore',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Health" />
    ),
    cell: ({ row }) => {
      const score = row.getValue('healthScore') as number | null;
      if (score == null) {
        return <span className="text-xs text-muted-foreground italic">N/A</span>;
      }
      return (
        <div className="flex items-center gap-2 min-w-[80px]">
          <Progress value={score} className="h-1.5 w-12" />
          <span className={`text-sm font-medium ${getHealthColor(score)}`}>
            {score}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'lifetimeRevenue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Revenue" className="justify-end" />
    ),
    cell: ({ row }) => {
      const revenue = row.getValue('lifetimeRevenue') as number;
      return (
        <div className="text-right font-medium tabular-nums">
          ${((revenue || 0) / 1000).toFixed(0)}k
        </div>
      );
    },
  },
  {
    id: 'manager',
    accessorFn: (row) => row.accountManager?.name || 'Unassigned',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Manager" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue('manager')}
      </span>
    ),
  },
];
