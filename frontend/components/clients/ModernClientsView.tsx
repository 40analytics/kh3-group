'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Client } from '@/lib/types';
import { CreateClientDialog } from './CreateClientDialog';
import { useAuth } from '@/contexts/auth-context';
import { ClientStatsCards } from './ClientStatsCards';
import { ClientDetailDialog } from './ClientDetailDialog';
import { DataTable } from '@/components/ui/data-table';
import { clientColumns } from './columns';

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
        <DataTable
          columns={clientColumns}
          data={initialClients}
          globalFilter
          onRowClick={setSelectedClient}
          exportFilename="clients"
        />
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
