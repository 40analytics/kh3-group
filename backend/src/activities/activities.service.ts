import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateActivityDto {
  type: 'call' | 'note' | 'status_change' | 'email' | 'meeting';
  content: string;
  metadata?: any;
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async createActivity(
    leadId: string,
    userId: string,
    createActivityDto: CreateActivityDto,
  ) {
    return this.prisma.activity.create({
      data: {
        leadId,
        userId,
        type: createActivityDto.type,
        content: createActivityDto.content,
        metadata: createActivityDto.metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getActivitiesByLead(leadId: string) {
    return this.prisma.activity.findMany({
      where: { leadId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteActivity(activityId: string, userId: string) {
    // Verify the activity belongs to the user
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (activity.userId !== userId) {
      throw new Error('You can only delete your own activities');
    }

    return this.prisma.activity.delete({
      where: { id: activityId },
    });
  }

  // ==================== CLIENT ACTIVITIES ====================

  async createActivityForClient(
    clientId: string,
    userId: string,
    createActivityDto: CreateActivityDto,
  ) {
    const activity = await this.prisma.activity.create({
      data: {
        clientId,
        userId,
        type: createActivityDto.type,
        content: createActivityDto.content,
        metadata: createActivityDto.metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update client's lastContactDate
    await this.prisma.client.update({
      where: { id: clientId },
      data: { lastContactDate: new Date() },
    });

    return activity;
  }

  async getActivitiesByClient(clientId: string) {
    return this.prisma.activity.findMany({
      where: { clientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
