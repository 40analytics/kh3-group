'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import type { Client } from '@/lib/types';
import { CreateClientDialog } from './CreateClientDialog';
import { useAuth } from '@/contexts/auth-context';
import { ClientStatsCards } from './ClientStatsCards';
import { ClientDetailDialog } from './ClientDetailDialog';

interface Manager {
  id: string;
  name: string;
  email: string;
  teamName?: string;
}

interface ModernClientsViewProps {
  clients: Client[];
  currentUser: {
    id: string;
    role: string;
    name?: string;
  };
  managers: Manager[];
}

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

export default function ModernClientsView({
  clients: initialClients,
  currentUser,
  managers,
}: ModernClientsViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleClientUpdated = () => {
    router.refresh();
  };

  const handleCloseDialog = () => {
    setSelectedClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display tracking-tight">Client Portfolio</h2>
          <p className="text-muted-foreground mt-1">
            Manage and grow your client relationships
          </p>
        </div>
        {hasPermission('clients:create') && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        )}
      </div>

      {/* Create Client Dialog */}
      <CreateClientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentUser={currentUser}
        managers={managers}
      />

      {/* Stats Cards */}
      <ClientStatsCards clients={initialClients} />

      {/* Clients Table */}
      {initialClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No clients found.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="text-right">Lifetime Revenue</TableHead>
                <TableHead>Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedClient(client)}
                >
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.industry}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {client.segment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadge(client.status)}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.healthScore !== null && client.healthScore !== undefined ? (
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <Progress value={client.healthScore} className="h-1.5 w-12" />
                        <span className={`text-sm font-medium ${getHealthColor(client.healthScore)}`}>
                          {client.healthScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    ${((client.lifetimeRevenue || 0) / 1000).toFixed(0)}k
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.accountManager?.name || 'Unassigned'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Client Detail Dialog */}
      <ClientDetailDialog
        client={selectedClient}
        open={!!selectedClient}
        onClose={handleCloseDialog}
        currentUserId={currentUser.id}
        accountManagers={managers}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
}
