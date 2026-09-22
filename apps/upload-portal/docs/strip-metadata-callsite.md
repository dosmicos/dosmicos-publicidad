# Conectar el borrado de metadatos al portal de subida

Este PR agrega el módulo `src/lib/strip-image-metadata.ts` **pero no lo conecta**.
El archivo `src/pages/UgcUploadPage.tsx` lo está tocando otro agente en la rama
`feature/ugc-consent-registry`, así que aquí queda solo el cambio descrito para
aplicarlo sin conflictos cuando esa rama aterrice.

## Por qué

Auditoría del 2026-09-22 sobre el bucket público `ugc-videos`:

| Hallazgo | Cantidad |
|---|---|
| Fotos almacenadas | 888 |
| **Con coordenadas GPS** | **489** |
| Con marca/modelo del celular | 601 |
| Con regiones de rostro de Apple (IDs de cara de los niños) | 301 |
| Con foto o video escondido pegado al final del archivo | 465 |

El bucket es público: cualquiera con la URL lee la ubicación de la casa de una
familia con menores, sin contraseña. Las fotos entran por
`UgcUploadPage.tsx`, que sube el `File` del celular tal cual vía TUS. Nadie
limpia nada en el camino, y el RPC `ugc_submit_video` solo escribe la fila
después de que el archivo ya subió: nunca ve los bytes.

La limpieza tiene que pasar en el navegador, antes de que el archivo salga del
celular.

## El cambio

En `handleUploadAll`, entre armar el nombre del archivo y crear el `tus.Upload`:

```diff
+import { stripImageMetadata } from "@/lib/strip-image-metadata";
+
     for (const video of pendingVideos) {
       ...
       try {
         const fileExt = video.file.name.split(".").pop() || "mp4";
         const folderCampaign = campaignId || "sin-campana";
         const fileName = `${validation.organization_id}/...`;
         const bucketName = "ugc-videos";
 
+        // Quitar EXIF/GPS antes de que el archivo salga del celular.
+        // Nunca falla: si no puede limpiar, sube el original y lo marca
+        // para que lo limpie la pasada del servidor.
+        const stripped = await stripImageMetadata(video.file);
+        const fileToUpload = stripped.file;
+
         const { data: { session } } = await supabase.auth.getSession();
 
         await new Promise<void>((resolve, reject) => {
-          const upload = new tus.Upload(video.file, {
+          const upload = new tus.Upload(fileToUpload, {
             ...
             metadata: {
               bucketName,
               objectName: fileName,
-              contentType: video.file.type,
+              contentType: fileToUpload.type,
               cacheControl: "3600",
             },
```

Y en la llamada al RPC, reportar el tamaño real subido:

```diff
             p_original_filename: video.file.name,
-            p_file_size_bytes: video.file.size,
-            p_mime_type: video.file.type || null,
+            p_file_size_bytes: fileToUpload.size,
+            p_mime_type: fileToUpload.type || null,
```

## Qué hace y qué no

El módulo **no recodifica** la imagen: reescribe solo los contenedores de
metadatos y deja los datos comprimidos intactos byte por byte. Verificado
contra 240 fotos reales del bucket: 0 fugas de metadatos, 0 cambios de
dimensiones, 63/63 con los píxeles idénticos bit a bit.

Conserva a propósito dos cosas, porque borrarlas sí se nota:

- **Orientation** — sin esto las fotos verticales de iPhone se ven acostadas
  (194 de las 888 dependen de ese dato).
- **Perfil ICC** — sin esto las fotos Display P3 se ven lavadas (624 de 888).

Borra GPS, marca/modelo/serial, fechas de captura, software, XMP (incluidas las
regiones de rostro de Apple), IPTC, comentarios, los bloques propietarios
(Xiaomi `ALGO_COMMON`, etc.) y todo lo pegado después del fin de la imagen.

## Lo que queda pendiente del lado del servidor

Dos cosas no se pueden reescribir con seguridad en el navegador. El módulo
devuelve `needsServerStrip: true` para ambas, en vez de dejarlas pasar en
silencio:

- **HEIC** — hoy son 6 archivos de 888.
- **Videos** — 747 archivos en el bucket, y **no** son un caso benigno: de 8
  muestreados al azar, 2 traen GPS (Medellín y Bogotá) más marca, modelo y
  fecha, y casi todos traen fecha de captura. Limpiar solo las fotos cierra
  media fuga.

Conviene entonces:

1. Guardar `needsServerStrip` junto con la fila del UGC.
2. Una pasada del servidor (exiftool) que limpie lo que el navegador no pudo.

Receta del servidor, la misma que se usó para el histórico:

```
exiftool -all= --icc_profile:all -tagsfromfile @ -Orientation -overwrite_original -P <archivo>
```

## Segunda puerta

`https://growth.sewdle.co/upload/<token>` (repo `sewdle-co`,
`src/pages/UgcUploadPage.tsx`) sube por el mismo camino y tampoco limpia nada.
Si esa ruta sigue viva, necesita el mismo módulo.
