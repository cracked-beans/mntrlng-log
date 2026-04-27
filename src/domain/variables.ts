/**
 * Mantrailing training variables. Faithful to VARIABLES_ENTRENAMIENTO_eng.xlsx.
 * Used to drive the New-Entry form's option lists.
 */

export const TYPE_OF_START = ['Intensity', 'Delayed Start', 'Scent Article', 'Casting', 'Flip'] as const;
export type TypeOfStart = (typeof TYPE_OF_START)[number];

export const TRAIL_KNOWLEDGE = [
  'Known',
  '100% Blind',
  'Blind with help',
  'Blind start',
  'Blind end',
  'Double blind'
] as const;
export type TrailKnowledge = (typeof TRAIL_KNOWLEDGE)[number];

export const AGE_OF_TRAIL = ['Fresh', '3 hours', '6 hours', '12 hours', '24 hours', '25+ hours'] as const;
export type AgeOfTrail = (typeof AGE_OF_TRAIL)[number];

export const TIME_OF_DAY = ['Dawn', 'Morning', 'Midday', 'Afternoon', 'Evening', 'Night'] as const;
export type TimeOfDay = (typeof TIME_OF_DAY)[number];

export const TRAIL_LENGTH = ['<100', '100-200', '200-300', '400-600', '600-800', '>800'] as const;
export type TrailLength = (typeof TRAIL_LENGTH)[number];

export const SURFACE = ['Asphalt', 'Cement', 'Earth', 'Grass', 'Gravel', 'Mud', 'Sand', 'Mixed'] as const;
export type Surface = (typeof SURFACE)[number];

export const WEATHER = [
  'Sun',
  '50% Cloudy',
  '100% Cloudy',
  'Light rain',
  'Heavy rain',
  'Breeze',
  'Wind',
  'Storm',
  'Fog',
  'Snow'
] as const;
export type Weather = (typeof WEATHER)[number];

export const RUNNER_PROFILE = [
  'Unknown',
  'Known',
  'Frequent',
  'Favourite',
  'Child',
  'Youth',
  'Adult',
  'Elderly',
  'Handicapped'
] as const;
export type RunnerProfile = (typeof RUNNER_PROFILE)[number];

export const SCENT_ARTICLE = [
  'Soft',
  'Hard',
  'Big',
  'Small',
  'Target',
  'Contaminated',
  'Bag',
  'No bag'
] as const;
export type ScentArticle = (typeof SCENT_ARTICLE)[number];

// --- Area: Rural / Urban / Mixed ---

export const AREA_KIND = ['Rural', 'Urban', 'Mixed', 'Other'] as const;
export type AreaKind = (typeof AREA_KIND)[number];

export const AREA_SUB: Record<AreaKind, readonly string[]> = {
  Rural: ['Soil', 'Farm Fields', 'Bushes', 'Woods', 'Meadows', 'Beach/Dunes', 'Mix'],
  Urban: ['City Center', 'Outskirts of city', 'Town center', 'Outskirts town', 'Residential Area', 'Shopping center', 'Industrial area', 'Sports area'],
  Mixed: ['Urban to rural', 'Rural to Urban'],
  Other: []
};

// --- End position of the runner ---

export const END_POSITION_VISIBILITY = ['On sight', 'Hidden', 'No runner at the end'] as const;
export type EndPositionVisibility = (typeof END_POSITION_VISIBILITY)[number];

export const END_POSITION_SUB: Record<EndPositionVisibility, readonly string[]> = {
  'On sight': ['Sitting', 'Standing', 'Crouching', 'Walking', 'Lying down'],
  'Hidden': ['High', 'Low', 'Behind door / obstacle', 'Lying down covered'],
  'No runner at the end': []
};

export interface EndPosition {
  visibility: EndPositionVisibility;
  sub?: string;
}

export interface AreaSelection {
  kind: AreaKind;
  sub?: string;
}

// --- 1-5 rating type used in handler/dog evaluation ---
export type Rating = 1 | 2 | 3 | 4 | 5;
export const RATINGS: Rating[] = [1, 2, 3, 4, 5];

// --- "We do NOT decide" reminder list (informational) ---
export const WE_DO_NOT_DECIDE = [
  'Weather changes',
  'Distractions',
  'Unexpected situations',
  'Problems of the runner',
  'Problems of the dog',
  'Handler problems'
] as const;
