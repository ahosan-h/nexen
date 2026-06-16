import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // GLOBAL API PREFIX
  app.setGlobalPrefix('nexen');
  // CORS CONFIG

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        //for froduction
        'http://localhost:3000',
        'http://localhost:1128',

        'http://192.168.0.100:1128',

        'https://573d34ff-3000.inc1.devtunnels.ms',
      ];

      /*
      Allow:
      - Postman
      - Mobile apps
      - Same-origin
      */

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    credentials: true,

    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],

    preflightContinue: false,

    optionsSuccessStatus: 204,
  });

  // GLOBAL VALIDATION
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,
    }),
  );

  const PORT = process.env.PORT ?? 4444;

  await app.listen(PORT);

  console.log(`

   Server running on: http://localhost:${PORT}

  `);
}

bootstrap();
