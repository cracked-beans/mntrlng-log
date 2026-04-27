import { db } from '@/db/db';
import type { Attachment, Dog, Entry, Handler } from '@/db/schema';

interface SerializedAttachment extends Omit<Attachment, 'photoBlob' | 'thumbBlob'> {
  photoBlobBase64?: string;
  photoBlobType?: string;
  thumbBlobBase64?: string;
  thumbBlobType?: string;
}

interface ExportShape {
  format: 'mtlog/v1';
  exportedAt: number;
  dogs: Dog[];
  handlers: Handler[];
  entries: Entry[];
  attachments: SerializedAttachment[];
}

async function blobToBase64(b: Blob): Promise<string> {
  const buf = await b.arrayBuffer();
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBlob(b64: string, type = 'application/octet-stream'): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function serializeDog(d: Dog): Promise<Omit<Dog, 'photoBlob'> & { photoBlobBase64?: string; photoBlobType?: string }> {
  const { photoBlob, ...rest } = d;
  if (!photoBlob) return rest;
  return { ...rest, photoBlobBase64: await blobToBase64(photoBlob), photoBlobType: photoBlob.type };
}

async function serializeAttachment(a: Attachment): Promise<SerializedAttachment> {
  const { photoBlob, thumbBlob, ...rest } = a;
  const out: SerializedAttachment = { ...rest };
  if (photoBlob) {
    out.photoBlobBase64 = await blobToBase64(photoBlob);
    out.photoBlobType = photoBlob.type;
  }
  if (thumbBlob) {
    out.thumbBlobBase64 = await blobToBase64(thumbBlob);
    out.thumbBlobType = thumbBlob.type;
  }
  return out;
}

export async function exportAll(): Promise<Blob> {
  const [dogs, handlers, entries, attachments] = await Promise.all([
    db.dogs.toArray(),
    db.handlers.toArray(),
    db.entries.toArray(),
    db.attachments.toArray()
  ]);

  const data: ExportShape = {
    format: 'mtlog/v1',
    exportedAt: Date.now(),
    dogs: await Promise.all(dogs.map(serializeDog)),
    handlers,
    entries,
    attachments: await Promise.all(attachments.map(serializeAttachment))
  };
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

export async function importAll(file: File): Promise<{ entries: number; dogs: number }> {
  const text = await file.text();
  const data = JSON.parse(text) as ExportShape;
  if (data.format !== 'mtlog/v1') throw new Error('Unrecognised file format.');

  const dogs = data.dogs.map((d: Dog & { photoBlobBase64?: string; photoBlobType?: string }) => {
    const photoBlob = d.photoBlobBase64 ? base64ToBlob(d.photoBlobBase64, d.photoBlobType) : undefined;
    const { photoBlobBase64: _b, photoBlobType: _t, ...rest } = d;
    return { ...rest, photoBlob };
  });

  const attachments = data.attachments.map((a) => {
    const photoBlob = a.photoBlobBase64 ? base64ToBlob(a.photoBlobBase64, a.photoBlobType) : undefined;
    const thumbBlob = a.thumbBlobBase64 ? base64ToBlob(a.thumbBlobBase64, a.thumbBlobType) : undefined;
    const { photoBlobBase64: _p, photoBlobType: _pt, thumbBlobBase64: _tb, thumbBlobType: _tt, ...rest } = a;
    return { ...rest, photoBlob, thumbBlob };
  });

  await db.transaction('rw', db.dogs, db.handlers, db.entries, db.attachments, async () => {
    await db.dogs.bulkPut(dogs);
    await db.handlers.bulkPut(data.handlers);
    await db.entries.bulkPut(data.entries);
    await db.attachments.bulkPut(attachments);
  });

  return { entries: data.entries.length, dogs: data.dogs.length };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
