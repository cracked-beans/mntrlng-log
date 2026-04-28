// Generates a rich mtlog/v1 import file: 2 dogs, 2 handlers, 30 entries
// Run: node scripts/generate-dummy-data.mjs > public/dummy-data.json

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let seq = 100;
const uid = () => {
  seq++;
  return String(seq).padStart(4, '0') + ALPHABET.slice(0, 17);
};

const now = Date.now();

// ── Entities ─────────────────────────────────────────────────────────────────

const dog1 = { id: uid(), name: 'Luna', breed: 'Belgian Malinois', dob: '2020-07-15', notes: 'Very driven, needs calm starts.', isDefault: true, createdAt: now };
const dog2 = { id: uid(), name: 'Bolt', breed: 'Labrador Retriever', dob: '2022-02-03', notes: 'Confident in urban, still learning rural.', createdAt: now };
const handler1 = { id: uid(), name: 'Sara', isDefault: true, createdAt: now };
const handler2 = { id: uid(), name: 'Jordi', createdAt: now };

// ── Domain tables (mirrors src/domain/variables.ts & components.ts) ──────────

const TYPE_OF_START = ['Intensity', 'Delayed Start', 'Scent Article', 'Casting', 'Flip'];
const TRAIL_KNOWLEDGE = ['Known', 'Blind start', 'Blind end', '100% Blind', 'Blind w help', 'Double blind'];
const AGE = ['Fresh', '3 hours', '6 hours', '12 hours', '24 hours', '25+ hours'];
const TIME_OF_DAY = ['Dawn', 'Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
const SURFACE = ['Asphalt', 'Cement', 'Earth', 'Grass', 'Gravel', 'Mud', 'Sand', 'Mixed'];
const WEATHER = ['Sun', '50% Cloudy', '100% Cloudy', 'Light rain', 'Heavy rain', 'Breeze', 'Wind', 'Storm', 'Fog', 'Snow'];
const RUNNER = ['Unknown', 'Known', 'Frequent', 'Favourite', 'Child', 'Youth', 'Adult', 'Elderly', 'Handicapped'];
const SCENT = ['Soft', 'Hard', 'Big', 'Small', 'Target', 'Contaminated', 'Bag', 'No bag'];
const LENGTH = ['<100', '100-200', '200-300', '400-600', '600-800', '>800'];
const STATUSES = ['good', 'problems', 'with_help', 'not_solved'];

const AREA_OPTIONS = [
  { kind: 'Rural', sub: 'Woods' }, { kind: 'Rural', sub: 'Meadows' },
  { kind: 'Rural', sub: 'Farm' }, { kind: 'Rural', sub: 'Beach' },
  { kind: 'Urban', sub: 'City Center' }, { kind: 'Urban', sub: 'Residential' },
  { kind: 'Urban', sub: 'Industrial' }, { kind: 'Urban', sub: 'Shopping' },
  { kind: 'Mixed', sub: undefined }
];

const END_OPTIONS = [
  { visibility: 'On sight', sub: 'Sitting' }, { visibility: 'On sight', sub: 'Standing' },
  { visibility: 'Hidden', sub: 'Behind door / obstacle' }, { visibility: 'Hidden', sub: 'High' },
  { visibility: 'Hidden', sub: 'Low' }, { visibility: 'No runner', sub: undefined }
];

const COMPONENTS = [
  'target', 'weather', 'door_obstacle_id', 'split_trail', 'obstacle_crossing',
  'high_find', 'low_find', 'back_track', 'stop_go', 'change_surface',
  'line_up', 'walking_id', 'contaminated_scent', 'nsi', 'vpu',
  'controlled_casting', 'casting_intersection', 'blind_trail', 'bridge', 'river'
];

const COMP_COMMENTS = {
  split_trail: ['Lost at the Y, recovered with one cast.', 'Clean split, good commitment.', 'Overshot and needed redirection.'],
  high_find: ['Needed handler to signal area.', 'Found independently — great!', 'Slow approach but correct.'],
  blind_trail: ['Hesitated 30s before committing.', 'Confident from first step.', 'Required two restarts.'],
  casting_intersection: ['Clean cast at crossroads.', 'One incorrect cast then self-corrected.'],
  back_track: ['Confused by loop, handler helped orient.', 'Tracked clean both ways.'],
  obstacle_crossing: ['Went around twice then crossed.', 'No hesitation at fence.'],
  door_obstacle_id: ['Perfect ID, sat immediately.', 'Overshot door, looped back.'],
  change_surface: ['Slowed on asphalt → cobble transition.', 'No issue with surface change.'],
  controlled_casting: ['Wide but systematic cast.', 'Needed handler to shorten line.'],
};

const TAGS = [
  ['green-belt'], ['urban'], ['mountain', 'blind'], ['door-id'], ['cold-trail'],
  ['competition-prep'], ['night-session'], ['rain'], ['split-trail'], ['rehab'],
  ['green-belt', 'door-id'], ['urban', 'competition-prep'], ['mountain'], ['fog'],
  ['long-trail', 'blind'], ['refresh'], []
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

// ── Generate entries ──────────────────────────────────────────────────────────

// Spread 30 entries over the last 12 months, denser in recent months
const TODAY = new Date('2026-04-28');
const dateISO = (daysAgo) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

// Roughly 30 dates spread across 365 days, clustered toward recent
const DAYS_AGO = [
  0, 2, 4, 7, 9, 12, 15, 18, 22, 26,
  30, 35, 42, 50, 58, 65, 73, 82, 91, 105,
  120, 138, 155, 172, 190, 215, 240, 270, 310, 355
];

const dogs = [dog1, dog2];
const handlers = [handler1, handler2];

let rng = 1; // deterministic-ish
const det = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return Math.abs(rng) / 0x7fffffff; };
const detPick = (arr) => arr[Math.floor(det() * arr.length)];

const entries = DAYS_AGO.map((daysAgo, i) => {
  const dog = i % 3 === 0 ? dog2 : dog1;
  const handler = i % 5 === 0 ? handler2 : handler1;
  const numComps = 1 + Math.floor(det() * 4); // 1-4 components
  const compKeys = pickN(COMPONENTS, numComps);

  const components = compKeys.map((key) => {
    const status = detPick(STATUSES);
    const commentPool = COMP_COMMENTS[key];
    const comments = commentPool && status !== 'good' ? detPick(commentPool) : undefined;
    return { key, status, ...(comments ? { comments } : {}) };
  });

  const weatherCount = 1 + Math.floor(det() * 2);
  const weatherPick = pickN(WEATHER, weatherCount);
  const scentCount = 1 + Math.floor(det() * 2);
  const scentPick = pickN(SCENT, scentCount);

  const hrRaw = detPick(['06', '07', '08', '09', '10', '11', '14', '15', '16', '17', '18', '20', '21']);
  const minRaw = detPick(['00', '15', '30', '45']);
  const time = `${hrRaw}:${minRaw}`;

  const locations = [
    'Riverside Park', 'Old Town Square', 'Mountain Trailhead', 'Industrial Zone',
    'Pine Forest Clearing', 'Harbour District', 'Sports Complex', 'University Campus',
    'Farmland Track', 'Beach Promenade', 'Shopping District', 'Residential Block B',
    'Nature Reserve — East', 'Quarry Road', 'Railway Embankment'
  ];
  const instructors = ['Mònica', 'Jaume', 'Elena', undefined, undefined];

  const r = (lo, hi) => lo + Math.floor(det() * (hi - lo + 1));
  const rating = () => r(2, 5);

  return {
    id: uid(),
    dogId: dog.id,
    handlerId: handler.id,
    date: dateISO(daysAgo),
    time,
    location: detPick(locations),
    instructor: detPick(instructors),
    typeOfStart: detPick(TYPE_OF_START),
    trailKnowledge: detPick(TRAIL_KNOWLEDGE),
    ageOfTrail: detPick(AGE),
    timeOfDay: detPick(TIME_OF_DAY),
    area: detPick(AREA_OPTIONS),
    surface: detPick(SURFACE),
    weather: weatherPick,
    length: detPick(LENGTH),
    runner: detPick(RUNNER),
    scentArticle: scentPick,
    endPosition: detPick(END_OPTIONS),
    components,
    goal: detPick([
      'Confirm Door ID under distractions.',
      'Surface change: asphalt → cobble.',
      'Long cold trail with casting start.',
      'First blind trail at this location.',
      'Improve leash handling under pressure.',
      'Test high-find in urban setting.',
      'Competition-simulation run.',
      'Work on split trail recovery.',
      'Night trail with fog conditions.',
      'Back-track on known route.'
    ]),
    trailComments: detPick([
      'Solid session overall.',
      'Dog performed above expectations.',
      'Heat affected pace in final 200m.',
      'Great focus despite dog traffic.',
      'Noisy environment — dog stayed on track.',
      'Needed two restarts due to distraction.',
      undefined
    ]),
    observations: detPick([
      'Two cyclists passed near leg 2.',
      'Strong cross-wind in the open field section.',
      'Food distraction near finish — dog ignored.',
      undefined, undefined, undefined
    ]),
    handlerEval: {
      startingRoutine: rating(),
      leashHandling: rating(),
      bodyPosition: rating(),
      readingTheDog: rating()
    },
    dogEval: {
      motivation: rating(),
      confidence: rating(),
      negatives: rating(),
      other: rating()
    },
    tags: detPick(TAGS),
    createdAt: now - daysAgo * 86400000,
    updatedAt: now - daysAgo * 86400000
  };
});

// ── Output ────────────────────────────────────────────────────────────────────

const payload = {
  format: 'mtlog/v1',
  exportedAt: now,
  dogs: [dog1, dog2],
  handlers: [handler1, handler2],
  entries,
  attachments: []
};

process.stdout.write(JSON.stringify(payload, null, 2));
