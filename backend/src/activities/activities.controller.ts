import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService, CreateActivityDto } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads/:leadId/activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async createActivity(
    @Param('leadId') leadId: string,
    @Request() req,
    @Body() createActivityDto: CreateActivityDto,
  ) {
    return this.activitiesService.createActivity(
      leadId,
      req.user.id,
      createActivityDto,
    );
  }

  @Get()
  async getActivities(@Param('leadId') leadId: string) {
    return this.activitiesService.getActivitiesByLead(leadId);
  }

  @Delete(':activityId')
  async deleteActivity(
    @Param('activityId') activityId: string,
    @Request() req,
  ) {
    return this.activitiesService.deleteActivity(activityId, req.user.id);
  }
}

@Controller('clients/:clientId/activities')
@UseGuards(JwtAuthGuard)
export class ClientActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async createActivity(
    @Param('clientId') clientId: string,
    @Request() req,
    @Body() createActivityDto: CreateActivityDto,
  ) {
    return this.activitiesService.createActivityForClient(
      clientId,
      req.user.id,
      createActivityDto,
    );
  }

  @Get()
  async getActivities(@Param('clientId') clientId: string) {
    return this.activitiesService.getActivitiesByClient(clientId);
  }

  @Delete(':activityId')
  async deleteActivity(
    @Param('activityId') activityId: string,
    @Request() req,
  ) {
    return this.activitiesService.deleteActivity(activityId, req.user.id);
  }
}
