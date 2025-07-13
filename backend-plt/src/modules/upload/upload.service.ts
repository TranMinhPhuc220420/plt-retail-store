import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { STORE_DISK_PATH } from '@/config';

@Injectable()
export class UploadService {
  getMulterOptions(destination: string) {
    return {
      storage: diskStorage({
        destination,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    };
  }
}

@Injectable()
export class StoreFileInterceptor implements NestInterceptor {
  constructor(private readonly uploadService: UploadService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const InterceptorClass = FileInterceptor('file', this.uploadService.getMulterOptions(STORE_DISK_PATH));
    const interceptor = new InterceptorClass();
    return interceptor.intercept(context, next);
  }
}