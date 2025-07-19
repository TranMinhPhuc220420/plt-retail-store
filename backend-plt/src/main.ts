import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';

import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { STORAGE_CONFIG } from '@/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Use cookie parser to handle cookies
  app.use(cookieParser());

  // Serve static files
  for (const [key, config] of Object.entries(STORAGE_CONFIG)) {
    app.useStaticAssets(
      join(__dirname, '..', '..', config.disk),
      { prefix: config.prefix }
    );
  }
  
  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
