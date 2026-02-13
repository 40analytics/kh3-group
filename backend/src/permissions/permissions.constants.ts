export interface PermissionDefinition {
  key: string;
  label: string;
  module: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Leads
  { key: 'leads:view', label: 'View Leads', module: 'Leads' },
  { key: 'leads:create', label: 'Create Leads', module: 'Leads' },
  { key: 'leads:edit', label: 'Edit Leads', module: 'Leads' },
  { key: 'leads:delete', label: 'Delete Leads', module: 'Leads' },
  { key: 'leads:analyze', label: 'Analyze Leads (AI)', module: 'Leads' },

  // Clients
  { key: 'clients:view', label: 'View Clients', module: 'Clients' },
  { key: 'clients:create', label: 'Create Clients', module: 'Clients' },
  { key: 'clients:edit', label: 'Edit Clients', module: 'Clients' },
  { key: 'clients:delete', label: 'Delete Clients', module: 'Clients' },
  { key: 'clients:health', label: 'Health Reports (AI)', module: 'Clients' },
  { key: 'clients:upsell', label: 'Upsell Strategy (AI)', module: 'Clients' },
  { key: 'clients:convert', label: 'Convert Leads to Clients', module: 'Clients' },

  // Projects
  { key: 'projects:view', label: 'View Projects', module: 'Projects' },
  { key: 'projects:create', label: 'Create Projects', module: 'Projects' },
  { key: 'projects:edit', label: 'Edit Projects', module: 'Projects' },
  { key: 'projects:delete', label: 'Delete Projects', module: 'Projects' },

  // Teams
  { key: 'teams:view', label: 'View Teams', module: 'Teams' },
  { key: 'teams:create', label: 'Create Teams', module: 'Teams' },
  { key: 'teams:edit', label: 'Edit Teams', module: 'Teams' },
  { key: 'teams:delete', label: 'Delete Teams', module: 'Teams' },
  { key: 'teams:manage_members', label: 'Manage Team Members', module: 'Teams' },

  // Users
  { key: 'users:view', label: 'View Users', module: 'Users' },
  { key: 'users:create', label: 'Create Users', module: 'Users' },
  { key: 'users:edit', label: 'Edit Users', module: 'Users' },
  { key: 'users:delete', label: 'Delete Users', module: 'Users' },

  // Dashboard
  { key: 'dashboard:view', label: 'View Dashboard', module: 'Dashboard' },

  // AI Settings
  { key: 'ai_settings:view', label: 'View AI Settings', module: 'AI Settings' },
  { key: 'ai_settings:edit', label: 'Edit AI Settings', module: 'AI Settings' },

  // Audit Logs
  { key: 'audit_logs:view', label: 'View Audit Logs', module: 'Audit Logs' },

  // Permissions
  { key: 'permissions:view', label: 'View Permissions', module: 'Permissions' },
  { key: 'permissions:edit', label: 'Edit Permissions', module: 'Permissions' },
];

// Default permissions matching current hardcoded behavior
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  CEO: ALL_PERMISSIONS.map((p) => p.key), // CEO gets everything
  ADMIN: [
    'leads:view', 'leads:create', 'leads:edit', 'leads:delete', 'leads:analyze',
    'clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'clients:health', 'clients:upsell', 'clients:convert',
    'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
    'teams:view', 'teams:create', 'teams:edit', 'teams:delete', 'teams:manage_members',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'dashboard:view',
    'ai_settings:view', 'ai_settings:edit',
    'audit_logs:view',
    'permissions:view',
  ],
  MANAGER: [
    'leads:view', 'leads:create', 'leads:edit', 'leads:analyze',
    'clients:view', 'clients:create', 'clients:edit', 'clients:health', 'clients:upsell', 'clients:convert',
    'projects:view', 'projects:create', 'projects:edit',
    'teams:view', 'teams:manage_members',
    'users:view', 'users:create', 'users:edit',
    'ai_settings:view',
  ],
  SALES: [
    'leads:view', 'leads:create', 'leads:edit', 'leads:analyze',
    'clients:view', 'clients:create', 'clients:edit', 'clients:health', 'clients:upsell', 'clients:convert',
    'projects:view', 'projects:create', 'projects:edit',
    'teams:view',
    'ai_settings:view',
  ],
};
