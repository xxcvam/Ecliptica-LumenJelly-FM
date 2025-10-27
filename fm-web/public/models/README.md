# 3D 模型文件

## 当前模型

- `default/teacup.glb` - Robot Teacup 预设使用的茶杯模型（29MB）
- `default/whale.glb` - Slow Whale 预设使用的鲸鱼模型（23MB）

## ⚠️ 注意

这两个模型文件大小超过推荐大小（建议 < 5MB）。请考虑压缩或优化：

### 优化建议

1. **使用 Draco 压缩**
   - 在 Blender 中导出时启用 Draco 压缩
   - 或使用 `gltf-pipeline` 工具压缩
   ```bash
   npm install -g gltf-pipeline
   gltf-pipeline -i teacup.glb -o teacup_compressed.glb -d
   ```

2. **减少面数**
   - 在 Blender 中使用 Decimate 修饰器
   - 目标面数：1000-3000

3. **降低纹理分辨率**
   - 512x512 或 1024x1024
   - 使用低质量纹理

4. **移除不必要的细节**
   - 移除内部几何体
   - 简化内部结构

### Git LFS

模型文件已配置使用 Git LFS 追踪（见 `.gitattributes`）。

如需安装 Git LFS：
```bash
git lfs install
git add fm-web/public/models/default/*.glb
git commit -m "Add 3D models"
```

## 用户上传

用户上传的模型会存储在 IndexedDB 中，不会进入这个目录。

