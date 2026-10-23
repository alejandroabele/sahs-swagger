import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface Dependencia {
  servicio: string;
  endpoint: string;
  usado_por: string[];
}

export interface InfoSwagger {
  titulo: string;
  descripcion: string;
  version: string;
  tags: { name: string; description?: string }[];
  dependencias: Dependencia[];
}

/**
 * Publica el OpenAPI del servicio en /docs (UI) y /docs-json.
 * Este documento es la fuente de verdad de la API.
 */
export function configurarSwagger(app: INestApplication, info: InfoSwagger) {
  const deps = info.dependencias.length
    ? info.dependencias.map((d) => `- \`${d.servicio}.${d.endpoint}\` → usado por: ${d.usado_por.map((u) => '`' + u + '`').join(', ')}`).join('\n')
    : 'ninguna.';
  const builder = new DocumentBuilder()
    .setTitle(info.titulo)
    .setDescription(`${info.descripcion}\n\n**Dependencias (Invokes):**${info.dependencias.length ? '\n' : ' '}${deps}`)
    .setVersion(info.version)
    .addServer('/')
    .addTag('Health', 'Estado del servicio');
  for (const t of info.tags) builder.addTag(t.name, t.description);
  const doc = SwaggerModule.createDocument(app, builder.build(), {
    operationIdFactory: (_ctrl, metodo) => metodo,
  });
  (doc.info as any)['x-dependencias'] = info.dependencias;
  SwaggerModule.setup('docs', app, doc, {
    jsonDocumentUrl: 'docs-json',
    customSiteTitle: info.titulo,
    swaggerOptions: { docExpansion: 'list', defaultModelsExpandDepth: 1 },
  });
  return doc;
}
