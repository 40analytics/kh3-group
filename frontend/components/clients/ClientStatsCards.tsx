'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Client } from '@/lib/types';

interface ClientStatsCardsProps {
  clients: Client[];
}

export function ClientStatsCards({ clients }: ClientStatsCardsProps) {
  const totalRevenue = clients.reduce((acc, c) => acc + (c.lifetimeRevenue || 0), 0);
  const avgHealthScore =
    clients.reduce((acc, c) => acc + (c.healthScore || 0), 0) /
      clients.filter((c) => c.healthScore).length || 0;
  const activeClients = clients.filter((c) => c.status === 'Active').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Clients</p>
          <p className="text-2xl font-display mt-1">{clients.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-display mt-1">${(totalRevenue / 1000).toFixed(0)}k</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Avg Health Score</p>
          <p className="text-2xl font-display mt-1">{avgHealthScore.toFixed(0)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Active Clients</p>
          <p className="text-2xl font-display mt-1">{activeClients}</p>
        </CardContent>
      </Card>
    </div>
  );
}
