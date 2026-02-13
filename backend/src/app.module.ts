import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LeadsModule } from './leads/leads.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { ActivitiesModule } from './activities/activities.module';
import { StorageModule } from './storage/storage.module';
import { FilesModule } from './files/files.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './permissions/permissions.guard';
import { PermissionsModule } from './permissions/permissions.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StorageModule,
    HealthModule,
    AuthModule,
    EmailModule,
    AuditModule,
    ActivitiesModule,
    FilesModule,
    DashboardModule,
    LeadsModule,
    ClientsModule,
    ProjectsModule,
    AiModule,
    AdminModule,
    TeamsModule,
    PermissionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
