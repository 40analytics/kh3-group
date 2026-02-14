import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

@Injectable()
export class PipelineService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pipelineStage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: CreateStageDto) {
    // Auto-assign sortOrder if not provided
    if (dto.sortOrder === undefined) {
      const maxOrder = await this.prisma.pipelineStage.aggregate({
        _max: { sortOrder: true },
      });
      dto.sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    }

    return this.prisma.pipelineStage.create({
      data: {
        name: dto.name,
        color: dto.color,
        lightColor: dto.lightColor,
        border: dto.border,
        probability: dto.probability,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async update(id: string, dto: UpdateStageDto) {
    const stage = await this.prisma.pipelineStage.findUnique({ where: { id } });
    if (!stage) {
      throw new BadRequestException('Stage not found');
    }

    return this.prisma.pipelineStage.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const stage = await this.prisma.pipelineStage.findUnique({ where: { id } });
    if (!stage) {
      throw new BadRequestException('Stage not found');
    }

    if (stage.isSystem) {
      throw new BadRequestException('System stages (Won/Lost) cannot be deleted');
    }

    // Check if any leads are in this stage
    const leadsInStage = await this.prisma.lead.count({
      where: { stage: stage.name },
    });

    if (leadsInStage > 0) {
      throw new BadRequestException(
        `Cannot delete stage "${stage.name}" — ${leadsInStage} lead(s) are currently in this stage`,
      );
    }

    return this.prisma.pipelineStage.delete({ where: { id } });
  }

  async reorder(dto: ReorderStagesDto) {
    const updates = dto.stages.map((s) =>
      this.prisma.pipelineStage.update({
        where: { id: s.id },
        data: { sortOrder: s.sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAll();
  }
}
