const DB_NOT_INITED = 0;
const DB_READY = 2;
const DB_BUSY = 3;
const DB_RETRIEVED = 4;
const DB_ERROR = 5;

function dateToInt() {
  const date = new Date();

  const year = date.getFullYear();
  // JavaScript counts months from 0 to 11, so we need to add 1 to get the correct month number
  //@ts-ignore
  const month = String(date.getMonth() + 1).padStart(2, '0');//@ts-ignore
  const day = String(date.getDate()).padStart(2, '0');//@ts-ignore
  const hours = String(date.getHours()).padStart(2, '0');//@ts-ignore
  const minutes = String(date.getMinutes()).padStart(2, '0');//@ts-ignore
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const dateInt = parseInt(`${year}${month}${day}${hours}${minutes}${seconds}`);

  return dateInt;
}


class CacheDB {
  static db: IDBDatabase;
  private static verions = {};

  static init(){
    if(CacheDB.db){
      return;
    }
    const openRequest = indexedDB.open('MyDatabase', Date.now());
    openRequest.onupgradeneeded = function (e) {
      //@ts-ignore
      CacheDB.db = e.target.result;
      try {
        CacheDB.db.deleteObjectStore('MyObjectStore');
      }catch(e){
        console.log("no object store to delete");
      }
      CacheDB.db.createObjectStore('MyObjectStore', { keyPath: 'key' });
      //@ts-ignore
    };
    openRequest.onerror = function (e) {
      //@ts-ignore
      console.error('Error opening database:', e.target.error);
    };
    openRequest.onsuccess = function (e) {
      //@ts-ignore
      console.log('Database initialised');
    };
  }

  static async updateAllKeys() {
    const transaction = CacheDB.db.transaction('MyObjectStore', 'readonly');
    const store = transaction.objectStore('MyObjectStore');
    const request = store.getAllKeys();

    request.onsuccess = function () {
      let keys = request.result as string[];
      keys.forEach((key) => {
        if(CacheDB.verions[key]){
          return;//already updated
        }else{
          CacheDB.verions[key] = 0;//new item
        }
      })
    };

    request.onerror = function () {
      XlogError('Error fetching all keys: '+request.error);
    };
  }

  static ifHasKey(key:string) {
    return CacheDB.verions[key] != null;
  }

  static async get(key) {
    const transaction = CacheDB.db.transaction('MyObjectStore', 'readonly');
    const store = transaction.objectStore('MyObjectStore');
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = function () {
        resolve(request.result ? request.result.value : null);
        console.log("CACHE: "+ key + " fetched");
      };

      request.onerror = function () {
        resolve("error");
        console.error('Error fetching value:', request.error);
      };
    })
  }
  static getVersion(key) {
    let version = CacheDB.verions[key];
    if(version == null){
      console.error("db not recorded version for key: "+key);
    }
    return version;
  }
  static async set(key, value, version) {

    if(version>0){
      if(CacheDB.verions[key] == null){
        console.error("db not recorded version for key: "+key);
        return;
      }else if(CacheDB.verions[key] >= version){
        console.error("db version is not older than the version of the data to be set, saving aborted: "+key);
        return;
      } 
      else{
        CacheDB.verions[key] = version;
      }
    }else{
      CacheDB.verions[key] = 0;
    }


    const transaction = CacheDB.db.transaction('MyObjectStore', 'readwrite');
    const store = transaction.objectStore('MyObjectStore');
    const request = store.put({ key: key, value: value });

    request.onsuccess = function () {
      console.log("CACHE: Value set for key:", key, "version:", version);
    };
 
    request.onerror = function () {
      console.error('CACHE: Error setting value:', request.error);
    };
  }

  static delete(key) {
    const transaction = CacheDB.db.transaction('MyObjectStore', 'readwrite');
    const store = transaction.objectStore('MyObjectStore');
    const request = store.delete(key);

    request.onsuccess = function () {
      console.log('Key deleted:', key);
    };

    request.onerror = function () {
      console.error('Error deleting key:', request.error);
    };
  }

}




