// Exports:
export const getIndexedDBSize = async (dbName: string): Promise<number> => {
  if (!('indexedDB' in window)) throw new Error('IndexedDB is not supported')

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)
    
    request.onerror = () => reject(new Error('Failed to open database'))
    
    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      let totalSize = 0
      
      try {
        const objectStoreNames = Array.from(db.objectStoreNames)
        
        for (const storeName of objectStoreNames) {
          const transaction = db.transaction(storeName, 'readonly')
          const objectStore = transaction.objectStore(storeName)
          const getAllRequest = objectStore.getAll()
          
          const items = await new Promise<any[]>((res, rej) => {
            getAllRequest.onsuccess = () => res(getAllRequest.result)
            getAllRequest.onerror = () => rej(getAllRequest.error)
          })
          
          for (const item of items) {
            totalSize += new Blob([JSON.stringify(item)]).size
          }
          
          const getAllKeysRequest = objectStore.getAllKeys()
          const keys = await new Promise<IDBValidKey[]>((res, rej) => {
            getAllKeysRequest.onsuccess = () => res(getAllKeysRequest.result)
            getAllKeysRequest.onerror = () => rej(getAllKeysRequest.error)
          })
          
          for (const key of keys) {
            totalSize += new Blob([JSON.stringify(key)]).size
          }
        }
        
        db.close()
        resolve(totalSize)
      } catch (error) {
        db.close()
        reject(error)
      }
    }
  })
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const getStorageEstimate = async (): Promise<{usage: number, quota: number}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    }
  }
  throw new Error('Storage API not supported')
}

export const getIndexedDBQuota = async (): Promise<{
  quota: number
  usage: number
  available: number
  percentUsed: number
}> => {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    throw new Error('Storage API not supported')
  }

  const estimate = await navigator.storage.estimate()
  const quota = estimate.quota || 0
  const usage = estimate.usage || 0
  const available = quota - usage
  const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

  return {
    quota,
    usage,
    available,
    percentUsed
  }
}
