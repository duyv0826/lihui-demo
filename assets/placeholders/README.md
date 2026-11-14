# 占位素材（几何剪影，非成品）

由 `tools/gen-placeholders.js` 生成，仅用于联调舞台引擎，**禁止当成立绘交付**。

## 正式立绘接入规范

1. **来源红线**：必须真实来源（画师授权 / 正版素材库），禁止用 AI 生成图冒充画师作品。
2. **目录与命名**：`assets/sprites/<charId>/<charId>-<expression>.png|webp`
   - 透明底 PNG 或 WebP，建议 900×1350 起步（本演示占位为 600×900）。
   - 表情差分 key 与注册表 `expressions` 一致（normal / smile / surprised，可自由扩展）。
3. **署名必填**：注册表（`config/characters.js`）中对应角色的 `credit` 必须填：
   `{ source: "素材页 URL", authorId: "画师 ID", license: "授权方式" }`，禁止留 `null`。
4. **替换完成后**删除本目录对应占位 SVG（删除属高风险操作，须人工确认后逐个进行）。
