import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectsService, CreateProjectDto, UpdateProjectDto } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Create a new project
   */
  @Post()
  @Roles('CEO', 'ADMIN', 'MANAGER', 'SALES')
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user?.id);
  }

  /**
   * Get all projects for a client
   */
  @Get('client/:clientId')
  @Roles('CEO', 'ADMIN', 'MANAGER', 'SALES')
  findByClient(@Param('clientId') clientId: string) {
    return this.projectsService.findByClient(clientId);
  }

  /**
   * Get a single project
   */
  @Get(':id')
  @Roles('CEO', 'ADMIN', 'MANAGER', 'SALES')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  /**
   * Update a project
   */
  @Patch(':id')
  @Roles('CEO', 'ADMIN', 'MANAGER', 'SALES')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.update(id, updateProjectDto, user?.id);
  }

  /**
   * Delete a project
   */
  @Delete(':id')
  @Roles('CEO', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.remove(id, user?.id);
  }

  /**
   * Convert a won lead to a project
   */
  @Post('convert-lead/:leadId')
  @Roles('CEO', 'ADMIN', 'MANAGER', 'SALES')
  convertLead(
    @Param('leadId') leadId: string,
    @Body() body: { clientId: string; projectManagerId?: string },
  ) {
    return this.projectsService.convertLead(leadId, body.clientId, body.projectManagerId);
  }
}
