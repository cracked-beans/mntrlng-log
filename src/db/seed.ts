import { nanoid } from 'nanoid';
import { db } from './db';
import type { Dog, Entry, Handler } from './schema';

/** Insert a tiny demo dataset for first-run / dev. Idempotent: skips if data exists. */
export async function seedDemoData(): Promise<{ inserted: boolean; dogId?: string }> {
  const dogCount = await db.dogs.count();
  const entryCount = await db.entries.count();
  if (dogCount > 0 || entryCount > 0) return { inserted: false };

  const now = Date.now();

  const dog: Dog = {
    id: nanoid(),
    name: 'Rex',
    breed: 'German Shepherd',
    dob: '2021-04-12',
    notes: 'Demo dog — delete or edit me from Settings.',
    isDefault: true,
    createdAt: now
  };

  const handler: Handler = {
    id: nanoid(),
    name: 'Me',
    isDefault: true,
    createdAt: now
  };

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return iso(d);
  };

  const entries: Entry[] = [
    {
      id: nanoid(),
      dogId: dog.id,
      handlerId: handler.id,
      date: daysAgo(0),
      time: '09:30',
      location: 'Riverside Park',
      instructor: 'Mònica',
      typeOfStart: 'Delayed Start',
      trailKnowledge: 'Known',
      ageOfTrail: '3 hours',
      timeOfDay: 'Morning',
      area: { kind: 'Rural', sub: 'Woods' },
      surface: 'Mixed',
      weather: ['Sun', 'Breeze'],
      length: '400-600',
      runner: 'Frequent',
      scentArticle: ['Soft', 'Bag'],
      endPosition: { visibility: 'Hidden', sub: 'Behind door / obstacle' },
      components: [
        { key: 'door_obstacle_id', status: 'good' },
        { key: 'split_trail', status: 'problems', comments: 'Lost it at the Y, recovered after casting.' },
        { key: 'high_find', status: 'with_help' }
      ],
      goal: 'Confirm Door ID under mild distractions.',
      trailComments: 'Solid trail. Dog confident throughout.',
      observations: 'Two joggers passed near the second leg.',
      handlerEval: { startingRoutine: 4, leashHandling: 3, bodyPosition: 4, readingTheDog: 3 },
      dogEval: { motivation: 5, confidence: 4, negatives: 4, other: 4 },
      tags: ['green-belt', 'door-id'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: nanoid(),
      dogId: dog.id,
      handlerId: handler.id,
      date: daysAgo(2),
      time: '17:45',
      location: 'Old Town Square',
      typeOfStart: 'Scent Article',
      trailKnowledge: 'Blind start',
      ageOfTrail: '6 hours',
      timeOfDay: 'Evening',
      area: { kind: 'Urban', sub: 'City Center' },
      surface: 'Asphalt',
      weather: ['100% Cloudy'],
      length: '200-300',
      runner: 'Unknown',
      scentArticle: ['Hard', 'Small'],
      endPosition: { visibility: 'On sight', sub: 'Sitting' },
      components: [
        { key: 'change_surface', status: 'good' },
        { key: 'casting_intersection', status: 'with_help', comments: 'Helped with one cast at the fountain.' }
      ],
      goal: 'Surface change asphalt → cobble.',
      handlerEval: { startingRoutine: 4, leashHandling: 4, bodyPosition: 3, readingTheDog: 4 },
      dogEval: { motivation: 4, confidence: 4, negatives: 3, other: 3 },
      tags: ['urban'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: nanoid(),
      dogId: dog.id,
      handlerId: handler.id,
      date: daysAgo(5),
      time: '07:10',
      location: 'Mountain Trailhead',
      typeOfStart: 'Casting',
      trailKnowledge: '100% Blind',
      ageOfTrail: '12 hours',
      timeOfDay: 'Dawn',
      area: { kind: 'Rural', sub: 'Meadows' },
      surface: 'Earth',
      weather: ['Fog'],
      length: '600-800',
      runner: 'Adult',
      scentArticle: ['Soft', 'No bag'],
      endPosition: { visibility: 'Hidden', sub: 'High' },
      components: [
        { key: 'controlled_casting', status: 'good' },
        { key: 'high_find', status: 'good' },
        { key: 'blind_trail', status: 'problems', comments: 'Hesitated at start, took 30s to commit.' }
      ],
      goal: 'Long blind trail with cold-track casting.',
      handlerEval: { startingRoutine: 5, leashHandling: 4, bodyPosition: 4, readingTheDog: 5 },
      dogEval: { motivation: 5, confidence: 5, negatives: 4, other: 5 },
      tags: ['mountain', 'blind'],
      createdAt: now,
      updatedAt: now
    }
  ];

  await db.transaction('rw', db.dogs, db.handlers, db.entries, async () => {
    await db.dogs.add(dog);
    await db.handlers.add(handler);
    await db.entries.bulkAdd(entries);
  });

  return { inserted: true, dogId: dog.id };
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.dogs, db.handlers, db.entries, db.attachments, async () => {
    await db.attachments.clear();
    await db.entries.clear();
    await db.handlers.clear();
    await db.dogs.clear();
  });
}
