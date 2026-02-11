import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('users')
  @Roles('CEO', 'ADMIN', 'MANAGER')
  async getAllUsers(@Request() req) {
    return this.adminService.getAllUsers(req.user.id, req.user.role);
  }

  @Post('users')
  @Roles('CEO', 'ADMIN', 'MANAGER')
  async createUser(@Request() req, @Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(req.user.id, createUserDto);
  }

  @Patch('users/:id')
  @Roles('CEO', 'ADMIN', 'MANAGER')
  async updateUser(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(req.user.id, id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles('CEO', 'ADMIN')
  async deleteUser(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteUser(req.user.id, id);
  }

  @Get('ai-settings')
  @Roles('CEO', 'ADMIN')
  getAISettings() {
    return this.adminService.getAISettings();
  }

  @Patch('ai-settings')
  @Roles('CEO', 'ADMIN')
  updateAISettings(@Body() updateSettingsDto: any) {
    return this.adminService.updateAISettings(updateSettingsDto);
  }

  @Get('api-keys/status')
  @Roles('CEO', 'ADMIN')
  checkAPIKeys() {
    return this.adminService.checkAPIKeys();
  }

  /**
   * Get all audit logs with optional filters
   * CEO and ADMIN only
   */
  @Get('audit-logs')
  @Roles('CEO', 'ADMIN')
  async getAllAuditLogs(
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit: string = '100',
  ) {
    if (action) {
      return this.auditService.getLogsByAction(action, parseInt(limit));
    }
    if (userId) {
      return this.auditService.getLogsForUser(userId, parseInt(limit));
    }
    return this.auditService.getAllLogs(parseInt(limit));
  }

  /**
   * Get audit logs for a specific user
   * CEO and ADMIN only
   */
  @Get('audit-logs/user/:userId')
  @Roles('CEO', 'ADMIN')
  async getAuditLogsByUser(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '100',
  ) {
    return this.auditService.getLogsForUser(userId, parseInt(limit));
  }

  /**
   * Get audit logs by action type
   * CEO and ADMIN only
   */
  @Get('audit-logs/action/:action')
  @Roles('CEO', 'ADMIN')
  async getAuditLogsByAction(
    @Param('action') action: string,
    @Query('limit') limit: string = '100',
  ) {
    return this.auditService.getLogsByAction(action, parseInt(limit));
  }
}
