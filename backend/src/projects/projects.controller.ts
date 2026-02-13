import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../permissions/permissions.decorator';
import { ProjectsService, CreateProjectDto, UpdateProjectDto } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Permissions('projects:create')
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user?.id);
  }

  @Get('client/:clientId')
  @Permissions('projects:view')
  findByClient(@Param('clientId') clientId: string) {
    return this.projectsService.findByClient(clientId);
  }

  @Get(':id')
  @Permissions('projects:view')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('projects:edit')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.update(id, updateProjectDto, user?.id);
  }

  @Delete(':id')
  @Permissions('projects:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.remove(id, user?.id);
  }

  @Post('convert-lead/:leadId')
  @Permissions('projects:create')
  convertLead(
    @Param('leadId') leadId: string,
    @Body() body: { clientId: string; projectManagerId?: string },
  ) {
    return this.projectsService.convertLead(leadId, body.clientId, body.projectManagerId);
  }
}
