/** Resize an image Blob to a thumbnail (maxDim px, JPEG). Returns { blob, w, h }. */
export async function makeThumbnail(file: Blob, maxDim = 256, quality = 0.8):
Promise<{ blob: Blob; width: number; height: number; origW: number; origH: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob = await new Promise((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', quality)
    );
    return { blob, width: w, height: h, origW: img.width, origH: img.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image load failed'));
    img.src = src;
  });
}

/** Build a temporary object URL from a Blob; remember to revoke when unmounting. */
export function blobURL(blob?: Blob): string | undefined {
  return blob ? URL.createObjectURL(blob) : undefined;
}
