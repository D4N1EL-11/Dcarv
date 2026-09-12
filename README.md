# Dcarv

Base fullstack TypeScript para un workspace operativo: Next.js App Router, JSON-DB tipado, UI responsive, notas, autenticación JWT y RBAC.

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Rutas principales: `/`, `/login`, `/register`, `/dashboard`, `/dashboard/notes`, `/dashboard/status` y `/api/health`.

## Calidad

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

La persistencia local vive en `data/`. En Vercel el filesystem efímero no debe usarse para escrituras permanentes; configura un adapter externo antes de publicar operaciones mutables.

## Arquitectura

- `src/app`: rutas App Router y endpoints.
- `src/lib`: motor de datos, autenticación, errores y logging.
- `src/modules/notes`: módulo de negocio replicable.
- `src/components`: UI y layout.
- `data/_schema`: contratos Zod.