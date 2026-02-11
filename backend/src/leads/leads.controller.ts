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

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.leadsService.findAll(user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.findOne(id, user.id, user.role);
  }

  @Post()
  create(@Body() createLeadDto: any, @CurrentUser() user: any) {
    return this.leadsService.create(createLeadDto, user?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: any, @CurrentUser() user: any) {
    return this.leadsService.update(id, updateLeadDto, user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.remove(id, user?.id);
  }

  @Post(':id/analyze')
  analyzeRisk(
    @Param('id') id: string,
    @Body() body: { provider?: string },
  ) {
    return this.leadsService.analyzeRisk(id, body.provider);
  }

  @Post(':id/summary')
  generateAISummary(
    @Param('id') id: string,
    @Body() body: { provider?: string },
  ) {
    return this.leadsService.generateAISummary(id, body.provider);
  }
}
