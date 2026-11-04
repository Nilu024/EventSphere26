import swaggerJSDoc from 'swagger-jsdoc';
import { apiCatalog } from './apiCatalog.js';

const typeOf = (t) => {
  const s = String(t).toLowerCase();
  if (s.startsWith('int')) return { type: 'integer' };
  if (s.startsWith('bool')) return { type: 'boolean' };
  if (s.includes('[]')) return { type: 'array', items: { type: 'string' } };
  if (s.startsWith('{')) return { type: 'object' };
  return { type: 'string', description: String(t).replace(/\*/g, '') };
};

function buildPaths() {
  const paths = {};
  for (const e of apiCatalog) {
    const path = e.path.replace(/:(\w+)/g, '{$1}');
    const params = [...e.path.matchAll(/:(\w+)/g)].map((m) => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } }));
    for (const [k, v] of Object.entries(e.query || {})) params.push({ name: k, in: 'query', required: false, schema: typeOf(v) });
    const op = {
      tags: [e.tag],
      summary: e.summary,
      description: `Roles: ${e.roles}. Errors: ${e.err}`,
      parameters: params,
      responses: { [e.status]: { description: e.response }, default: { description: 'Error: { success:false, message, errors? }' } },
    };
    if (e.auth !== 'public') op.security = e.auth === 'optional' ? [{}, { bearerAuth: [] }] : [{ bearerAuth: [] }];
    if (e.body) {
      op.requestBody = {
        required: true,
        content: { 'application/json': { schema: { type: 'object', required: Object.entries(e.body).filter(([, v]) => String(v).includes('*')).map(([k]) => k), properties: Object.fromEntries(Object.entries(e.body).map(([k, v]) => [k, typeOf(v)])) } } },
      };
    }
    (paths[path] ||= {})[e.method.toLowerCase()] = op;
  }
  return paths;
}

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'EventSphere API', version: '1.0.0', description: 'Virtual event management & professional networking backend. Base path: /api/v1' },
    servers: [{ url: '/api/v1' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    paths: buildPaths(),
  },
  apis: [],
});
