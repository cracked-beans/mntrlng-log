import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Attachment } from '@/db/schema';
import { extractTracks, parseGpx } from '@/lib/gpx';
import { fmtMeters } from '@/lib/format';

// Fix default marker icons in Vite bundles
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface ParsedAttachment {
  attachment: Attachment;
  tracks: { coords: Array<[number, number]>; lengthM: number }[];
}

interface Props {
  attachments: Attachment[];
  height?: number | string;
  startMarker?: [number, number];
  className?: string;
}

function FitBounds({ all }: { all: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (!all.length) return;
    const bounds = L.latLngBounds(all.map((c) => L.latLng(c[0], c[1])));
    map.fitBounds(bounds.pad(0.15), { animate: false });
  }, [all, map]);
  return null;
}

export function TrailMap({ attachments, height = 280, startMarker, className }: Props) {
  const parsed = useMemo<ParsedAttachment[]>(() => {
    return attachments
      .filter((a) => a.kind === 'gpx' && a.gpxText)
      .map((a) => {
        try {
          return { attachment: a, tracks: extractTracks(parseGpx(a.gpxText!)) };
        } catch {
          return { attachment: a, tracks: [] };
        }
      });
  }, [attachments]);

  const all = useMemo(() => parsed.flatMap((p) => p.tracks.flatMap((t) => t.coords)), [parsed]);
  const containerRef = useRef<HTMLDivElement>(null);

  const center: [number, number] = startMarker ?? all[0] ?? [47.4979, 19.0402];

  return (
    <div ref={containerRef} className={className} style={{ height }}>
      <MapContainer
        center={center}
        zoom={all.length ? 14 : 6}
        scrollWheelZoom={false}
        className="w-full h-full rounded-xl overflow-hidden"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {parsed.map(({ attachment, tracks }) =>
          tracks.map((t, i) => (
            <Polyline
              key={`${attachment.id}-${i}`}
              positions={t.coords}
              pathOptions={{ color: attachment.gpxColor ?? '#0ea5e9', weight: 4, opacity: 0.85 }}
            >
              <Tooltip sticky>
                {(attachment.gpxLabel || attachment.gpxRole || 'track')} · {fmtMeters(t.lengthM)}
              </Tooltip>
            </Polyline>
          ))
        )}
        {startMarker && (
          <Marker position={startMarker}>
            <Tooltip>Start</Tooltip>
          </Marker>
        )}
        <FitBounds all={all.length ? all : startMarker ? [startMarker] : []} />
      </MapContainer>
    </div>
  );
}
