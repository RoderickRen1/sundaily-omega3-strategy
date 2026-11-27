// State is local to the active browser tab. In-memory use still works if storage is unavailable.
const prefix='sundaily-platform:';
export function readSession(key, fallback=null) {
  try { return JSON.parse(sessionStorage.getItem(prefix+key)) ?? fallback; }
  catch { return fallback; }
}
export function writeSession(key,value) {
  try { sessionStorage.setItem(prefix+key,JSON.stringify(value)); }
  catch { /* Private or storage-restricted contexts may keep only in-page state. */ }
}
export function removeSession(key) {
  try { sessionStorage.removeItem(prefix+key); }
  catch { /* Storage is optional. */ }
}
