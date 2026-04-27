/**
 * Mantrailing components registry.
 * Sourced from TRAINING_LOG_EN.xlsx and VARIABLES_ENTRENAMIENTO_eng.xlsx.
 * Emojis are used in the History heatmap.
 */

export const COMPONENT_KEYS = [
  'target',
  'weather',
  'door_obstacle_id',
  'split_trail',
  'obstacle_crossing',
  'high_find',
  'low_find',
  'back_track',
  'stop_go',
  'change_surface',
  'line_up',
  'walking_id',
  'contaminated_scent',
  'nsi',
  'vpu',
  'controlled_casting',
  'casting_intersection',
  'blind_trail',
  'bridge_crossing',
  'river_crossing'
] as const;

export type ComponentKey = (typeof COMPONENT_KEYS)[number];

export interface ComponentDef {
  key: ComponentKey;
  label: string;
  emoji: string;
  /** Phase the component is most often trained in (informational only). */
  phase: 'before' | 'start' | 'during' | 'end';
  hint?: string;
}

export const COMPONENTS: Record<ComponentKey, ComponentDef> = {
  target:               { key: 'target',               label: 'Target',                 emoji: '🎯', phase: 'before', hint: 'Take scent target' },
  weather:              { key: 'weather',               label: 'Weather',                emoji: '☁️', phase: 'before', hint: 'Adapt to weather conditions' },
  door_obstacle_id:     { key: 'door_obstacle_id',      label: 'Door / Obstacle ID',     emoji: '🚪', phase: 'end' },
  split_trail:          { key: 'split_trail',           label: 'Split Trail',            emoji: '🍴', phase: 'start' },
  obstacle_crossing:    { key: 'obstacle_crossing',     label: 'Obstacle Crossing',      emoji: '🪜', phase: 'during' },
  high_find:            { key: 'high_find',             label: 'High Find',              emoji: '⬆️', phase: 'end' },
  low_find:             { key: 'low_find',              label: 'Low Find',               emoji: '⬇️', phase: 'end' },
  back_track:           { key: 'back_track',            label: 'Back Track',             emoji: '↩️', phase: 'during' },
  stop_go:              { key: 'stop_go',               label: 'Stop / Go',              emoji: '🛑', phase: 'during' },
  change_surface:       { key: 'change_surface',        label: 'Change of Surface',      emoji: '🛣️', phase: 'during' },
  line_up:              { key: 'line_up',               label: 'Line Up',                emoji: '👥', phase: 'end' },
  walking_id:           { key: 'walking_id',            label: 'Walking ID',             emoji: '🚶', phase: 'end' },
  contaminated_scent:   { key: 'contaminated_scent',    label: 'Contaminated Scent Art.',emoji: '🧪', phase: 'start' },
  nsi:                  { key: 'nsi',                   label: 'NSI (No Scent / Indicate)', emoji: '❌', phase: 'start' },
  vpu:                  { key: 'vpu',                   label: 'VPU (Vehicle Pick Up)',  emoji: '🚗', phase: 'end' },
  controlled_casting:   { key: 'controlled_casting',    label: 'Controlled Casting',     emoji: '🎣', phase: 'during' },
  casting_intersection: { key: 'casting_intersection',  label: 'Casting in Intersection',emoji: '➕', phase: 'during' },
  blind_trail:          { key: 'blind_trail',           label: 'Blind Trail',            emoji: '🙈', phase: 'before' },
  bridge_crossing:      { key: 'bridge_crossing',       label: 'Bridge Crossing',        emoji: '🌉', phase: 'during' },
  river_crossing:       { key: 'river_crossing',        label: 'River Crossing',         emoji: '🌊', phase: 'during' }
};

export const COMPONENT_LIST: ComponentDef[] = COMPONENT_KEYS.map((k) => COMPONENTS[k]);

export type ComponentStatus = 'good' | 'problems' | 'with_help' | 'not_solved';

export const COMPONENT_STATUS: Record<ComponentStatus, { label: string; color: string; emoji: string }> = {
  good:       { label: 'Good',       color: 'good', emoji: '✅' },
  problems:   { label: 'Problems',   color: 'warn', emoji: '⚠️' },
  with_help:  { label: 'With Help',  color: 'help', emoji: '🤝' },
  not_solved: { label: 'Not Solved', color: 'bad',  emoji: '❌' }
};

export function getComponentLabel(key: string, customLabel?: string): string {
  if (key in COMPONENTS) return COMPONENTS[key as ComponentKey].label;
  return customLabel ?? key;
}

export function getComponentEmoji(key: string): string {
  if (key in COMPONENTS) return COMPONENTS[key as ComponentKey].emoji;
  return '⭐';
}
