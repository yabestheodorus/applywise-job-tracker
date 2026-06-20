import { BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_CV_MIMES = [PDF_MIME, DOCX_MIME];

/** Parse a pdf/docx upload to plain text. Throws 400 for unsupported types. */
export async function parseCvToText(file: {
  mimetype: string;
  buffer: Buffer;
}): Promise<string> {
  if (file.mimetype === PDF_MIME) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const { text } = await parser.getText();
      return text;
    } finally {
      await parser.destroy();
    }
  }
  if (file.mimetype === DOCX_MIME) {
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    return value;
  }
  throw new BadRequestException('Only PDF and DOCX files are supported.');
}
