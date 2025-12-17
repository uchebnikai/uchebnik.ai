
import { Session, UserSettings } from '../types';

const DB_NAME = 'UchebnikAI_DB';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_SETTINGS = 'settings';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS);
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveSessionsToStorage = async (key: string, sessions: Session[]) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SESSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SESSIONS);
    store.put(sessions, key);
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("IndexedDB Save Error", error);
  }
};

export const getSessionsFromStorage = async (key: string): Promise<Session[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SESSIONS, 'readonly');
    const store = tx.objectStore(STORE_SESSIONS);
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error("IndexedDB Read Error", error);
    return [];
  }
};

export const saveSettingsToStorage = async (key: string, settings: UserSettings) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    store.put(settings, key);
  } catch (error) {
     console.error("Settings Save Error", error);
  }
};

export const getSettingsFromStorage = async (key: string): Promise<UserSettings | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    return null;
  }
};
