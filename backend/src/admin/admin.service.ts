import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private emailService: EmailService,
    private auditService: AuditService
  ) {}

  // ==================== Permission Validation Methods ====================

  /**
   * Check if current user can manage a user with the target role
   */
  private canManageUser(
    currentUserRole: string,
    targetUserRole: string
  ): boolean {
    // CEO can manage: CEO, ADMIN, MANAGER, SALES
    if (currentUserRole === 'CEO') return true;

    // ADMIN can manage: MANAGER, SALES (not CEO or other ADMIN)
    if (currentUserRole === 'ADMIN') {
      return ['MANAGER', 'SALES'].includes(targetUserRole);
    }

    // MANAGER can manage: SALES only (not CEO, ADMIN, or other MANAGER)
    if (currentUserRole === 'MANAGER') {
      return targetUserRole === 'SALES';
    }

    return false; // SALES cannot manage anyone
  }

  /**
   * Validate user creation permissions and requirements
   */
  private async validateUserCreation(
    currentUserId: string,
    currentUserRole: string,
    createDto: CreateUserDto
  ): Promise<void> {
    // Check if user can create this role
    if (!this.canManageUser(currentUserRole, createDto.role)) {
      throw new ForbiddenException(
        `${currentUserRole} users cannot create ${createDto.role} users`
      );
    }

    // Check if email is already taken
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // If creating SALES user, validate managerId
    if (createDto.role === 'SALES') {
      if (currentUserRole === 'MANAGER') {
        // Manager can only assign to themselves
        createDto.managerId = currentUserId;
      } else if (createDto.managerId) {
        // CEO/ADMIN must specify valid manager
        const manager = await this.prisma.user.findUnique({
          where: { id: createDto.managerId },
        });
        if (!manager || manager.role !== 'MANAGER') {
          throw new BadRequestException('Invalid manager ID');
        }
      } else {
        throw new BadRequestException(
          'SALES users must have a manager'
        );
      }
    }

    // Validate teamName or teamId requirements
    // Deprecating teamName in favor of teamId
    if (['MANAGER', 'SALES'].includes(createDto.role)) {
      if (!createDto.teamName && !createDto.teamId) {
        throw new BadRequestException(
          `${createDto.role} users must have a team assigned`
        );
      }

      // If teamId is provided, validate it exists
      if (createDto.teamId) {
        const team = await this.prisma.team.findUnique({
          where: { id: createDto.teamId },
        });
        if (!team) {
          throw new NotFoundException('Team not found');
        }
      }
    }
  }

  /**
   * Validate user update permissions
   */
  private async validateUserUpdate(
    currentUserId: string,
    currentUserRole: string,
    targetUserId: string,
    updateDto: UpdateUserDto
  ): Promise<any> {
    // Fetch target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Users cannot modify themselves through this endpoint
    if (currentUserId === targetUserId) {
      throw new ForbiddenException(
        'Use profile settings to update your own account'
      );
    }

    // Check permission to modify this user
    if (!this.canManageUser(currentUserRole, targetUser.role)) {
      throw new ForbiddenException(
        `You don't have permission to modify ${targetUser.role} users`
      );
    }

    // If role is being changed, validate new role
    if (updateDto.role && updateDto.role !== targetUser.role) {
      if (!this.canManageUser(currentUserRole, updateDto.role)) {
        throw new ForbiddenException(
          `You don't have permission to change users to ${updateDto.role} role`
        );
      }
    }

    // MANAGER can only modify their own team members
    if (currentUserRole === 'MANAGER') {
      if (targetUser.managerId !== currentUserId) {
        throw new ForbiddenException(
          'You can only modify your own team members'
        );
      }
    }

    // If teamId is being updated, validate it
    if (updateDto.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: updateDto.teamId },
      });
      if (!team) {
        throw new NotFoundException('Team not found');
      }
    }

    return targetUser;
  }

  /**
   * Generate secure temporary password
   */
  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }
    return password;
  }

  // ==================== User Management Methods ====================

  /**
   * Get all users (filtered by role hierarchy)
   */
  async getAllUsers(currentUserId: string, currentUserRole: string) {
    const where: any = {};

    // CEO/ADMIN see all users
    if (currentUserRole === 'CEO' || currentUserRole === 'ADMIN') {
      // No filter
    }
    // MANAGER sees only their team
    else if (currentUserRole === 'MANAGER') {
      where.OR = [
        { managerId: currentUserId },
        { id: currentUserId },
      ];
    }
    // SALES sees only themselves
    else if (currentUserRole === 'SALES') {
      where.id = currentUserId;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        teamName: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: { name: true, email: true },
        },
        teamMembers: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform result to include team name from relation if available, fallback to legacy teamName
    // This ensures frontend compatibility
    const usersWithTeam = users.map((user) => ({
      ...user,
      teamName: user.team?.name || user.teamName,
    }));

    return { users: usersWithTeam };
  }

  /**
   * Create a new user with hierarchical validation
   */
  async createUser(
    currentUserId: string,
    createUserDto: CreateUserDto
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Validate permissions
    await this.validateUserCreation(
      currentUserId,
      currentUser.role,
      createUserDto
    );

    // Generate secure temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        role: createUserDto.role,
        teamName: createUserDto.teamName, // Keep for backward compatibility if provided
        teamId: createUserDto.teamId,
        managerId: createUserDto.managerId,
        status: 'Active',
        isEmailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        teamName: true,
        teamId: true,
        team: {
          select: { id: true, name: true },
        },
        managerId: true,
        manager: {
          select: { name: true, email: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send welcome email with temp password (non-blocking)
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.name,
        tempPassword
      );
    } catch (error) {
      // Email failure should not block user creation
      console.error('Failed to send welcome email:', error);
    }

    // Log audit trail
    try {
      await this.auditService.log({
        userId: currentUserId,
        action: 'CREATE_USER',
        targetUserId: user.id,
        details: {
          role: user.role,
          email: user.email,
          teamName: user.teamName,
        },
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return {
      user,
      tempPassword, // Return for display
    };
  }

  /**
   * Update a user with hierarchical validation
   */
  async updateUser(
    currentUserId: string,
    targetUserId: string,
    updateUserDto: UpdateUserDto
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Validate permissions
    await this.validateUserUpdate(
      currentUserId,
      currentUser.role,
      targetUserId,
      updateUserDto
    );

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        teamName: true,
        teamId: true,
        team: {
          select: { id: true, name: true },
        },
        managerId: true,
        manager: {
          select: { name: true, email: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit trail
    try {
      await this.auditService.log({
        userId: currentUserId,
        action: 'UPDATE_USER',
        targetUserId: updatedUser.id,
        details: { updates: updateUserDto },
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return { user: updatedUser };
  }

  /**
   * Delete a user (CEO and ADMIN only)
   */
  async deleteUser(currentUserId: string, targetUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Cannot delete yourself
    if (currentUserId === targetUserId) {
      throw new ForbiddenException(
        'You cannot delete your own account'
      );
    }

    // Only CEO can delete ADMIN users
    if (targetUser.role === 'CEO') {
      throw new ForbiddenException('CEO users cannot be deleted');
    }

    if (targetUser.role === 'ADMIN' && currentUser.role !== 'CEO') {
      throw new ForbiddenException('Only CEO can delete ADMIN users');
    }

    // Check if user has team members
    if (targetUser.role === 'MANAGER') {
      const teamMembers = await this.prisma.user.count({
        where: { managerId: targetUserId },
      });
      if (teamMembers > 0) {
        throw new BadRequestException(
          'Cannot delete manager with active team members. Please reassign team members first.'
        );
      }
    }

    await this.prisma.user.delete({
      where: { id: targetUserId },
    });

    // Log audit trail
    try {
      await this.auditService.log({
        userId: currentUserId,
        action: 'DELETE_USER',
        targetUserId: targetUserId,
        details: {
          deletedEmail: targetUser.email,
          deletedRole: targetUser.role,
          deletedName: targetUser.name,
        },
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }

    return { message: 'User deleted successfully' };
  }

  // ==================== AI Settings Methods ====================

  async getAISettings() {
    let settings = await this.prisma.aISettings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await this.prisma.aISettings.create({
        data: {
          defaultProvider: 'anthropic',
          anthropicKeyValid: !!this.config.get('ANTHROPIC_API_KEY'),
          openaiKeyValid: !!this.config.get('OPENAI_API_KEY'),
          geminiKeyValid: !!this.config.get('GEMINI_API_KEY'),
        },
      });
    }

    return settings;
  }

  async updateAISettings(data: any) {
    const existing = await this.prisma.aISettings.findFirst();

    if (existing) {
      return this.prisma.aISettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      return this.prisma.aISettings.create({
        data,
      });
    }
  }

  async checkAPIKeys() {
    return {
      anthropic: !!this.config.get('ANTHROPIC_API_KEY'),
      openai: !!this.config.get('OPENAI_API_KEY'),
      gemini: !!this.config.get('GEMINI_API_KEY'),
    };
  }
}
