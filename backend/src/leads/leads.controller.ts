import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../permissions/permissions.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Permissions('leads:view')
  findAll(@CurrentUser() user: any) {
    return this.leadsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @Permissions('leads:view')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.findOne(id, user.id, user.role);
  }

  @Post()
  @Permissions('leads:create')
  create(@Body() createLeadDto: any, @CurrentUser() user: any) {
    return this.leadsService.create(createLeadDto, user?.id);
  }

  @Patch(':id')
  @Permissions('leads:edit')
  update(@Param('id') id: string, @Body() updateLeadDto: any, @CurrentUser() user: any) {
    return this.leadsService.update(id, updateLeadDto, user?.id);
  }

  @Delete(':id')
  @Permissions('leads:delete')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.remove(id, user?.id);
  }

  @Post(':id/analyze')
  @Permissions('leads:analyze')
  analyzeRisk(
    @Param('id') id: string,
    @Body() body: { provider?: string },
  ) {
    return this.leadsService.analyzeRisk(id, body.provider);
  }

  @Post(':id/summary')
  @Permissions('leads:analyze')
  generateAISummary(
    @Param('id') id: string,
    @Body() body: { provider?: string },
  ) {
    return this.leadsService.generateAISummary(id, body.provider);
  }
}
