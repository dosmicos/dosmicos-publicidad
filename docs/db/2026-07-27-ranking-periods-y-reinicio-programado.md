# Historial de rankings + reinicio programado

**Fecha:** 27 jul 2026
**Proyecto Supabase:** `ysdcsqsfnckeuafjyrbc` (Dosmicos Brain)

El repo no versiona migraciones SQL: viven directo en Supabase. Este documento
registra lo que se creó para que el cambio no sea invisible desde el código.

## Contexto

Antes, `reset_ugc_ranking_period()` solo escribía
`organizations.settings.ugc_ranking_started_at = now()`, y el ranking se calculaba
sumando `ugc_attributed_orders` con `order_date >= esa fecha`.

Los pedidos nunca se borraron, pero **cada reinicio sobrescribía la única fecha
guardada**, así que no quedaba registro de dónde empezaba y terminaba cada período.

## Tabla `ugc_ranking_periods`

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → `organizations`, on delete cascade |
| `started_at` | timestamptz | inicio del período |
| `ended_at` | timestamptz | `null` = período abierto/actual |
| `created_at` | timestamptz | default `now()` |

- Índice único parcial `(organization_id) where ended_at is null` → **un solo período
  abierto por organización**. Es lo que hace idempotente el doble clic en «Reiniciar».
- Check `ended_at is null or ended_at > started_at` → nunca períodos de duración cero.
- RLS activo: `select` solo para `authenticated` de la misma organización.
  La escritura pasa exclusivamente por funciones `security definer`.

### Semilla aplicada

Se creó un período histórico por organización cubriendo todo lo anterior a la fecha
de inicio vigente, y el período actual abierto. Para `dosmicos-org` quedó:

- `2026-04-14 → 2026-07-01` (cerrado) — 62 pedidos, $1.191.578
- `2026-07-01 → abierto` (actual) — 52 pedidos, $936.231

Todo lo previo al 1 jul es **un solo bloque**: los límites de los reinicios anteriores
nunca se guardaron y no son reconstruibles.

## Funciones

| Función | Rol | Permisos |
|---|---|---|
| `reset_ugc_ranking_period(uuid)` | Cierra el período abierto, abre uno nuevo, sincroniza `ugc_ranking_started_at` y avanza la programación | ⚠️ ver nota |
| `set_ugc_ranking_schedule(uuid, text, int, timestamptz)` | Programa el reinicio. Valida que `auth.uid()` pertenezca a la organización | `authenticated` |
| `run_due_ugc_ranking_resets()` | La ejecuta pg_cron: dispara los reinicios vencidos | `postgres`, `service_role` |
| `list_ugc_ranking_periods(text)` | Períodos con totales, más reciente primero | `authenticated` |
| `get_ugc_ranking_for_period(uuid)` | Ranking de un período (misma forma que `get_ugc_public_ranking`) | `authenticated` |
| `ugc_next_monthly_reset(int)` | Próxima ocurrencia del día N a las 00:00 hora Colombia | `authenticated` |

`get_ugc_public_ranking()` **no se tocó**: sigue leyendo
`settings.ugc_ranking_started_at`, que el reinicio mantiene sincronizado. La página
pública de ranking funciona igual que antes.

### ⚠️ Pendiente de seguridad (preexistente)

`reset_ugc_ranking_period` tiene `EXECUTE` para `PUBLIC`/`anon` desde antes de este
cambio y **no valida el usuario**. Como la anon key viaja en el bundle del frontend,
quien conozca el UUID de una organización podría reiniciarle el ranking. Se arregla con:

```sql
revoke all on function public.reset_ugc_ranking_period(uuid) from public, anon;
grant execute on function public.reset_ugc_ranking_period(uuid) to authenticated;
```

No se aplicó por estar fuera del alcance pedido.

## Programación

Se guarda en `organizations.settings`:

- `ugc_ranking_reset_mode`: `off` | `once` | `monthly`
- `ugc_ranking_reset_day`: 1–28 (solo `monthly`; tope 28 para que exista en todos los meses)
- `ugc_ranking_next_reset_at`: timestamptz absoluto, el disparo concreto

Tras cada reinicio: si es `monthly` se recalcula el siguiente; si es `once` pasa a `off`.

**Job pg_cron:** `ugc-ranking-scheduled-reset`, `10 * * * *` (cada hora al minuto 10,
jobid 64). Las horas se guardan en UTC; el día del mes se interpreta a medianoche
`America/Bogota`, igual que el resto de los jobs del proyecto.
