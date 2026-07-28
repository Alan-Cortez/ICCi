import { memberOperations } from './members.js';
import { eventOperations } from './events.js';
import { fundOperations } from './funds.js';
import { userOperations } from './users.js';
import { ministryOperations } from './ministries.js';
import { youthOperations } from './youth.js';
import { attendanceOperations } from './attendance.js';
import { complianceOperations } from './compliance.js';
import { leadershipOperations } from './leadership.js';
import { noteOperations } from './notes.js';
import { notificationOperations } from './notifications.js';
import { sermonOperations } from './sermons.js';
import { verseOperations } from './verses.js';
import { statsOperations } from './stats.js';
import { pendingOperations } from './pending.js';

const operations = {
  ...memberOperations,
  ...eventOperations,
  ...fundOperations,
  ...userOperations,
  ...ministryOperations,
  ...youthOperations,
  ...attendanceOperations,
  ...complianceOperations,
  ...leadershipOperations,
  ...noteOperations,
  ...notificationOperations,
  ...sermonOperations,
  ...verseOperations,
  ...statsOperations,
  ...pendingOperations,
};

export function getOperation(name) {
  return operations[name] ?? null;
}

export function listOperations() {
  return Object.keys(operations);
}

export default operations;
