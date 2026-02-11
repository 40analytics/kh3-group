import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads/:leadId/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(
    @Param('leadId') leadId: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.filesService.uploadFile(
      leadId,
      req.user.id,
      file,
      category || 'other',
    );
  }

  @Get()
  async getFiles(@Param('leadId') leadId: string) {
    return this.filesService.getFilesByLead(leadId);
  }

  @Get(':fileId')
  async getFile(@Param('fileId') fileId: string) {
    return this.filesService.getFileById(fileId);
  }

  @Get(':fileId/download')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType, originalName } = await this.filesService.getFileStream(fileId);

    // Set response headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);

    // Handle stream errors
    stream.on('error', (err: any) => {
      if (err.code === 404) {
        return res.status(404).send('File not found in storage');
      }
      console.error('Stream error:', err);
      return res.status(500).send('Error streaming file');
    });

    // Pipe the GCS stream to the response
    stream.pipe(res);
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string, @Request() req) {
    return this.filesService.deleteFile(fileId, req.user.id);
  }
}

@Controller('clients/:clientId/files')
@UseGuards(JwtAuthGuard)
export class ClientFilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(
    @Param('clientId') clientId: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.filesService.uploadFileForClient(
      clientId,
      req.user.id,
      file,
      category || 'other',
    );
  }

  @Get()
  async getFiles(@Param('clientId') clientId: string) {
    return this.filesService.getFilesByClient(clientId);
  }

  @Get(':fileId')
  async getFile(@Param('fileId') fileId: string) {
    return this.filesService.getFileById(fileId);
  }

  @Get(':fileId/download')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType, originalName } = await this.filesService.getFileStream(fileId);

    // Set response headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);

    // Handle stream errors
    stream.on('error', (err: any) => {
      if (err.code === 404) {
        return res.status(404).send('File not found in storage');
      }
      console.error('Stream error:', err);
      return res.status(500).send('Error streaming file');
    });

    // Pipe the GCS stream to the response
    stream.pipe(res);
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string, @Request() req) {
    return this.filesService.deleteFile(fileId, req.user.id);
  }
}
