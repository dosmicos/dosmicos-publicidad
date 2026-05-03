# Dosmicos UGC

Un solo proyecto para los sistemas UGC de Dosmicos.

## Estructura

```txt
dosmicos-ugc/
  apps/
    publicidad/      # ranking/publicidad UGC + dashboard admin
    upload-portal/   # portal para subida de contenido UGC por token
  scripts/
    build-single-project.mjs
  dist/              # salida generada para deploy único
  vercel.json
```

## Cómo funciona el proyecto único

El proyecto mantiene las dos apps separadas internamente para no mezclar dependencias incompatibles, pero genera **un solo deploy**:

- `/` sirve `apps/publicidad`.
- `/login` y `/admin` siguen funcionando desde `apps/publicidad`.
- `/ugc/:token` sigue redirigiendo a la función Supabase original.
- `/upload/:token` sirve `apps/upload-portal`.

La salida final se compone en `dist/`:

```txt
dist/
  index.html              # app publicidad
  assets/                 # assets publicidad
  upload/
    index.html            # app upload portal
    assets/               # assets upload portal
```

## Comandos

Desde la raíz:

```bash
npm run dev:publicidad
npm run dev:upload
npm run build
```

`npm run build` instala/build-ea ambas apps y compone el deploy único en `dist/`.

También se pueden correr builds individuales:

```bash
npm run build:publicidad
npm run build:upload
npm run lint:publicidad
```

## Deploy en Vercel

Usar **un solo proyecto de Vercel** apuntando a la raíz del repo:

- Build Command: `npm run build`
- Output Directory: `dist`

`vercel.json` ya contiene las rewrites para que funcionen las rutas de ambas apps.

## Notas

- Cada app conserva su `package.json`, `package-lock.json`, `vite.config.ts` y configuración original.
- Se importaron con `git subtree` para preservar historial de ambos repos.
- No se fusionaron en un solo runtime React para reducir riesgo: las apps usan stacks distintos.
- `apps/upload-portal` usa `VITE_BASE_PATH=/upload/` solo durante el build único para que sus assets carguen correctamente bajo `/upload/`.
