# 正式立绘接入目录

结构：`assets/sprites/<charId>/<charId>-<expression>.png|webp`（透明底，900×1350 起步）。

## 接入步骤（逐项完成）

1. **放入素材文件**：必须真实来源（画师授权 / 正版素材库），禁止用 AI 生成图冒充画师作品。
2. **更新注册表**：`config/characters.js` 中对应角色的 `expressions.*.src` 指向新文件；表情差分 key 可自由扩展（normal / smile / surprised / …）。
3. **必填署名**：同一角色的 `credit` 填 `{ source: "素材页 URL", authorId: "画师 ID", license: "授权方式" }`。
   - 面板底部"素材署名"栏会自动列出已署名角色；
   - 名牌悬停提示（title）会显示来源 / 作者 / 授权。
4. **清理占位**：全部替换并逐节点核对后，删除 `assets/placeholders/` 对应占位 SVG（删除属高风险操作，须人工逐个确认）。
