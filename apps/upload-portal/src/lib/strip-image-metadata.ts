/**
 * strip-image-metadata
 * ---------------------------------------------------------------------------
 * Quita los metadatos de una imagen ANTES de subirla a Supabase Storage.
 *
 * Por que existe: las fotos que mandan las familias salen del celular con EXIF
 * completo — incluyendo GPS. El bucket `ugc-videos` es publico, asi que esas
 * coordenadas (la casa de una familia con ninos) quedaban accesibles sin
 * contrasena para cualquiera que tuviera la URL. Auditoria del 2026-09-22:
 * 489 de 888 fotos ya almacenadas traian GPS.
 *
 * Como funciona: NO re-codifica la imagen. Reescribe unicamente los
 * contenedores de metadatos y deja los datos de imagen comprimidos intactos,
 * byte por byte. Eso significa cero perdida de calidad y cero costo de CPU
 * notable, incluso con fotos de 24 MP.
 *
 * Que se conserva a proposito:
 *   - Orientation: si se borra, las fotos verticales de iPhone se ven acostadas.
 *     Se reescribe un bloque EXIF minimo que SOLO contiene ese dato.
 *   - Perfil ICC: si se borra, las fotos Display P3 se ven lavadas.
 *
 * Que se elimina:
 *   - GPS, marca/modelo/serial del equipo, fechas de captura, software,
 *     XMP (incluye las regiones de rostro que escribe Apple, con IDs de cara),
 *     IPTC, comentarios, los bloques propietarios (Xiaomi ALGO_COMMON, etc.) y
 *     cualquier payload pegado despues del fin de la imagen (Motion Photo:
 *     un MP4 oculto; o una segunda foto completa con su propio GPS).
 *
 * Formatos: JPEG y PNG se limpian aqui. HEIC y los videos no se pueden
 * reescribir de forma segura en el navegador; se marcan como
 * `needsServerStrip` para que los limpie la pasada del servidor en vez de
 * dejarlos pasar en silencio. Los videos NO son un caso benigno: de 4
 * muestreados en el bucket, 2 traian GPS.
 */

export type StripResult = {
  /** El archivo a subir: limpio si se pudo, el original si no. */
  file: File;
  /** true si se removieron metadatos. */
  stripped: boolean;
  /** true si el formato requiere limpieza del lado del servidor (HEIC). */
  needsServerStrip: boolean;
  /** Bytes eliminados (metadatos + payloads ocultos). */
  bytesRemoved: number;
  /** Motivo cuando no se pudo limpiar. */
  reason?: string;
};

const JPEG_SOI = 0xd8;
const JPEG_EOI = 0xd9;
const JPEG_SOS = 0xda;

/** Segmentos JPEG que se conservan tal cual (APP0/JFIF y APP2/ICC_PROFILE). */
function isKeptAppSegment(bytes: Uint8Array, start: number, marker: number): boolean {
  if (marker === 0xe0) return true; // APP0 / JFIF
  if (marker === 0xe2) {
    // APP2 solo si es ICC_PROFILE (NO si es MPF, que indexa imagenes ocultas)
    const tag = new TextDecoder("latin1").decode(bytes.subarray(start + 4, start + 15));
    return tag.startsWith("ICC_PROFILE");
  }
  return false;
}

/** Lee el valor de Orientation del bloque EXIF, sin dependencias. */
function readOrientation(bytes: Uint8Array, start: number, length: number): number | null {
  try {
    const tiff = start + 10; // saltar marcador, longitud y "Exif\0\0"
    if (tiff + 8 > start + length) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset + tiff, length - 10);
    const le = view.getUint16(0, false) === 0x4949; // "II" = little endian
    if (view.getUint16(2, le) !== 0x002a) return null;
    const ifd0 = view.getUint32(4, le);
    if (ifd0 + 2 > view.byteLength) return null;
    const count = view.getUint16(ifd0, le);
    for (let i = 0; i < count; i++) {
      const entry = ifd0 + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;
      if (view.getUint16(entry, le) === 0x0112) {
        const v = view.getUint16(entry + 8, le);
        return v >= 1 && v <= 8 ? v : null;
      }
    }
  } catch {
    /* EXIF corrupto: mejor perder la orientacion que la foto */
  }
  return null;
}

/**
 * Construye un APP1/EXIF minimo que solo lleva Orientation.
 *
 * El bloque tiene que estar completo o exiftool (y los navegadores) lo ignoran:
 * el campo de valor de la entrada IFD mide 4 bytes aunque el dato sea SHORT, y
 * despues de las entradas va el puntero al siguiente IFD (0 = no hay).
 */
function buildOrientationExif(orientation: number): Uint8Array {
  const payload = new Uint8Array(32);
  const dv = new DataView(payload.buffer);
  payload.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0); // "Exif\0\0"
  dv.setUint16(6, 0x4d4d, false); // "MM" big endian
  dv.setUint16(8, 0x002a, false);
  dv.setUint32(10, 8, false); // offset a IFD0, relativo al inicio del TIFF (byte 6)
  dv.setUint16(14, 1, false); // 1 entrada
  dv.setUint16(16, 0x0112, false); // tag Orientation
  dv.setUint16(18, 3, false); // tipo SHORT
  dv.setUint32(20, 1, false); // count
  dv.setUint16(24, orientation, false); // valor (2 bytes usados de 4)
  dv.setUint16(26, 0, false); // relleno del campo de valor
  dv.setUint32(28, 0, false); // no hay IFD siguiente

  const seg = new Uint8Array(4 + payload.length);
  seg[0] = 0xff;
  seg[1] = 0xe1;
  seg[2] = ((payload.length + 2) >> 8) & 0xff;
  seg[3] = (payload.length + 2) & 0xff;
  seg.set(payload, 4);
  return seg;
}

function stripJpeg(bytes: Uint8Array): Uint8Array | null {
  if (bytes[0] !== 0xff || bytes[1] !== JPEG_SOI) return null;

  const keep: Uint8Array[] = [new Uint8Array([0xff, JPEG_SOI])];
  let orientation: number | null = null;
  let i = 2;

  while (i < bytes.length - 1) {
    if (bytes[i] !== 0xff) return null; // estructura inesperada: no tocar
    const marker = bytes[i + 1];

    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    if (marker === JPEG_EOI) break;
    if (i + 4 > bytes.length) return null;

    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length) return null;

    if (marker === JPEG_SOS) {
      // A partir de aqui van los datos comprimidos: se copian sin tocar hasta
      // el EOI primario. Todo lo que venga DESPUES del EOI se descarta (ahi se
      // esconden los Motion Photo y las segundas fotos con su propio GPS).
      let end = i + 2 + length;
      while (end < bytes.length - 1) {
        if (bytes[end] === 0xff && bytes[end + 1] === JPEG_EOI) break;
        end++;
      }
      keep.push(bytes.subarray(i, Math.min(end + 2, bytes.length)));
      break;
    }

    if (marker === 0xe1) {
      const tag = new TextDecoder("latin1").decode(bytes.subarray(i + 4, i + 8));
      if (tag === "Exif" && orientation === null) {
        orientation = readOrientation(bytes, i, length);
      }
      // APP1 (EXIF y XMP) siempre se descarta
    } else if (isKeptAppSegment(bytes, i, marker)) {
      keep.push(bytes.subarray(i, i + 2 + length));
    } else if (!(marker >= 0xe0 && marker <= 0xef) && marker !== 0xfe) {
      // Tablas de cuantizacion/Huffman, SOF, DRI...: necesarias para decodificar
      keep.push(bytes.subarray(i, i + 2 + length));
    }
    // APPn restantes (IPTC, MPF, ALGO_COMMON, XIAOMI_*) y COM: descartados

    i += 2 + length;
  }

  if (orientation !== null && orientation !== 1) {
    keep.splice(1, 0, buildOrientationExif(orientation));
  }

  const total = keep.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of keep) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/** Chunks PNG que se conservan: imagen y color. El resto se descarta. */
const PNG_KEEP = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "iCCP", "sRGB", "gAMA", "cHRM"]);

function stripPng(bytes: Uint8Array): Uint8Array | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!sig.every((b, n) => bytes[n] === b)) return null;

  const keep: Uint8Array[] = [bytes.subarray(0, 8)];
  const dec = new TextDecoder("latin1");
  let i = 8;

  while (i + 8 <= bytes.length) {
    const len = new DataView(bytes.buffer, bytes.byteOffset + i, 4).getUint32(0, false);
    const type = dec.decode(bytes.subarray(i + 4, i + 8));
    const end = i + 12 + len;
    if (end > bytes.length) return null;
    if (PNG_KEEP.has(type)) keep.push(bytes.subarray(i, end));
    i = end;
    if (type === "IEND") break; // descarta cualquier cosa pegada despues
  }

  const total = keep.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of keep) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

const HEIC_RE = /\.(heic|heif)$/i;

/**
 * Limpia los metadatos de una imagen antes de subirla.
 * Nunca lanza: si algo sale mal devuelve el archivo original y lo reporta,
 * para que un formato raro no impida que la familia suba su foto.
 */
export async function stripImageMetadata(file: File): Promise<StripResult> {
  const base: StripResult = {
    file,
    stripped: false,
    needsServerStrip: false,
    bytesRemoved: 0,
  };

  const isImage = file.type.startsWith("image/") || HEIC_RE.test(file.name);
  if (!isImage) {
    // Los videos tambien filtran ubicacion: de 4 muestreados al azar en el
    // bucket, 2 traian GPS (Medellin y Bogota) ademas de marca, modelo y
    // fecha. Aqui no se pueden reescribir, pero devolver needsServerStrip
    // en false los daria por limpios. Se marcan para la pasada del servidor.
    return { ...base, needsServerStrip: true, reason: "no es imagen (video u otro): se limpia en el servidor" };
  }

  if (file.type === "image/heic" || file.type === "image/heif" || HEIC_RE.test(file.name)) {
    return { ...base, needsServerStrip: true, reason: "HEIC: se limpia en el servidor" };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let out: Uint8Array | null = null;

    if (bytes[0] === 0xff && bytes[1] === JPEG_SOI) out = stripJpeg(bytes);
    else if (bytes[0] === 0x89 && bytes[1] === 0x50) out = stripPng(bytes);
    else return { ...base, needsServerStrip: true, reason: "formato no reconocido" };

    // Si el resultado no es plausible, no arriesgamos la foto del cliente.
    if (!out || out.length < 1024 || out.length > bytes.length) {
      return { ...base, needsServerStrip: true, reason: "resultado no plausible" };
    }

    const clean = new File([out as unknown as BlobPart], file.name, {
      type: file.type,
      lastModified: Date.now(), // no filtrar la fecha real de captura
    });

    return {
      file: clean,
      stripped: true,
      needsServerStrip: false,
      bytesRemoved: bytes.length - out.length,
    };
  } catch (err) {
    return {
      ...base,
      needsServerStrip: true,
      reason: err instanceof Error ? err.message : "error desconocido",
    };
  }
}
