import {
  RECEIPT_LOGO_MAX_HEIGHT,
  RECEIPT_LOGO_MAX_WIDTH,
  type ReceiptImage,
} from "./escpos";

const LOGO_THRESHOLD = 160;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Gagal memuat logo"));
  image.src = src;
  return promise;
}

/**
 * Loads a logo (same-origin or CORS-enabled URL) and packs it into a 1-bit
 * ESC/POS raster. Returns null when the image cannot be read, so receipts still
 * print without a logo.
 */
export async function loadReceiptLogo(
  url: string | null | undefined,
): Promise<ReceiptImage | null> {
  if (!url || typeof document === "undefined") return null;

  let objectUrl: string | null = null;
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    objectUrl = URL.createObjectURL(await response.blob());

    const image = await loadImageElement(objectUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) return null;

    const scale = Math.min(
      RECEIPT_LOGO_MAX_WIDTH / sourceWidth,
      RECEIPT_LOGO_MAX_HEIGHT / sourceHeight,
    );
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height).data;
    const bytesPerRow = (width + 7) >> 3;
    const data = new Uint8Array(bytesPerRow * height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const alpha = pixels[offset + 3] ?? 255;
        if (alpha < 64) continue;
        const luminance =
          (pixels[offset] ?? 255) * 0.299 +
          (pixels[offset + 1] ?? 255) * 0.587 +
          (pixels[offset + 2] ?? 255) * 0.114;
        if (luminance < LOGO_THRESHOLD) {
          data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
        }
      }
    }

    return { width, height, bytesPerRow, data };
  } catch {
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
