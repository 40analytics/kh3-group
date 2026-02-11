import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateProjectDto {
  name: string;
  clientId: string;
  leadId?: string;
  status: string;
  value: number;
  startDate?: Date;
  completedDate?: Date;
  description?: string;
  projectManagerId?: string;
}

export interface UpdateProjectDto {
  name?: string;
  status?: string;
  value?: number;
  startDate?: Date;
  completedDate?: Date;
  description?: string;
  projectManagerId?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new project
   */
  async create(createProjectDto: CreateProjectDto, userId?: string) {
    const { clientId, leadId, status, ...projectData } = createProjectDto;

    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // If leadId provided, verify it exists
    if (leadId) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new NotFoundException(`Lead with ID ${leadId} not found`);
      }
    }

    // Create project
    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        clientId,
        leadId: leadId || null,
        status,
      },
      include: {
        client: true,
        lead: true,
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update client project counts
    await this.updateClientProjectCounts(clientId);

    // Audit log
    await this.auditService.log({
      userId: createProjectDto.projectManagerId || userId || 'system',
      action: 'CREATE_PROJECT',
      details: {
        projectId: project.id,
        projectName: project.name,
        clientId: project.clientId,
        clientName: client.name,
        value: project.value,
        status: project.status,
      },
    });

    return project;
  }

  /**
   * Get all projects for a client
   */
  async findByClient(clientId: string) {
    return this.prisma.project.findMany({
      where: { clientId },
      include: {
        projectManager: {
          select: { id: true, name: true, email: true },
        },
        lead: {
          select: { id: true, contactName: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single project by ID
   */
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        lead: true,
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  /**
   * Update a project
   */
  async update(id: string, updateProjectDto: UpdateProjectDto, userId?: string) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        client: true,
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update client project counts if status changed
    if (updateProjectDto.status && updateProjectDto.status !== existingProject.status) {
      await this.updateClientProjectCounts(existingProject.clientId);
    }

    // Audit log
    await this.auditService.log({
      userId: userId || 'system',
      action: 'UPDATE_PROJECT',
      details: {
        projectId: id,
        projectName: project.name,
        updates: updateProjectDto,
      },
    });

    return project;
  }

  /**
   * Delete a project
   */
  async remove(id: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: { name: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    await this.prisma.project.delete({
      where: { id },
    });

    // Update client project counts
    await this.updateClientProjectCounts(project.clientId);

    // Audit log
    await this.auditService.log({
      userId: userId || 'system',
      action: 'DELETE_PROJECT',
      details: {
        projectId: id,
        projectName: project.name,
        clientId: project.clientId,
        clientName: project.client?.name,
        value: project.value,
      },
    });

    return { message: 'Project deleted successfully' };
  }

  /**
   * Convert a won lead to a project
   */
  async convertLead(leadId: string, clientId: string, projectManagerId?: string) {
    // Verify lead exists and is Won
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    if (lead.stage !== 'Won') {
      throw new BadRequestException('Only Won leads can be converted to projects');
    }

    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Check if project already exists for this lead
    const existingProject = await this.prisma.project.findFirst({
      where: { leadId },
    });

    if (existingProject) {
      throw new BadRequestException('A project already exists for this lead');
    }

    // Create project from lead
    const project = await this.prisma.project.create({
      data: {
        name: `${lead.company} - ${lead.serviceType || 'Project'}`,
        clientId,
        leadId,
        status: 'Planning',
        value: lead.value,
        description: lead.notes || undefined,
        projectManagerId: projectManagerId || lead.assignedToId || undefined,
      },
      include: {
        client: true,
        lead: true,
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update lead to mark it as converted
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { convertedToClientId: clientId },
    });

    // Update client project counts
    await this.updateClientProjectCounts(clientId);

    return project;
  }

  /**
   * Update client's project counts
   */
  private async updateClientProjectCounts(clientId: string) {
    const projects = await this.prisma.project.findMany({
      where: { clientId },
    });

    const totalProjectCount = projects.length;
    const activeProjectCount = projects.filter(
      (p) => p.status === 'Active' || p.status === 'Planning'
    ).length;

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        totalProjectCount,
        activeProjectCount,
      },
    });
  }
}
