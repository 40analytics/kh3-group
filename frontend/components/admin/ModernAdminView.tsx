'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Settings,
  Sparkles,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  UserPlus,
  Key,
  Loader2,
  Trash2,
  Edit,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { CreateUserDialog } from './CreateUserDialog';
import { UpdateUserDialog } from './UpdateUserDialog';
import { PermissionsMatrix } from './PermissionsMatrix';
import { TeamList } from './teams/TeamList';
import { usersApi, type UserResponse } from '@/lib/api/users-client';
import { api } from '@/lib/api/client';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { APIKeyStatus, AuditLog } from '@/lib/types';

interface ModernAdminViewProps {
  currentUser: {
    id: string;
    role: string;
    name: string;
  };
}

export default function ModernAdminView({
  currentUser,
}: ModernAdminViewProps) {
  const { hasPermission } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] =
    useState<UserResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] =
    useState<UserResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] =
    useState<APIKeyStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [savingAiSettings, setSavingAiSettings] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers();
      setUsers(response.users);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred while loading users.';
      toast.error('Failed to load users', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAISettings = async () => {
    try {
      const settings = await api.admin.getAISettings();
      // setAiSettings(settings); // Removed unused state update
      setSelectedProvider(settings.defaultProvider || 'openai');

      const keyStatus = await api.admin.checkAPIKeys();
      setApiKeyStatus(keyStatus);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const response = await fetch(
        'http://localhost:4000/api/admin/audit-logs?limit=50',
        {
          headers: {
            Authorization: `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`,
          },
        }
      );
      if (response.ok) {
        const logs = await response.json();
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleSaveAISettings = async () => {
    try {
      setSavingAiSettings(true);
      await api.admin.updateAISettings({
        defaultProvider: selectedProvider,
      });
      toast.success('AI settings updated', {
        description: `Default provider set to ${selectedProvider}`,
      });
      loadAISettings();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save settings';
      toast.error('Failed to update AI settings', {
        description: message,
      });
    } finally {
      setSavingAiSettings(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAISettings();
    if (hasPermission('audit_logs:view')) {
      loadAuditLogs();
    }
  }, [currentUser.role, hasPermission]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await usersApi.deleteUser(userToDelete.id);
      toast.success('User deleted', {
        description: `${userToDelete.name} has been removed from the system.`,
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred while deleting the user.';
      toast.error('Failed to delete user', {
        description: message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeleteUser = (user: UserResponse) => {
    // Only CEO and ADMIN can delete
    if (!['CEO', 'ADMIN'].includes(currentUser.role)) return false;
    // Cannot delete yourself
    if (user.id === currentUser.id) return false;
    // Cannot delete CEO
    if (user.role === 'CEO') return false;
    // Only CEO can delete ADMIN
    if (user.role === 'ADMIN' && currentUser.role !== 'CEO')
      return false;
    return true;
  };

  const canEditUser = (user: UserResponse) => {
    // Cannot edit yourself through this interface
    if (user.id === currentUser.id) return false;

    if (currentUser.role === 'CEO') return true;
    if (currentUser.role === 'ADMIN') {
      return ['MANAGER', 'SALES'].includes(user.role);
    }
    if (currentUser.role === 'MANAGER') {
      // Can only edit own team members
      return (
        user.role === 'SALES' && user.managerId === currentUser.id
      );
    }
    return false;
  };

  const managers = users.filter((u) => u.role === 'MANAGER');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CEO':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SALES':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'MANAGER':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Administration
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage users, system settings, and AI configuration
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Active Users
                </p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.status === 'Active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  AI Provider
                </p>
                <Badge className="mt-1 bg-purple-600">
                  {selectedProvider.charAt(0).toUpperCase() +
                    selectedProvider.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Security
                </p>
                <Badge
                  variant="outline"
                  className="mt-1 text-green-600 border-green-200">
                  Enabled
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          {hasPermission('audit_logs:view') && (
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          )}
          <TabsTrigger value="teams" className="gap-2">
            <Users className="h-4 w-4" />
            Teams
          </TabsTrigger>
          {hasPermission('permissions:view') && (
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          )}
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage system users and their permissions
                </CardDescription>
              </div>
              {hasPermission('users:create') && (
                <Button
                  className="gap-2"
                  onClick={() => setCreateDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                          {user.id === currentUser.id && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getRoleBadge(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.teamName || '-'}
                          {user.manager && (
                            <div className="text-xs">
                              Reports to: {user.manager.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.status === 'Active'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canEditUser(user) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToUpdate(user);
                                  setUpdateDialogOpen(true);
                                }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteUser(user) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {!canEditUser(user) &&
                              !canDeleteUser(user) && (
                                <span className="text-xs text-muted-foreground px-2">
                                  -
                                </span>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <CreateUserDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onUserCreated={loadUsers}
          currentUserRole={currentUser.role}
          managers={managers}
        />

        <UpdateUserDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          onUserUpdated={loadUsers}
          user={userToUpdate}
          currentUserRole={currentUser.role}
          managers={managers}
        />

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{' '}
                <strong>{userToDelete?.name}</strong> (
                {userToDelete?.email}). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700">
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* AI Settings Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Provider Configuration
              </CardTitle>
              <CardDescription>
                Configure AI providers and manage API keys for
                intelligent features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Default AI Provider
                  </Label>
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anthropic">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span>Anthropic Claude</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="openai">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-green-600" />
                          <span>OpenAI GPT-4 (Recommended)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gemini">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <span>Google Gemini</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This provider will be used for all AI-powered
                    features
                  </p>
                  <Button
                    onClick={handleSaveAISettings}
                    disabled={savingAiSettings}
                    className="w-full mt-2">
                    {savingAiSettings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key Status
                  </h4>
                  <div className="space-y-2">
                    {apiKeyStatus ? (
                      Object.entries(apiKeyStatus).map(
                        ([provider, isValid]) => (
                          <Card
                            key={provider}
                            className={
                              isValid
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isValid ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-gray-400" />
                                  )}
                                  <div>
                                    <p className="font-medium text-sm">
                                      {provider
                                        .charAt(0)
                                        .toUpperCase() +
                                        provider.slice(1)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {isValid
                                        ? 'API key configured'
                                        : 'No API key configured'}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    isValid ? 'default' : 'secondary'
                                  }>
                                  {isValid ? 'Active' : 'Not Set'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        AI Features Available
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Lead risk analysis and scoring</li>
                        <li>• Client health monitoring</li>
                        <li>• Upsell opportunity detection</li>
                        <li>• Executive summary generation</li>
                        <li>• AI-powered chat assistant</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        {hasPermission('audit_logs:view') && (
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Audit Trail
                </CardTitle>
                <CardDescription>
                  Complete record of all system actions and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAuditLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {auditLogs.length} recent activity
                        logs
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAuditLogs}>
                        Refresh
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {auditLogs.map(
                        (log: AuditLog, index: number) => (
                          <Card
                            key={log.id || index}
                            className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-xs">
                                      {log.action}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(
                                        log.createdAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm mb-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {log.user?.name || log.userId}
                                    </span>
                                    {log.user?.email && (
                                      <span className="text-muted-foreground text-xs">
                                        ({log.user.email})
                                      </span>
                                    )}
                                    {log.user?.role && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs">
                                        {log.user.role}
                                      </Badge>
                                    )}
                                  </div>
                                  {log.details && (
                                    <details className="mt-2">
                                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                        View details
                                      </summary>
                                      <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                                        {JSON.stringify(
                                          log.details,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <TeamList
            managers={managers}
            currentUserRole={currentUser.role}
          />
        </TabsContent>

        {/* Permissions Tab */}
        {hasPermission('permissions:view') && (
          <TabsContent value="permissions" className="space-y-4">
            <PermissionsMatrix canEdit={hasPermission('permissions:edit')} />
          </TabsContent>
        )}

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Application version and system status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Version
                  </p>
                  <p className="text-lg font-semibold">v1.0.0</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Environment
                  </p>
                  <Badge variant="outline">Production</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Database
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    API Server
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Running</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <label className={className}>{children}</label>;
}
