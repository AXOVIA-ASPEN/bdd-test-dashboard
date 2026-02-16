import { Timestamp } from 'firebase/firestore';

/** Convert Firestore Timestamps to ISO strings recursively */
export function sanitizeTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Timestamp) {
      out[k] = v.toDate().toISOString();
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitizeTimestamps(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      out[k] = v.map(item =>
        item instanceof Timestamp ? item.toDate().toISOString() :
        item && typeof item === 'object' ? sanitizeTimestamps(item as Record<string, unknown>) : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}
