// Generates docs/API.md from src/config/apiCatalog.js (no dependencies needed).
import fs from 'fs';
import { apiCatalog } from '../src/config/apiCatalog.js';

const fmt = (o) => (o ? Object.entries(o).map(([k, v]) => `\`${k}\`: ${v}`).join('<br>') : '-');
const groups = {};
apiCatalog.forEach((e) => (groups[e.tag] ||= []).push(e));

let md = `# EventSphere REST API (v1)

Base URL: \`/api/v1\`. Interactive docs: \`/api-docs\` (Swagger UI) and \`/api-docs.json\`.
Generated from \`src/config/apiCatalog.js\` - run \`npm run docs:api\` after changing routes.

## Conventions
- Auth: \`Authorization: Bearer <JWT>\` (or the httpOnly cookie set at login). "optional" = works anonymously, richer when authenticated.
- Success: \`{ "success": true, "message": "...", "data": ..., "meta"?: {pagination...} }\`
- Error: \`{ "success": false, "message": "...", "errors"?: [{ "field", "message" }] }\`
- Status codes: 200 OK, 201 created, 400 bad request, 401 unauthenticated/expired/revoked token, 403 forbidden (role or ownership), 404 not found, 409 conflict (duplicates, invalid state), 413 file too large, 422 validation failed, 429 rate limited, 503 external service not configured.
- Paginated lists accept \`page\` (default 1) and \`limit\` (default 20, max 100) and return \`meta: { total, page, limit, totalPages, hasNext, hasPrev }\`.
- Authorization is two-layered: role middleware, then server-side resource-ownership checks (e.g. an organizer can only manage their own events).
- Additional endpoints beyond the specification table (required by the master prompt): password reset, role change, avatar/banner/speaker-image upload, event complete, attendance, block/unblock, remove connection, networking session room/end, notification read-all.

`;
for (const [tag, list] of Object.entries(groups)) {
  md += `## ${tag}\n\n| Method | Endpoint | Auth | Roles | Request | Success | Errors |\n|---|---|---|---|---|---|---|\n`;
  for (const e of list) {
    const req = [e.body ? `**Body**<br>${fmt(e.body)}` : '', e.query ? `**Query**<br>${fmt(e.query)}` : ''].filter(Boolean).join('<br>') || '-';
    md += `| ${e.method} | \`${e.path}\` — ${e.summary} | ${e.auth} | ${e.roles} | ${req} | ${e.status} ${e.response} | ${e.err} |\n`;
  }
  md += '\n';
}
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/API.md', md);
console.log(`docs/API.md written (${apiCatalog.length} endpoints)`);
