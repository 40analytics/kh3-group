'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Heart, Activity } from 'lucide-react';
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Health Score</p>
              <p className="text-2xl font-bold">{avgHealthScore.toFixed(0)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Clients</p>
              <p className="text-2xl font-bold">{activeClients}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
