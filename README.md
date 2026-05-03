# Dosmicos UGC

Monorepo para los sistemas UGC de Dosmicos.

## Apps

- `apps/publicidad` — ranking/publicidad UGC + dashboard admin. Origen: `dosmicos/dosmicos-publicidad`.
- `apps/upload-portal` — portal para subida de contenido UGC por token. Origen: `jdcastro2/dosmicos-upload-portal`.

## Comandos

Desde la raíz:

```bash
npm run dev:publicidad
npm run build:publicidad
npm run lint:publicidad
npm run dev:upload
npm run build:upload
npm run build
```

También puedes entrar a cada app y usar sus comandos originales:

```bash
cd apps/publicidad && npm install && npm run dev
cd apps/upload-portal && npm install && npm run dev
```

## Deploy sugerido

Mantener dos proyectos de Vercel apuntando al mismo repositorio, cada uno con su Root Directory:

- Proyecto `dosmicos-publicidad`: Root Directory `apps/publicidad`
- Proyecto `dosmicos-upload-portal`: Root Directory `apps/upload-portal`

Así quedan en un solo repo sin mezclar dependencias ni romper rutas/deploys.

## Notas

- Cada app conserva su `package.json`, `package-lock.json`, `vite.config.ts` y `vercel.json`.
- Se importaron con `git subtree` para preservar historial de ambos repos en un solo repo.
- No se fusionaron todavía en una sola app React porque usan stacks distintos: React 19/Tailwind 4/Vite 8 vs React 18/Tailwind 3/Vite 6.
