// src/utils/storage.ts

/**
 * Type for storage areas in Chrome storage API
 */
export type StorageArea = 'local' | 'sync';

/**
 * Storage change listener cleanup function
 */
export type StorageListenerCleanup = () => void;

/**
 * Storage change callback function type
 */
export type StorageChangeCallback = (changes: { [key: string]: chrome.storage.StorageChange }) => void;

/**
 * Get data from Chrome's storage
 * @param key - The key to retrieve
 * @param storageArea - The storage area to use (local or sync)
 * @returns Promise that resolves with the data or null if not found
 */
export async function getFromStorage<T>(
  key: string,
  storageArea: StorageArea = 'local'
): Promise<T | null> {
  try {
    const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
    const result = await storage.get(key);
    return (key in result) ? (result[key] as T) : null;
  } catch (error) {
    console.error(`Error retrieving ${key} from ${storageArea} storage:`, error);
    return null;
  }
}

/**
 * Get multiple items from Chrome's storage
 * @param keys - Array of keys to retrieve
 * @param storageArea - The storage area to use (local or sync)
 * @returns Promise that resolves with an object containing the requested items
 */
export async function getMultipleFromStorage<T extends Record<string, any>>(
  keys: string[],
  storageArea: StorageArea = 'local'
): Promise<Partial<T>> {
  try {
    const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
    const result = await storage.get(keys);
    return result as Partial<T>;
  } catch (error) {
    console.error(`Error retrieving multiple keys from ${storageArea} storage:`, error);
    return {};
  }
}

/**
 * Set data in Chrome's storage
 * @param key - The key to set
 * @param data - The data to store
 * @param storageArea - The storage area to use (local or sync)
 * @returns Promise that resolves when data is stored
 * @throws Error if storage operation fails
 */
export async function setInStorage<T>(
  key: string,
  data: T,
  storageArea: StorageArea = 'local'
): Promise<void> {
  try {
    const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
    await storage.set({ [key]: data });
  } catch (error) {
    console.error(`Error storing ${key} in ${storageArea} storage:`, error);
    throw error;
  }
}

/**
 * Set multiple items in Chrome's storage
 * @param items - Object containing key-value pairs to store
 * @param storageArea - The storage area to use (local or sync)
 * @returns Promise that resolves when data is stored
 * @throws Error if storage operation fails
 */
export async function setMultipleInStorage<T extends Record<string, any>>(
  items: T,
  storageArea: StorageArea = 'local'
): Promise<void> {
  try {
    const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
    await storage.set(items);
  } catch (error) {
    console.error(`Error storing multiple items in ${storageArea} storage:`, error);
    throw error;
  }
}

/**
 * Remove data from Chrome's storage
 * @param key - The key to remove
 * @param storageArea - The storage area to use (local or sync)
 * @returns Promise that resolves when data is removed
 * @throws Error if remove operation fails
 */
export async function removeFromStorage(
  key: string,
  storageArea: StorageArea = 'local'
): Promise<void> {
  try {
    const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
    await storage.remove(key);
  } catch (error) {
    console.error(`Error removing ${key} from ${storageArea} storage:`, error);
    throw error;
  }
}

/**
 * Remove multiple items from Chrome's storage
 * @param keys - Array of keys to remove
 * @param storageArea - The storage area to use (local or sync)
 * @returns Promise that resolves when items are removed
 * @throws Error if remove operation fails
 */
export async function removeMultipleFromStorage(
  keys: string[],
  storageArea: StorageArea = 'local'
): Promise<void> {
  try {
    const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
    await storage.remove(keys);
  } catch (error) {
    console.error(`Error removing multiple keys from ${storageArea} storage:`, error);
    throw error;
  }
}

/**
 * Clear all data from Chrome's storage
 * @param storageArea - The storage area to clear (local or sync)
 * @returns Promise that resolves when storage is cleared
 * @throws Error if clear operation fails
 */
export async function clearStorage(
  storageArea: StorageArea = 'local'
): Promise<void> {
  try {
    const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
    await storage.clear();
  } catch (error) {
    console.error(`Error clearing ${storageArea} storage:`, error);
    throw error;
  }
}

/**
 * Listen for changes to Chrome's storage
 * @param keys - The key or keys to listen for changes to
 * @param callback - The function to call when changes occur
 * @param storageArea - The storage area to listen to (local or sync)
 * @returns A function that removes the listener when called
 */
export function addStorageListener(
  keys: string | string[],
  callback: StorageChangeCallback,
  storageArea: StorageArea = 'local'
): StorageListenerCleanup {
  const keysArray = Array.isArray(keys) ? keys : [keys];
  
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== storageArea) return;
    
    const relevantChanges = Object.entries(changes)
      .filter(([key]) => keysArray.includes(key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
    if (Object.keys(relevantChanges).length > 0) {
      callback(relevantChanges);
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
  
  // Return function to remove listener
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Get the byte size of a storage item
 * @param value - The value to measure
 * @returns Size in bytes
 */
export function getStorageItemSize(value: any): number {
  // Convert to JSON string and measure length
  const jsonString = JSON.stringify(value);
  
  // Each character in a string is 2 bytes in JavaScript
  return jsonString.length * 2;
}

/**
 * Check if storage is near its limit
 * @param storageArea - The storage area to check (local or sync)
 * @param thresholdPercent - Percentage threshold (0-100)
 * @returns Promise that resolves with a boolean indicating if storage is near limit
 */
export async function isStorageNearLimit(
  storageArea: StorageArea = 'local',
  thresholdPercent: number = 90
): Promise<boolean> {
  try {
    // Get bytes in use
    const bytesInUse = await new Promise<number>((resolve, reject) => {
      const storage = storageArea === 'local' ? chrome.storage.local : chrome.storage.sync;
      storage.getBytesInUse(null, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(bytesInUse);
        }
      });
    });
    
    // Get quota
    const quota = storageArea === 'local' 
      ? chrome.storage.local.QUOTA_BYTES 
      : chrome.storage.sync.QUOTA_BYTES;
    
    // Calculate percentage used
    const percentUsed = (bytesInUse / quota) * 100;
    
    return percentUsed >= thresholdPercent;
  } catch (error) {
    console.error(`Error checking storage limit for ${storageArea}:`, error);
    // Return true as a conservative estimate
    return true;
  }
}