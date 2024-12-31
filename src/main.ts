import './instrument';

import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

import { AllExceptionsFilter } from './lib/filters/all-exceptions.filter';

async function bootstrap() {
  const port = process.env.PORT ?? 8000;
  const app = await NestFactory.create(AppModule);

  const httpAdapter = app.get(HttpAdapterHost);

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory(errors) {
        throw new BadRequestException(
          JSON.stringify(
            errors.map((error) => {
              return {
                property: error.property,
                constraints: Object.values(error.constraints),
              };
            }),
          ),
        );
      },
    }),
  );
  app.enableCors();
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  await app.listen(port, () =>
    new Logger('MainApp').log(`app is listening on ${port}`),
  );
}
bootstrap();
