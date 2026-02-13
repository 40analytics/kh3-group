'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { permissionsApi, type PermissionDefinition } from '@/lib/api/permissions-client';

interface PermissionsMatrixProps {
  canEdit: boolean;
}

export function PermissionsMatrix({ canEdit }: PermissionsMatrixProps) {
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [originalMatrix, setOriginalMatrix] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadMatrix = useCallback(async () => {
    try {
      setLoading(true);
      const data = await permissionsApi.getMatrix();
      setPermissions(data.permissions);
      setRoles(data.roles);
      setMatrix(data.matrix);
      setOriginalMatrix(JSON.parse(JSON.stringify(data.matrix)));
    } catch (error) {
      toast.error('Failed to load permissions matrix');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const togglePermission = (role: string, permKey: string) => {
    if (role === 'CEO' || !canEdit) return;

    setMatrix((prev) => {
      const rolePerms = prev[role] || [];
      const has = rolePerms.includes(permKey);
      return {
        ...prev,
        [role]: has
          ? rolePerms.filter((p) => p !== permKey)
          : [...rolePerms, permKey],
      };
    });
  };

  const isDirty = (role: string) => {
    const current = [...(matrix[role] || [])].sort();
    const original = [...(originalMatrix[role] || [])].sort();
    return JSON.stringify(current) !== JSON.stringify(original);
  };

  const saveRole = async (role: string) => {
    try {
      setSaving(role);
      await permissionsApi.updateRolePermissions(role, matrix[role] || []);
      setOriginalMatrix((prev) => ({
        ...prev,
        [role]: [...(matrix[role] || [])],
      }));
      toast.success(`${role} permissions saved`);
    } catch (error) {
      toast.error(`Failed to save ${role} permissions`);
    } finally {
      setSaving(null);
    }
  };

  // Group permissions by module
  const modules = permissions.reduce<Record<string, PermissionDefinition[]>>(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {},
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CEO': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MANAGER': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'SALES': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Calculate column width percentages: permission label gets ~30%, rest split evenly
  const roleColWidth = `${Math.floor(70 / roles.length)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-600" />
          Role Permissions Matrix
        </CardTitle>
        <CardDescription>
          Configure what each role can access. CEO always has all permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: '30%' }} />
              {roles.map((role) => (
                <col key={role} style={{ width: roleColWidth }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-3 font-medium">Permission</th>
                {roles.map((role) => (
                  <th key={role} className="py-3 px-2">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className={getRoleColor(role)}>
                        {role}
                      </Badge>
                      {role !== 'CEO' && canEdit && isDirty(role) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={saving === role}
                          onClick={() => saveRole(role)}
                        >
                          {saving === role ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          Save
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(modules).map(([moduleName, modulePerms]) => (
                <Fragment key={moduleName}>
                  <tr className="bg-muted/50">
                    <td
                      colSpan={roles.length + 1}
                      className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {moduleName}
                    </td>
                  </tr>
                  {modulePerms.map((perm) => (
                    <tr key={perm.key} className="border-b border-muted/30 hover:bg-muted/20">
                      <td className="py-2.5 px-3 text-sm">{perm.label}</td>
                      {roles.map((role) => {
                        const checked = (matrix[role] || []).includes(perm.key);
                        const isCeo = role === 'CEO';
                        return (
                          <td key={`${role}-${perm.key}`} className="py-2.5 px-2">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isCeo ? true : checked}
                                disabled={isCeo || !canEdit}
                                onCheckedChange={() => togglePermission(role, perm.key)}
                                className={isCeo ? 'opacity-50' : ''}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
