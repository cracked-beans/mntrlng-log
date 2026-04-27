import { gpx as gpxToGeoJSON } from '@tmcw/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import type { FeatureCollection, LineString, MultiLineString, Position } from 'geojson';

export type Track = { coords: Array<[number, number]>; lengthM: number };

/** Parse a GPX XML string into a GeoJSON FeatureCollection. */
export function parseGpx(text: string): FeatureCollection {
  const xml = new DOMParser().parseFromString(text, 'text/xml') as unknown as Document;
  return gpxToGeoJSON(xml) as FeatureCollection;
}

/** Extract simple lat/lng tracks from a GPX FeatureCollection. */
export function extractTracks(fc: FeatureCollection): Track[] {
  const tracks: Track[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'LineString') {
      tracks.push(toTrack((g as LineString).coordinates));
    } else if (g.type === 'MultiLineString') {
      for (const line of (g as MultiLineString).coordinates) tracks.push(toTrack(line));
    }
  }
  return tracks;
}

function toTrack(coords: Position[]): Track {
  const latlngs = coords
    .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]))
    .map<[number, number]>((c) => [c[1], c[0]]); // GeoJSON is [lng, lat] — flip for Leaflet
  return { coords: latlngs, lengthM: lengthMeters(latlngs) };
}

/** Haversine distance in metres along a polyline. */
export function lengthMeters(latlngs: Array<[number, number]>): number {
  const R = 6371000;
  let m = 0;
  for (let i = 1; i < latlngs.length; i++) {
    const [lat1, lng1] = latlngs[i - 1];
    const [lat2, lng2] = latlngs[i];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    m += 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  return m;
}

export const GPX_ROLE_COLORS: Record<string, string> = {
  dog: '#0ea5e9',     // sky-500
  runner: '#f97316',  // orange-500
  custom: '#a855f7'   // purple-500
};

export function defaultColorFor(role: 'dog' | 'runner' | 'custom'): string {
  return GPX_ROLE_COLORS[role];
}
