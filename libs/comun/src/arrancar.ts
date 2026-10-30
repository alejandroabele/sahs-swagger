import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { middlewareContexto } from './contexto';
import { FiltroErrores } from './errores';
import { configurarSwagger, uiSwaggerActiva, type InfoSwagger } from './swagger';
import { PUERTOS_DESARROLLO, type NombreServicio } from './cliente-servicio';

/** Configura una app Nest como servicio SAHS (validación, errores, contexto, CORS y swagger). */
export function configurarApp(app: INestApplication, info: InfoSwagger) {
  app.use(middlewareContexto);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new FiltroErrores());
  const origenes = (process.env.CORS_ORIGEN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenes });
  app.enableShutdownHooks();
  return configurarSwagger(app, info);
}

/** Arranca un servicio SAHS: en Docker escucha en PORT (3000); en desarrollo, en su puerto 808x. */
export async function arrancarServicio(servicio: NombreServicio, modulo: unknown, info: InfoSwagger) {
  const app = await NestFactory.create(modulo as any, { logger: ['log', 'warn', 'error'] });
  configurarApp(app, info);
  const puerto = Number(process.env.PORT || PUERTOS_DESARROLLO[servicio]);
  await app.listen(puerto, '0.0.0.0');
  const docs = uiSwaggerActiva() ? 'swagger en /docs y /docs-json' : 'OpenAPI en /docs-json';
  new Logger(servicio).log(`Servicio ${servicio} en el puerto ${puerto} (${docs})`);
  return app;
}
