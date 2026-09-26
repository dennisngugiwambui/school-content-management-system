import ResourceManager from './ResourceManager';
import { DEPARTMENTS, NEWS, PREFECTS, STAFF, TENDERS, USERS } from './resourceConfigs';

const CONFIGS = { departments: DEPARTMENTS, staff: STAFF, prefects: PREFECTS, news: NEWS, tenders: TENDERS, users: USERS };

export default function ResourcePage({ kind }) {
  // key forces a fresh manager (and fresh state) when switching between record types.
  return <ResourceManager key={kind} config={CONFIGS[kind]} />;
}
