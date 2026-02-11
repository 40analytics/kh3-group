import ModernAdminView from '@/components/admin/ModernAdminView';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Get token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // Decode JWT to get user info (basic parsing, don't verify - backend does that)
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
    console.error('Failed to parse token:', error);
    redirect('/login');
  }

  // Only CEO, ADMIN, and MANAGER can access admin panel
  if (!['CEO', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  return <ModernAdminView currentUser={currentUser} />;
}
