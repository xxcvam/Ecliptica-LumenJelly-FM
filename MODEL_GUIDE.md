# 3D 模型使用指南

Ecliptica LumenJelly FM 支持使用自定义 3D 模型来增强可视化体验。

## 支持的格式

### GLB（推荐）
- **优势**：单一文件包含所有资源，加载速度快
- **扩展名**：`.glb`
- **文件大小限制**：建议 < 5MB，最大 10MB

### glTF
- **优势**：JSON 格式，易于编辑
- **扩展名**：`.gltf`
- **注意**：可能需要额外的 .bin 和纹理文件

## 模型准备

### 使用 Blender 导出优化模型

1. **创建模型**
   ```blender
   # 在 Blender 中建模
   # 建议面数：1000-5000 面（移动端优化）
   ```

2. **应用变换**
   ```blender
   Object > Apply > All Transforms
   ```

3. **导出为 glTF**
   ```blender
   File > Export > glTF 2.0
   
   设置：
   - Format: glTF Binary (.glb)  # 或者 Separate (.gltf, .bin, .jpg)
   - Include: Selected Objects / All Visible
   - Transform: +Y Up
   - Geometry: Apply Modifiers
   ```

4. **Draco 压缩（可选，推荐）**
   ```blender
   安装插件：glTF Draco Compression
   勾选 Compression > Draco
   ```

5. **导出选项优化**
   ```blender
   Geometry:
   ✓ Vertex Colors
   ✓ UVs
   ✓ Normals
   
   Transform: Y Up (+Y)
   
   Compression: Draco
   Compression Level: 1-6 (6 最小文件)
   ```

### 使用 Rodin 生成模型

1. **生成模型**
   - 访问 Rodin 平台
   - 上传参考图片或文本描述
   - 生成 .glb 文件

2. **下载与优化**
   - 下载生成的 .glb 文件
   - 可选：在 Blender 中进一步优化
   - 确保文件大小 < 5MB

## 在 LumenJelly 中使用

### 方法 1：通过 UI 上传

1. 打开应用
2. 找到"模型管理"标签
3. 拖拽或选择 .glb/.gltf 文件
4. 等待上传完成
5. 点击"使用"按钮激活模型
6. 切换到使用 `model` 可视化的预设（Robot Teacup 或 Slow Whale）

### 方法 2：直接放入默认目录（开发者）

1. 将模型文件放入：
   ```
   fm-web/public/models/default/
   ```

2. 更新的模型路径：
   ```typescript
   // src/presets/map.ts
   'Robot Teacup': {
     visualId: 'model',
     params: { src: '/models/default/your_model.glb' }
   }
   ```

3. 重启开发服务器：
   ```bash
   npm run dev
   ```

## 模型优化建议

### 文件大小
- **目标**：< 2MB（桌面）/ < 1MB（移动端）
- **方法**：
  - 使用 Draco 压缩
  - 降低纹理分辨率
  - 减少顶点数

### 几何优化
- **面数**：
  - 桌面：3000-5000 面
  - 移动端：500-1500 面
- **顶点**：
  - 使用 Decimate 修饰器
  - 移除不必要的循环切割

### 材质优化
- **避免复杂材质**：
  - 使用 PBR 材质（baseColor + metallicRoughness）
  - 避免过多纹理贴图
  - 使用低分辨率纹理（512x512 或 1024x1024）

### 光照设置
- **环境光**：使用 HDR 环境贴图
- **阴影**：支持阴影（castShadow + receiveShadow）
- **金属度**：0.7-0.9 适合金属质感

## 故障排除

### 模型不显示
1. **检查文件格式**：确保是 .glb 或 .gltf
2. **检查文件大小**：< 10MB
3. **查看控制台**：检查加载错误信息
4. **使用 fallback**：启用 `fallback: true` 参数

### 模型位置不对
1. **应用变换**：在 Blender 中 Apply All Transforms
2. **中心化**：确保模型原点在 (0, 0, 0)
3. **检查旋转**：Z-Up vs Y-Up

### 性能问题
1. **面数过高**：减少几何复杂度
2. **纹理过大**：压缩纹理
3. **开启低质量模式**：
   ```typescript
   params: { quality: 'low' }
   ```

## 预设与模型映射

当前预设中，以下音色使用 3D 模型：

| 预设 | 模型路径 | Fallback |
|------|---------|----------|
| Robot Teacup | `/models/default/teacup.glb` | ✅ 启用 |
| Slow Whale | `/models/default/whale.glb` | ✅ 启用 |

如果模型加载失败，会自动切换到 fallback 可视化（几何体或 shader）。

## 示例模型

### 推荐资源

1. **Poly Haven** - https://polyhaven.com/models
   - CC0 许可
   - 高质量模型
   - 提供多种格式

2. **Sketchfab** - https://sketchfab.com
   - 需要下载许可
   - 搜索关键词：`low poly`, `stylized`

3. **Free3D** - https://free3d.com
   - 免费模型
   - 注意许可协议

## 最佳实践

### 1. 模型命名
```bash
# 推荐格式
teacup_low.glb     # 模型名_质量
whale_medium.glb
jellyfish_v1.glb

# 避免空格
# 避免中文文件名
```

### 2. 模型组织
```
models/
  ├── default/        # 默认模型
  │   ├── teacup.glb
  │   └── whale.glb
  ├── user/            # 用户上传
  │   └── custom/
  └── presets/         # 预设专用模型
      └── arcade/
```

### 3. 版本控制
```bash
# .gitignore
models/default/*.glb     # 大文件不上传
models/user/             # 用户数据不上传

# 使用 Git LFS
git lfs track "*.glb"
```

## 性能基准

### 低端设备（移动端）
- **目标 FPS**：30+
- **推荐模型**：< 1000 面，< 1MB
- **材质**：简单 PBR，无复杂纹理

### 中端设备（移动端/笔记本）
- **目标 FPS**：45-60
- **推荐模型**：< 3000 面，< 3MB
- **材质**：标准 PBR，1024x1024 纹理

### 高端设备（桌面）
- **目标 FPS**：60+
- **推荐模型**：< 5000 面，< 5MB
- **材质**：高质量 PBR，2K 纹理

---

**提示**：建议在移动端测试性能，确保流畅体验。

