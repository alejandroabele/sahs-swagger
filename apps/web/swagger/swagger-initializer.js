// Swagger UI de SAHS, servido por el nginx de la web en /docs/.
// Reemplaza al swagger-initializer.js de swagger-ui-dist. Lee el OpenAPI que publica
// cada servicio (/docs/<servicio>-json) en el mismo origen, así "Try it out" no necesita CORS.
window.onload = function () {
  window.ui = SwaggerUIBundle({
    urls: [
      { url: '/docs/usuario-json', name: 'Usuario' },
      { url: '/docs/pago-json', name: 'Pago' },
      { url: '/docs/horarios-json', name: 'Horarios' },
      { url: '/docs/planificacion-json', name: 'Planificación' },
      { url: '/docs/orientacion-json', name: 'Orientación' },
      { url: '/docs/profesor-suplencias-json', name: 'Profesor y Suplencias' },
    ],
    'urls.primaryName': 'Usuario',
    dom_id: '#swagger-ui',
    deepLinking: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: 'StandaloneLayout',
  });
};
