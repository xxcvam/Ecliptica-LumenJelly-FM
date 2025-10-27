<!-- 1879eb1e-657a-4cb4-a18a-31739a85fd2d c96fc370-bdcd-4cc5-8629-1dcb91e7e43b -->
# Ecliptica LumenJelly FM - 品牌重构与模型系统迭代

## 阶段 1：品牌重构

### 1.1 更新项目名称和元数据

- 修改 `fm-web/package.json`：
  - name: `"@ecliptica/lumenjelly-fm"`
  - version: `"1.0.0"`
  - description: `"WebAudio × Three.js × Rodin 模型的可视化 FM 合成器与音序器"`
  - author: `"Ecliptica Studio"`
  - repository: 更新为新仓库地址

- 修改 `fm-web/index.html`：
  - title: `"Ecliptica LumenJelly FM"`
  - meta description 更新为新品牌描述

### 1.2 更新文档

- 修改根目录 `README.md`：
  - 标题改为 `# Ecliptica LumenJelly FM`
  - 更新 tagline 和项目介绍
  - 添加品牌说明章节

- 修改 `fm-web/README.md` 保持一致

- 创建 `BRAND.md` 说明品牌定位：
  - LumenJelly 命名由来
  - 视觉系统：水母/海洋/霓虹美学
  - Logo 方向建议
  - 域名占位清单

### 1.3 Git 提交品牌重构

- 提交信息：`refactor: 品牌重构为 Ecliptica LumenJelly FM`

## 阶段 2：3D 模型系统实现

### 2.1 创建模型目录结构

```
fm-web/public/
  └── models/
      ├── default/          # 默认模型
      │   ├── teacup.glb
      │   └── whale.glb
      └── user/             # 用户上传模型缓存
```

### 2.2 增强 ModelStage.tsx

位置：`fm-web/src/vis/visuals/ModelStage.tsx`

当前状态：使用 `useLoader(GLTFLoader, src)` 加载单个模型

修改内容：

- 添加 fallback 逻辑（模型加载失败时显示默认几何体）
- 添加加载状态显示
- 支持动态切换模型源
- 优化模型缓存机制
```typescript
// 新增接口
type ModelStageParams = {
  src?: string;
  fallback?: boolean;  // 是否启用 fallback
  quality?: 'high' | 'low';
};

// 增强加载逻辑
function ModelInner({ audio, params }: VisualProps) {
  const [modelSrc, setModelSrc] = useState(params?.src || '/models/default/whale.glb');
  const [loadError, setLoadError] = useState(false);
  
  // 使用 Suspense 和 error boundary 处理加载
  // fallback 显示简单几何体（sphere 或 box）
}
```


### 2.3 创建模型管理器

新建文件：`fm-web/src/vis/ModelManager.ts`

功能：

- 模型上传验证（格式、大小限制）
- 模型预览生成
- 模型缓存管理（IndexedDB 或 localStorage）
- 模型列表管理
```typescript
export class ModelManager {
  // 验证模型文件（.glb, .gltf，< 10MB）
  static validateModel(file: File): Promise<boolean>
  
  // 上传模型到本地存储
  static uploadModel(file: File): Promise<string>
  
  // 获取可用模型列表
  static getModelList(): Promise<ModelInfo[]>
  
  // 删除用户模型
  static deleteModel(id: string): Promise<void>
  
  // 预加载模型（优化性能）
  static preloadModel(src: string): Promise<void>
}
```


### 2.4 创建模型上传 UI 组件

新建文件：`fm-web/src/ui/ModelUploader.tsx`

功能：

- 拖拽上传区域
- 文件选择按钮
- 上传进度显示
- 模型预览缩略图
- 已上传模型列表
- 切换/删除模型按钮

集成位置：在 `App.tsx` 的设置面板中添加"模型管理"标签

### 2.5 更新预设系统

修改 `fm-web/src/presets/map.ts`：

```typescript
// 为使用模型的预设添加 fallback
'Robot Teacup': { 
  visualId: 'model', 
  params: { 
    src: '/models/default/teacup.glb',
    fallback: true  // 模型加载失败时使用气泡效果
  } 
},
'Slow Whale': { 
  visualId: 'model', 
  params: { 
    src: '/models/default/whale.glb',
    fallback: true
  } 
}
```

### 2.6 添加模型切换 API

修改 `fm-web/src/App.tsx`：

```typescript
const [currentModelSrc, setCurrentModelSrc] = useState<string | null>(null);

// 添加模型切换回调
const handleModelChange = useCallback((src: string) => {
  setCurrentModelSrc(src);
  // 更新当前可视化参数
}, []);

// 传递给 VisualPanel
<VisualPanel 
  visualParams={{
    ...visualConfig.params,
    src: currentModelSrc || visualConfig.params?.src
  }}
/>
```

## 阶段 3：用户体验优化

### 3.1 添加加载状态

- 模型加载时显示 Loading Spinner
- 使用 React Suspense 包裹 ModelStage
- 添加加载进度条（基于 Three.js LoadingManager）

### 3.2 错误处理

- 模型加载失败提示
- 自动切换到 fallback 可视化
- 控制台友好的错误信息

### 3.3 性能优化

- 模型文件大小限制（建议 < 5MB）
- 使用 Draco 压缩的 glTF 优先
- 模型预加载机制
- 移动端降低模型精度

## 阶段 4：文档更新

### 4.1 创建模型使用指南

新建文件：`MODEL_GUIDE.md`

内容：

- 支持的模型格式
- 模型优化建议
- 如何使用 Blender 导出优化的 glTF
- 如何使用 Rodin 生成模型
- 上传和替换流程
- 最佳实践

### 4.2 更新 README

添加章节：

- 3D 模型系统说明
- 用户上传功能
- 默认模型列表

## 实施顺序

1. 品牌重构（package.json, README, 文档）
2. 模型目录结构创建
3. ModelManager 工具类
4. 增强 ModelStage.tsx
5. ModelUploader UI 组件
6. 集成到 App.tsx
7. 更新预设映射
8. 测试和文档

### To-dos

- [ ] 更新 package.json 和 index.html 的品牌元数据
- [ ] 更新 README.md 和创建 BRAND.md
- [ ] 创建 models/ 目录结构
- [ ] 实现 ModelManager.ts 工具类
- [ ] 增强 ModelStage.tsx 支持动态加载和 fallback
- [ ] 创建 ModelUploader.tsx 组件
- [ ] 在 App.tsx 集成模型管理功能
- [ ] 更新预设映射支持模型 fallback
- [ ] 创建 MODEL_GUIDE.md 文档
- [ ] 测试模型加载、上传和替换功能