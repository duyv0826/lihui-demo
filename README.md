# 立绘舞台系统（lihui-demo）

配置驱动的视觉小说立绘舞台系统——剧本即配置，写完就能播。

![演示](docs/screenshot-classroom.png)

## 特性

- **剧本运行器**：wait / goto / choice 分支 / 自动播放，加载时静态校验
  （内容合法性 + 台上状态推演 + 分支可达性）
- **舞台引擎**：进场/退场/表情差分交叉淡化/说话聚焦/背景切换，
  精灵常驻缓存（退场只切类不删节点），表情与背景预热防闪空
- **背景系统**：15 个可切换背景（教室昼夜/走廊/天台日夜/夜街/体育馆/雨中教室）
- **署名系统**：所有素材的作者与许可自动显示于舞台与面板
- **配置驱动**：角色/表情/位置/背景/剧本全部在 config，引擎对具体内容零耦合

## 快速开始

```bash
# 任意静态服务器即可（无需构建）
python -m http.server 8080 -d .
# 打开 http://localhost:8080
```

点面板「开始 / 重置」→「播放」即可观看示例剧本（含分支选择）。

## 目录结构

```
lihui-demo/
├── index.html            # 入口页
├── main.js               # 演示面板装配（按钮全部由 config 生成）
├── config/
│   └── characters.js     # 角色注册表（立绘差分/位置/署名）
│   └── script.js         # 剧本注册表（节点序列）
├── engine/
│   ├── stage.js          # 舞台引擎（进场/差分/聚焦/背景切换）
│   └── script.js         # 剧本运行器（校验/推进/分支）
├── styles/               # Design Token + 舞台样式
├── assets/
│   ├── sprites/          # 角色立绘 + LICENSES.md（授权记录）
│   ├── backgrounds/      # 舞台背景
│   └── placeholders/     # 占位剪影（SVG，可替换）
└── tools/                # 素材生成脚本
```

## 剧本节点类型

| 节点 | 说明 |
|---|---|
| `enter` / `exit` | 角色进出场（可指定站位） |
| `say` | 台词（自动聚焦、压暗他人；自动播放时暂停等翻页） |
| `express` | 表情差分切换 |
| `choice` | 分支选项（暂停等选择，`goto` 跳转） |
| `goto` | 无条件跳转（不落穿） |
| `wait` | 定时停顿 |
| `focus` / `clear` | 聚焦 / 全部退场 |

加载时校验：未知角色/表情/位置、对不在台上的角色操作、goto/choice 越界、
节点不可达——全部 fail-loud 并报出节点序号。

## 接入自己的素材

见 `assets/sprites/README.md`（立绘）与 `assets/sprites/LICENSES.md`（授权记录）。
替换立绘/背景后改 `config/characters.js` 对应 `src` 即可，引擎零改动。

## 更高画质素材（未含于仓库）

| 素材 | 画师 | 来源 |
|---|---|---|
| 校服手机男孩等 ~20 个手绘角色 | [Mokurou.](https://mokurou-art.itch.io) | itch.io（免费 demo + 付费全版） |
| 4K 教室/走廊背景包 | [Akane](https://akane0201.itch.io) | itch.io（免费版） |

**注意**：上述素材授权禁止再分发——下载后仅限自用，请勿提交进仓库。

## 许可

- 代码：MIT
- 素材：见 `assets/sprites/LICENSES.md`（CC0 / 项目自有）
- AI 生成素材仅限背景类；角色立绘为真实画师手绘（CC0 / 授权使用）
