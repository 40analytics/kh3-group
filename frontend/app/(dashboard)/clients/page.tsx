import ModernClientsView from '@/components/clients/ModernClientsView';
import { api, getServerToken } from '@/lib/api/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Client } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  // Get current user from token
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let currentUser;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    currentUser = {
      id: payload.sub || payload.id,
      role: payload.role,
      name: payload.name || payload.email,
    };
  } catch (error) {
    redirect('/login');
  }

  let clients: Client[];
  let allUsers: any;

  try {
    const serverToken = await getServerToken();
    [clients, allUsers] = await Promise.all([
      api.clients.getAll(serverToken || undefined),
      api.admin.getUsers(serverToken || undefined).catch(() => ({ users: [] })),
    ]);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    clients = [];
  }

  // Extract managers and sales users (anyone who can manage clients)
  const assignableUsers = Array.isArray(allUsers)
    ? allUsers.filter((u: any) => u.role === 'MANAGER' || u.role === 'SALES')
    : (allUsers as any)?.users?.filter((u: any) => u.role === 'MANAGER' || u.role === 'SALES') || [];

  return (
    <ModernClientsView
      clients={clients}
      currentUser={currentUser}
      managers={assignableUsers}
    />
  );
}
