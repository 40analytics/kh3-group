import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from './permissions.constants';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);
  private cache = new Map<string, Set<string>>();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
    await this.refreshCache();
  }

  async hasPermission(role: string, permission: string): Promise<boolean> {
    // CEO always has all permissions
    if (role === 'CEO') return true;

    const rolePerms = this.cache.get(role);
    return rolePerms ? rolePerms.has(permission) : false;
  }

  async getPermissionsForRole(role: string): Promise<string[]> {
    if (role === 'CEO') {
      return ALL_PERMISSIONS.map((p) => p.key);
    }

    const rolePerms = this.cache.get(role);
    return rolePerms ? Array.from(rolePerms) : [];
  }

  async getMatrix() {
    const roles = ['CEO', 'ADMIN', 'MANAGER', 'SALES'];
    const matrix: Record<string, string[]> = {};

    for (const role of roles) {
      matrix[role] = await this.getPermissionsForRole(role);
    }

    return {
      permissions: ALL_PERMISSIONS,
      roles,
      matrix,
    };
  }

  async updateRolePermissions(
    role: string,
    permissions: string[],
  ): Promise<void> {
    // Validate permission keys
    const validKeys = new Set(ALL_PERMISSIONS.map((p) => p.key));
    const filtered = permissions.filter((p) => validKeys.has(p));

    // Delete existing permissions for this role
    await this.prisma.rolePermission.deleteMany({
      where: { role },
    });

    // Insert new permissions
    if (filtered.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: filtered.map((permission) => ({ role, permission })),
      });
    }

    // Refresh cache
    await this.refreshCache();
  }

  private async seedDefaults(): Promise<void> {
    const count = await this.prisma.rolePermission.count();
    if (count > 0) {
      this.logger.log('Role permissions already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding default role permissions...');
    const data: { role: string; permission: string }[] = [];

    for (const [role, permissions] of Object.entries(
      DEFAULT_ROLE_PERMISSIONS,
    )) {
      // Skip CEO - hardcoded to have all permissions
      if (role === 'CEO') continue;
      for (const permission of permissions) {
        data.push({ role, permission });
      }
    }

    await this.prisma.rolePermission.createMany({ data });
    this.logger.log(`Seeded ${data.length} default role permissions.`);
  }

  private async refreshCache(): Promise<void> {
    const allPerms = await this.prisma.rolePermission.findMany();
    this.cache.clear();

    for (const rp of allPerms) {
      if (!this.cache.has(rp.role)) {
        this.cache.set(rp.role, new Set());
      }
      this.cache.get(rp.role)!.add(rp.permission);
    }

    this.logger.log(
      `Permissions cache refreshed: ${allPerms.length} entries for ${this.cache.size} roles.`,
    );
  }
}
