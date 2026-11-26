const DB_NAME = "zamline";
const STORE = "pending-certificate";
const KEY = "current";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

let memoryCopy = null;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, action) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function savePendingCertificate(file, companyId) {
  const record = {
    file,
    name: file.name,
    type: file.type,
    companyId: String(companyId),
    savedAt: Date.now(),
  };
  memoryCopy = record;
  try {
    await withStore("readwrite", (store) => store.put(record, KEY));
  } catch {}
}

export async function clearPendingCertificate() {
  memoryCopy = null;
  try {
    await withStore("readwrite", (store) => store.delete(KEY));
  } catch {}
}

export async function getPendingCertificate(companyId) {
  let record = null;
  try {
    record = await withStore("readonly", (store) => store.get(KEY));
  } catch {
    record = memoryCopy;
  }
  if (!record) return null;

  const expired = Date.now() - record.savedAt > MAX_AGE_MS;
  const otherAccount = record.companyId !== String(companyId);
  if (expired || otherAccount) {
    await clearPendingCertificate();
    return null;
  }

  return record.file instanceof File
    ? record.file
    : new File([record.file], record.name, { type: record.type });
}
