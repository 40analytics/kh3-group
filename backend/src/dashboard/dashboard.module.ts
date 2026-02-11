import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, AiService],
  exports: [DashboardService],
})
export class DashboardModule {}
