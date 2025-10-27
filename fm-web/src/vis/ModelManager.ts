/**
 * 3D 模型管理器
 * 负责模型上传、验证、缓存和列表管理
 */

export type ModelInfo = {
  id: string;
  name: string;
  src: string;
  fileSize: number;
  uploadTime: number;
  thumbnail?: string;
};

const DB_NAME = 'LumenJelly_Models';
const STORE_NAME = 'models';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

let db: IDBDatabase | null = null;

export class ModelManager {
  /**
   * 初始化 IndexedDB
   */
  static async initDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('uploadTime', 'uploadTime', { unique: false });
        }
      };
    });
  }

  /**
   * 验证模型文件
   */
  static async validateModel(file: File): Promise<{ valid: boolean; error?: string }> {
    // 检查文件格式
    const validExtensions = ['.glb', '.gltf'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return { valid: false, error: '仅支持 .glb 或 .gltf 格式' };
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    // 检查文件是否为有效的 glTF/GLB
    // 这里可以做更深入的验证，比如检查文件头部
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    if (fileName.endsWith('.glb')) {
      // GLB 文件应该以 "glTF" magic number 开头（在小端序中）
      // 实际上 GLB 以 'glTF' 开头后面跟着版本号
      if (uint8[0] !== 0x67 || uint8[1] !== 0x6c || uint8[2] !== 0x54 || uint8[3] !== 0x46) {
        return { valid: false, error: '无效的 GLB 文件格式' };
      }
    }

    return { valid: true };
  }

  /**
   * 上传模型到本地存储
   */
  static async uploadModel(file: File): Promise<string> {
    const validation = await this.validateModel(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    await this.initDB();

    const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const modelInfo: ModelInfo = {
      id,
      name: file.name,
      src: await this.storeFile(file),
      fileSize: file.size,
      uploadTime: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(modelInfo);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 存储文件到本地对象 URL
   */
  private static async storeFile(file: File): Promise<string> {
    // 使用 Blob URL 存储文件引用
    return URL.createObjectURL(file);
  }

  /**
   * 获取可用模型列表
   */
  static async getModelList(): Promise<ModelInfo[]> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('uploadTime');
      const request = index.getAll();

      request.onsuccess = () => {
        const models = request.result as ModelInfo[];
        resolve(models.sort((a, b) => b.uploadTime - a.uploadTime));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除用户模型
   */
  static async deleteModel(id: string): Promise<void> {
    await this.initDB();

    // 先获取模型信息以释放 Blob URL
    const model = await this.getModel(id);
    if (model) {
      URL.revokeObjectURL(model.src);
    }

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取单个模型信息
   */
  static async getModel(id: string): Promise<ModelInfo | null> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 预加载模型（优化性能）
   */
  static async preloadModel(src: string): Promise<void> {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to preload model: ${src}`);
      }
      // 模型已缓存到浏览器缓存
    } catch (error) {
      console.warn('Model preload failed:', error);
    }
  }

  /**
   * 清空所有用户模型
   */
  static async clearAllModels(): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 导出模型为 Blob（用于下载）
   */
  static async exportModelToBlob(src: string): Promise<Blob> {
    const response = await fetch(src);
    return response.blob();
  }
}

