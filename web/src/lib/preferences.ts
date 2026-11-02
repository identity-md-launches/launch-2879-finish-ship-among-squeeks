/** Storage is optional: blocked cookies/private browsing must never prevent play. */
export function readPreference(key: string): string | null {
  try { return localStorage.getItem(`among-squeeks:${key}`); } catch { return null; }
}

export function writePreference(key: string, value: string) {
  try { localStorage.setItem(`among-squeeks:${key}`, value); } catch { /* Session still works. */ }
}
