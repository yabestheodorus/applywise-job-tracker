import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { updateProfileSchema, type UpdateProfileInput } from '@repo/api';

import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ACCEPTED_CV_MIMES, MAX_CV_BYTES } from './cv-parser';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) { }

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.profile.getOrCreate(userId);
  }

  @Patch()
  update(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileInput,
  ) {
    return this.profile.update(userId, dto);
  }

  /** Multipart upload (field `file`) → parse text → Groq → review draft. */
  @Post('cv')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CV_BYTES } }))
  extractCv(
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (!ACCEPTED_CV_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and DOCX files are supported.');
    }
    return this.profile.extractFromCv(userId, file);
  }
}
