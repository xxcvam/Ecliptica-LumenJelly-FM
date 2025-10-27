import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { ModelManager, type ModelInfo } from '../vis/ModelManager';
import './ModelUploader.css';

interface ModelUploaderProps {
  onModelSelect?: (src: string) => void;
}

export function ModelUploader({ onModelSelect }: ModelUploaderProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载模型列表
  const loadModels = useCallback(async () => {
    try {
      const list = await ModelManager.getModelList();
      setModels(list);
    } catch (e) {
      console.error('Failed to load model list:', e);
      setError('无法加载模型列表');
    }
  }, []);

  // 初始化加载
  useState(() => {
    loadModels();
  });

  // 处理文件上传
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        const validation = await ModelManager.validateModel(file);
        if (!validation.valid) {
          setError(validation.error || '文件验证失败');
          setUploading(false);
          return;
        }

        await ModelManager.uploadModel(file);
        await loadModels();
        setUploading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : '上传失败');
        setUploading(false);
      }
    },
    [loadModels]
  );

  // 拖拽处理
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ['.glb', '.gltf'].some((ext) => f.name.toLowerCase().endsWith(ext))
      );

      if (files.length > 0) {
        await handleFile(files[0]);
      }
    },
    [handleFile]
  );

  // 文件选择处理
  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFile(file);
      }
    },
    [handleFile]
  );

  // 删除模型
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('确定要删除这个模型吗？')) return;

      try {
        await ModelManager.deleteModel(id);
        await loadModels();
      } catch (e) {
        setError('删除失败');
      }
    },
    [loadModels]
  );

  // 选择模型
  const handleSelect = useCallback(
    (src: string) => {
      onModelSelect?.(src);
    },
    [onModelSelect]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="model-uploader">
      <h3 className="model-uploader-title">3D 模型管理</h3>

      {/* 上传区域 */}
      <div
        className="model-upload-dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div className="model-upload-loading">上传中...</div>
        ) : (
          <>
            <div className="model-upload-icon">📦</div>
            <p>拖拽 glTF/GLB 文件到这里</p>
            <p className="model-upload-hint">或点击选择文件（最大 10MB）</p>
          </>
        )}
      </div>

      {error && <div className="model-upload-error">{error}</div>}

      {/* 模型列表 */}
      {models.length > 0 && (
        <div className="model-list">
          <h4>已上传的模型（{models.length}）</h4>
          {models.map((model) => (
            <div key={model.id} className="model-item">
              <div className="model-info">
                <div className="model-name">{model.name}</div>
                <div className="model-meta">
                  {formatFileSize(model.fileSize)}
                  {' • '}
                  {new Date(model.uploadTime).toLocaleDateString('zh-CN')}
                </div>
              </div>
              <div className="model-actions">
                <button
                  className="btn-select"
                  onClick={() => handleSelect(model.src)}
                  title="使用此模型"
                >
                  使用
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(model.id)}
                  title="删除"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {models.length === 0 && !uploading && (
        <div className="model-empty">暂无上传的模型</div>
      )}
    </div>
  );
}

