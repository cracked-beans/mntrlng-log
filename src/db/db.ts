import Dexie, { type Table } from 'dexie';
import type { Attachment, Dog, Entry, Handler } from './schema';

class MTLogDB extends Dexie {
  dogs!: Table<Dog, string>;
  handlers!: Table<Handler, string>;
  entries!: Table<Entry, string>;
  attachments!: Table<Attachment, string>;

  constructor() {
    super('mtlog');

    this.version(1).stores({
      // & = primary key, * = multi-entry index
      dogs: '&id, name, isDefault, createdAt',
      handlers: '&id, name, isDefault, createdAt',
      entries: '&id, date, dogId, handlerId, createdAt, updatedAt, *tags',
      attachments: '&id, entryId, kind, createdAt'
    });
  }
}

export const db = new MTLogDB();
