import type { Entry, Dog } from '@/db/schema';
import type { FilterState } from '@/store/ui';
import { getComponentLabel } from '@/domain/components';

export function applyFilters(
  entries: Entry[],
  filters: FilterState,
  opts: { dogs?: Dog[] } = {}
): Entry[] {
  const q = filters.query.trim().toLowerCase();
  const tags = filters.tags;
  const from = filters.dateFrom;
  const to = filters.dateTo;
  const dogId = filters.dogId;
  const dogNameById = new Map<string, string>();
  (opts.dogs ?? []).forEach((d) => dogNameById.set(d.id, d.name));

  return entries.filter((e) => {
    if (dogId && e.dogId !== dogId) return false;
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    if (tags.length && !tags.every((t) => e.tags.includes(t))) return false;
    if (!q) return true;

    const dogName = dogNameById.get(e.dogId) ?? '';
    const haystack = [
      dogName,
      e.location ?? '',
      e.instructor ?? '',
      e.goal ?? '',
      e.trailComments ?? '',
      e.observations ?? '',
      e.handlerEval?.comments ?? '',
      e.dogEval?.comments ?? '',
      e.tags.join(' '),
      e.components.map((c) => `${getComponentLabel(c.key, c.customLabel)} ${c.comments ?? ''}`).join(' ')
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function collectAllTags(entries: Entry[]): string[] {
  const set = new Set<string>();
  entries.forEach((e) => e.tags.forEach((t) => set.add(t)));
  return [...set].sort();
}
