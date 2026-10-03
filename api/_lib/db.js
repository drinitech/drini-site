import { neon } from '@neondatabase/serverless';

let client;

// Lazily created so a missing DATABASE_URL surfaces as a logged 500, not a crash at import.
export function sql(strings, ...values) {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    client = neon(process.env.DATABASE_URL);
  }
  return client(strings, ...values);
}
