# Términos UGC — versión propuesta `dosmicos-ugc-terms-2026-10`

**Estado: BORRADOR. No publicado. Requiere aprobación de Julian antes de tocar
`apps/upload-portal/src/lib/terms-content.ts`.**

| | |
|---|---|
| Versión propuesta | `dosmicos-ugc-terms-2026-10` |
| Reemplaza a | `dosmicos-ugc-terms-2026-02` (vigente) |
| Texto vigente en | `apps/upload-portal/src/lib/terms-content.ts` |
| Registro de versiones | `public.ugc_terms_versions` (Sewdle) |

---

## Por qué esta versión existe

El texto vigente autoriza reproducir, distribuir, **editar** y sublicenciar el
contenido. Lo que no dice en ninguna parte es que el contenido pueda usarse para
**generar material nuevo con inteligencia artificial**: reencuadres automáticos,
variantes de un estático, extensión de fondo, o —el caso que de verdad importa—
una imagen generada a partir de la cara de un niño.

Hoy eso no es un problema teórico que se pueda dejar para después. El loop de
generación con IA ya existió y se apagó por orden de Julian el 2026-09-22. Los
términos son de febrero. Si mañana se vuelve a encender sin cambiar el texto,
estaríamos usando la imagen de menores de edad para un fin que su representante
legal nunca autorizó, amparándonos en la palabra "editar" de una cláusula escrita
antes de que ese uso existiera.

**Conviene tenerla lista aunque la generación esté apagada, por tres razones:**

1. **Un consentimiento no se puede pedir hacia atrás.** El contenido que ya está
   en el bucket se subió bajo el texto de febrero. Si la cláusula se publica
   dentro de tres meses, cubre lo que entre a partir de ese día — no las 1.494
   piezas de hoy. Cada semana que pasa es contenido que, para efectos de IA,
   queda inservible para siempre.
2. **El día que se encienda el loop, la decisión va a tener prisa.** Redactar la
   cláusula con el generador apagado y sin presión es la única manera de que no
   se apruebe a las carreras.
3. **La aceptación nueva no cuesta nada operativamente.** El portal ya obliga a
   pasar por la pantalla; publicar una versión nueva solo hace que a cada
   creadora se le muestre una vez más. La infraestructura de versiones que se
   agrega en esta misma entrega (`ugc_terms_versions` + `terms_version` en cada
   consentimiento) existe precisamente para que ese cambio sea un despliegue y
   no una migración de datos.

---

## Qué cambia respecto del texto vigente

### 1. Sección 2 (Licencia de contenido) — viñeta nueva

Se agrega al final de la lista de usos autorizados:

> • Usar tu contenido como insumo para crear material promocional nuevo mediante
> herramientas de inteligencia artificial (por ejemplo: recortes y reencuadres
> automáticos, extensión de fondo, variantes de color o formato, o imágenes y
> videos derivados de tu contenido). El material así generado se usará en los
> mismos medios y con los mismos fines descritos en esta sección.

### 2. Sección 3 (Uso de imagen de menores) — párrafo nuevo, el que de verdad importa

Se agrega después de las cuatro viñetas existentes:

> **Contenido generado con inteligencia artificial.** Autorizas expresamente que
> la imagen del menor pueda usarse como insumo para generar material publicitario
> nuevo mediante herramientas de inteligencia artificial, bajo estas condiciones,
> que Dosmicos asume como obligaciones y no como buenas intenciones:
>
> • El material generado solo mostrará al menor usando o acompañado de productos
>   de Dosmicos, en contextos cotidianos y apropiados para su edad.
> • No se generará material que ponga al menor en situaciones, lugares o
>   compañías en las que no estuvo, ni que sugiera hechos que no ocurrieron.
> • No se modificará el cuerpo, el rostro ni los rasgos del menor más allá de
>   ajustes de encuadre, iluminación y color.
> • No se usará la imagen del menor para entrenar modelos de inteligencia
>   artificial de terceros, ni se entregará a proveedores que la retengan para
>   ese fin.
> • Esta autorización específica puede revocarse por separado, sin necesidad de
>   revocar el resto de la licencia, escribiendo a hola@dosmicos.co.

### 3. Sección 8 (Revocación) — se reconoce la revocación parcial

Se agrega un párrafo:

> Puedes revocar únicamente la autorización de uso de inteligencia artificial
> sobre la imagen del menor, manteniendo vigente el resto de la licencia. En ese
> caso Dosmicos retirará el material generado con IA en un plazo de treinta (30)
> días hábiles y excluirá el contenido de futuras generaciones, conservando el
> derecho de seguir usando el contenido original tal como fue subido.

### 4. Casilla 2 de la pantalla — redacción nueva

La segunda casilla deja de ser genérica y nombra el uso de IA, porque una
autorización que la persona no vio no es una autorización:

> Si aparecen menores de edad en los videos o fotos, confirmo que soy su **madre,
> padre o representante legal** y autorizo el uso de su imagen, **incluido
> material publicitario generado con inteligencia artificial a partir de ella**,
> en las condiciones descritas en los términos.

### 5. Resumen visual — punto nuevo

Se agrega a `TERMS_SUMMARY_POINTS`:

> "Podemos crear versiones nuevas de tu contenido con inteligencia artificial,
> con reglas estrictas si aparecen tus hijos"

### 6. Encabezado

`DOSMICOS S.A.S. — Última actualización: Octubre 2026`

---

## Qué NO cambia

- La creadora sigue siendo dueña de su contenido.
- La licencia sigue siendo no exclusiva, gratuita y revocable.
- Los derechos morales (sección 6) no se tocan.
- Las secciones 4, 5, 7, 9, 10 y 11 quedan idénticas.

---

## Cómo se publica (cuando Julian apruebe)

El orden importa: si se despliega el portal antes de que exista la fila en la
base, el RPC responde `unknown_terms_version` y nadie puede subir.

1. Migración en `sewdle-co` que inserte la fila en `public.ugc_terms_versions`
   con `version = 'dosmicos-ugc-terms-2026-10'`, y ponga `is_current = false`
   en la de febrero (hay un índice único que permite una sola vigente).
2. Aplicar esa migración.
3. Trasladar el texto de este documento a
   `apps/upload-portal/src/lib/terms-content.ts` y cambiar `TERMS_VERSION`.
4. Desplegar el portal.

A partir de ese momento cada creadora ve la pantalla una vez más y queda un
consentimiento nuevo, con `terms_version = 'dosmicos-ugc-terms-2026-10'`. Los
consentimientos de febrero **siguen siendo válidos para lo que ya cubrían**: no
se borran ni se actualizan, simplemente no autorizan IA.

## Consecuencia operativa que hay que tener clara

Mientras las dos versiones convivan, el pool de creativos para IA **no es** el
pool de creativos normal. Antes de reactivar la generación hay que filtrar por
creadoras con consentimiento `dosmicos-ugc-terms-2026-10` y por piezas subidas
después de esa aceptación. Si eso no se filtra, la cláusula no sirve de nada.
