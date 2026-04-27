/**
 * Persisted shapes for Dexie (IndexedDB). All data is local to the device.
 */

import type { ComponentStatus } from '@/domain/components';
import type {
  AgeOfTrail,
  AreaSelection,
  EndPosition,
  RunnerProfile,
  Rating,
  ScentArticle,
  Surface,
  TimeOfDay,
  TrailKnowledge,
  TrailLength,
  TypeOfStart,
  Weather
} from '@/domain/variables';

export type ID = string;

export interface Dog {
  id: ID;
  name: string;
  breed?: string;
  dob?: string; // YYYY-MM-DD
  notes?: string;
  photoBlob?: Blob;
  isDefault?: boolean;
  createdAt: number;
}

export interface Handler {
  id: ID;
  name: string;
  isDefault?: boolean;
  createdAt: number;
}

export interface ComponentResult {
  key: string; // ComponentKey or arbitrary string for custom "Other"
  customLabel?: string;
  status: ComponentStatus;
  comments?: string;
}

export interface HandlerEval {
  startingRoutine?: Rating;
  leashHandling?: Rating;
  bodyPosition?: Rating;
  readingTheDog?: Rating;
  comments?: string;
}

export interface DogEval {
  motivation?: Rating;
  confidence?: Rating;
  negatives?: Rating;
  other?: Rating;
  comments?: string;
}

export interface Entry {
  id: ID;
  dogId: ID;
  handlerId?: ID;

  date: string; // YYYY-MM-DD — heatmap & filters
  time?: string; // HH:mm
  location?: string; // free text
  geo?: { lat: number; lng: number };
  instructor?: string;

  typeOfStart?: TypeOfStart;
  trailKnowledge?: TrailKnowledge;
  ageOfTrail?: AgeOfTrail;
  timeOfDay?: TimeOfDay;
  area?: AreaSelection;
  surface?: Surface;
  weather?: Weather[];
  length?: TrailLength;
  runner?: RunnerProfile;
  scentArticle?: ScentArticle[];
  endPosition?: EndPosition;

  components: ComponentResult[];

  goal?: string;
  trailComments?: string; // assessment of the trail (free text)
  observations?: string; // distractions / unexpected / problems

  handlerEval?: HandlerEval;
  dogEval?: DogEval;

  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type AttachmentKind = 'gpx' | 'photo' | 'video_link';
export type GpxRole = 'dog' | 'runner' | 'custom';

export interface Attachment {
  id: ID;
  entryId: ID;
  kind: AttachmentKind;
  // gpx
  gpxRole?: GpxRole;
  gpxLabel?: string;
  gpxColor?: string;
  gpxText?: string;
  /** Cached track length in metres (computed once on insert for "Dog" tracks). */
  gpxLengthM?: number;
  // photo
  photoBlob?: Blob;
  thumbBlob?: Blob;
  width?: number;
  height?: number;
  // video link
  url?: string;
  caption?: string;
  createdAt: number;
}
