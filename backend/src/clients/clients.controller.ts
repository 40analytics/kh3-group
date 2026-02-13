import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../permissions/permissions.decorator';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Permissions('clients:view')
  findAll(@CurrentUser() user: any) {
    return this.clientsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @Permissions('clients:view')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientsService.findOne(id, user.id, user.role);
  }

  @Post()
  @Permissions('clients:create')
  create(@Body() createClientDto: any, @CurrentUser() user: any) {
    return this.clientsService.create(createClientDto, user?.id);
  }

  @Patch(':id')
  @Permissions('clients:edit')
  update(@Param('id') id: string, @Body() updateClientDto: any, @CurrentUser() user: any) {
    return this.clientsService.update(id, updateClientDto, user?.id);
  }

  @Delete(':id')
  @Permissions('clients:delete')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientsService.remove(id, user?.id);
  }

  @Post(':id/health')
  @Permissions('clients:health')
  generateHealthReport(
    @Param('id') id: string,
    @Body() body: { provider?: string },
  ) {
    return this.clientsService.generateHealthReport(id, body.provider);
  }

  @Post(':id/upsell')
  @Permissions('clients:upsell')
  generateUpsellStrategy(
    @Param('id') id: string,
    @Body() body: { provider?: string },
  ) {
    return this.clientsService.generateUpsellStrategy(id, body.provider);
  }

  @Post(':id/health/auto-update')
  @Permissions('clients:health')
  updateHealthStatus(
    @Param('id') id: string,
    @Body() body: { provider?: string },
  ) {
    return this.clientsService.updateHealthStatus(id, body.provider);
  }

  @Post(':id/health/override')
  @Permissions('clients:health')
  overrideHealthStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason: string },
    @CurrentUser() user: any,
  ) {
    return this.clientsService.overrideHealthStatus(
      id,
      body.status,
      body.reason,
      user.id,
    );
  }

  @Post('convert-lead/:leadId')
  @Permissions('clients:convert')
  convertLead(
    @Param('leadId') leadId: string,
    @Body() body: { accountManagerId?: string; projectManagerId?: string },
  ) {
    return this.clientsService.convertLeadToClient(
      leadId,
      body.accountManagerId,
      body.projectManagerId,
    );
  }
}
