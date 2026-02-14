'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Lead } from '@/lib/types';

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {lead.contactName || lead.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'company',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
  },
  {
    accessorKey: 'value',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Value" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('value'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'stage',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => {
      const stage = row.getValue('stage') as string;
      return <Badge variant="outline">{stage}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'assignedTo.name',
    id: 'owner',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => {
      const ownerName = row.original.assignedTo?.name || 'Unassigned';
      return (
        <span className="text-sm text-muted-foreground">
          {ownerName}
        </span>
      );
    },
  },
  {
    accessorKey: 'metrics.daysSinceLastContact',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Activity" />
    ),
    cell: ({ row }) => {
      const days = row.original.metrics?.daysSinceLastContact;
      if (days === undefined)
        return <span className="text-muted-foreground">-</span>;
      return (
        <span className="text-sm text-muted-foreground">
          {days} days ago
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const lead = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(lead.id)}>
              Copy Lead ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // Trigger view detail logic if passed via meta or context
                // For now this is a placeholder as the main view handles clicking rows usually
                // But we can emit a custom event or expect a handler in table meta
              }}>
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
