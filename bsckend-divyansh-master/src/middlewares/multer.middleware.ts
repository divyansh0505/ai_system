import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

import { config } from '../../config';
import { MuttonResponder } from '../controllers/mutton.response';
import logger from '../utils/logger';

const POWERPOINT_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const PDF_MIME_TYPE = 'application/pdf';

const storage = multer.memoryStorage();

interface UploadConfig {
  mimeTypes?: string[];
  extensions?: string[];
  maxFileSize: number;
  fieldName: string;
  errorMessage: string;
}

const createUpload = (uploadConfig: UploadConfig) => {
  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback,
  ) => {
    const mimeMatch = uploadConfig.mimeTypes?.includes(file.mimetype);
    const extMatch = uploadConfig.extensions?.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext),
    );

    if (mimeMatch || extMatch) {
      callback(null, true);
    } else {
      callback(new Error(uploadConfig.errorMessage));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: uploadConfig.maxFileSize },
  }).single(uploadConfig.fieldName);
};

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/x-wav',
];
const KNOWLEDGE_BASE_MIME_TYPES = [POWERPOINT_MIME_TYPE, PDF_MIME_TYPE];
const KNOWLEDGE_BASE_EXTENSIONS = ['.pptx', '.pdf'];

export class MulterMiddleware {
  static powerpoint(req: Request, res: Response, next: NextFunction) {
    const upload = createUpload({
      mimeTypes: [POWERPOINT_MIME_TYPE],
      extensions: ['.pptx'],
      maxFileSize: config.upload.powerpointMaxFileSize,
      fieldName: 'powerpointFile',
      errorMessage: 'Only PowerPoint files are allowed',
    });

    upload(req, res, (err) => {
      if (err) {
        MulterMiddleware.handleError(err, res);
        return;
      }
      next();
    });
  }

  static powerpointWithKnowledgeBase(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const upload = multer({
      storage,
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        callback: multer.FileFilterCallback,
      ) => {
        if (file.fieldname === 'powerpointFile') {
          const mimeMatch =
            file.mimetype === POWERPOINT_MIME_TYPE ||
            file.mimetype === PDF_MIME_TYPE;
          const extMatch =
            file.originalname.toLowerCase().endsWith('.pptx') ||
            file.originalname.toLowerCase().endsWith('.pdf');

          if (mimeMatch || extMatch) {
            callback(null, true);
          } else {
            callback(new Error('Only PowerPoint or PDF files are allowed'));
          }
        } else if (file.fieldname === 'knowledgeBaseFile') {
          const mimeMatch = KNOWLEDGE_BASE_MIME_TYPES.includes(file.mimetype);
          const extMatch = KNOWLEDGE_BASE_EXTENSIONS.some((ext) =>
            file.originalname.toLowerCase().endsWith(ext),
          );

          if (mimeMatch || extMatch) {
            callback(null, true);
          } else {
            callback(
              new Error(
                'Only PowerPoint or PDF files are allowed for knowledge base',
              ),
            );
          }
        } else {
          callback(new Error('Unexpected field'));
        }
      },
      limits: { fileSize: config.upload.powerpointMaxFileSize },
    }).fields([
      { name: 'powerpointFile', maxCount: 1 },
      { name: 'knowledgeBaseFile', maxCount: 1 },
    ]);

    upload(req, res, (err) => {
      if (err) {
        MulterMiddleware.handleError(err, res);
        return;
      }
      next();
    });
  }

  static image(req: Request, res: Response, next: NextFunction) {
    const upload = createUpload({
      mimeTypes: IMAGE_MIME_TYPES,
      extensions: ['.jpg', '.jpeg', '.png', '.webp'],
      maxFileSize: config.upload.imageMaxFileSize,
      fieldName: 'imageFile',
      errorMessage: 'Only image files (JPEG, PNG, WebP) are allowed',
    });

    upload(req, res, (err) => {
      if (err) {
        MulterMiddleware.handleError(err, res);
        return;
      }
      next();
    });
  }

  static audio(req: Request, res: Response, next: NextFunction) {
    const upload = createUpload({
      mimeTypes: AUDIO_MIME_TYPES,
      extensions: ['.mp3', '.wav'],
      maxFileSize: config.upload.audioMaxFileSize,
      fieldName: 'audioClip',
      errorMessage: 'Only audio files (MP3, WAV) are allowed',
    });

    upload(req, res, (err) => {
      if (err) {
        MulterMiddleware.handleError(err, res);
        return;
      }
      next();
    });
  }

  static handleError(err: Error, res: Response) {
    if (err instanceof multer.MulterError) {
      logger.error('MULTER_ERROR', { error: err.message });

      if (err.code === 'LIMIT_FILE_SIZE') {
        MuttonResponder.respond(res, 400, null, 'File size exceeds limit');
        return;
      }

      MuttonResponder.respond(res, 400, null, err.message);
      return;
    }

    logger.error('UPLOAD_ERROR', { error: err.message });
    MuttonResponder.respond(res, 400, null, err.message);
  }
}
