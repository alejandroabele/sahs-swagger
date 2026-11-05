import { BadRequestException, Logger, ValidationPipe, type INestApplication, type ValidationError } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { middlewareContexto } from './contexto';
import { FiltroErrores } from './errores';
import { configurarSwagger, uiSwaggerActiva, type InfoSwagger } from './swagger';
import { PUERTOS_DESARROLLO, type NombreServicio } from './cliente-servicio';

/** Primera regla de negocio que declara un campo que no validó: `@IsNotEmpty({ context: { regla: 'RN-05' } })`. */
function reglaDe(errores: ValidationError[]): string | undefined {
  for (const e of errores) {
    const regla = Object.values(e.contexts ?? {}).find((c) => c?.regla)?.regla ?? reglaDe(e.children ?? []);
    if (regla) return regla;
  }
  return undefined;
}

/** ValidationPipe que responde 400 con la regla del campo, si la declara (si no, RN-14). */
class PipeValidacion extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    });
    this.exceptionFactory = (errores) =>
      new BadRequestException({ codigo: reglaDe(errores), message: this.flattenValidationErrors(errores) });
  }
}

/** Configura una app Nest como servicio SAHS (validación, errores, contexto, CORS y swagger). */
export function configurarApp(app: INestApplication, info: InfoSwagger) {
  app.use(middlewareContexto);
  app.useGlobalPipes(new PipeValidacion());
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
