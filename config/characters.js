/* 立绘注册表：角色 / 表情差分 / 位置等全部内容集中在此，引擎（engine/stage.js）对本文件零耦合。
 * 素材来源与授权（详见 assets/sprites/LICENSES.md）：
 *   char-a —— HachiStudio, CC0（OpenGameArt "Character Images/Imageset"，5 姿势裁切 3 张）
 *   char-b —— Mokurou.（mokurou-art.itch.io 免费 demo：校服手机男孩，手绘无 AI）
 *   char-c —— Mokurou.（mokurou-art.itch.io 免费 demo：水手服黑发少女，手绘无 AI）
 * 命名规范见 assets/sprites/README.md。
 */
(function () {
  "use strict";

  window.LIHUI_CONFIG = {
    /* 背景 —— Akane 4K 教室/走廊包（AI 生成+人工修整）。
     * AI 素材例外：项目所有者 2026-11-14 明确授权使用 AI 素材（此前红线仅限真实画师图）。
     * 授权条款（itch 页）：商用可、修改可；禁转售素材本身。credit 可选但仍主动署名。 */
    backgrounds: [
      {
        key: "rooftop-night",
        src: "assets/backgrounds/bg-rooftop-night.png",
        label: "天台·夜晚",
        credit: {
          source: "即梦 Seedream 5.5（项目所有者账号生成，2026-11-14）",
          authorId: "AI 生成（即梦 Seedream 5.5）",
          license: "AI 生成素材 · 项目内用（经所有者授权的 AI 素材例外）",
        },
      },
      {
        key: "night-street",
        src: "assets/backgrounds/bg-night-street.png",
        label: "夜街",
        credit: {
          source: "即梦 Seedream 5.5（项目所有者账号生成，2026-11-14）",
          authorId: "AI 生成（即梦 Seedream 5.5）",
          license: "AI 生成素材 · 项目内用（经所有者授权的 AI 素材例外）",
        },
      },
      {
        key: "gym",
        src: "assets/backgrounds/bg-gym.png",
        label: "体育馆",
        credit: {
          source: "Midjourney niji 6（项目所有者账号生成，2026-11-14）",
          authorId: "AI 生成（Midjourney niji 6）",
          license: "AI 生成素材 · 项目内用（经所有者授权的 AI 素材例外）",
        },
      },
      {
        key: "rain-classroom",
        src: "assets/backgrounds/bg-rain-classroom.png",
        label: "雨中教室",
        credit: {
          source: "Midjourney niji 6（项目所有者账号生成，2026-11-14）",
          authorId: "AI 生成（Midjourney niji 6）",
          license: "AI 生成素材 · 项目内用（经所有者授权的 AI 素材例外）",
        },
      },
      {
        key: "rooftop-dusk",
        src: "assets/backgrounds/bg-rooftop-dusk.png",
        label: "天台·黄昏",
        credit: {
          source: "即梦 Seedream 5.5（项目所有者账号生成，2026-11-14）",
          authorId: "AI 生成（即梦 Seedream 5.5）",
          license: "AI 生成素材 · 项目内用（经所有者授权的 AI 素材例外）",
        },
      },
      {
        key: "classroom-day",
        src: "assets/backgrounds/bg-classroom-day.jpg",
        label: "教室·白天",
        credit: {
          source: "https://akane0201.itch.io/free-anime-backgrounds-school-classroom-corridor-4k",
          authorId: "Akane (akane0201)",
          license: "itch 免费版 · 商用可（AI 生成+人工修整，已获 AI 素材使用授权）",
        },
      },
      {
        key: "classroom-evening",
        src: "assets/backgrounds/bg-classroom-evening.jpg",
        label: "教室·黄昏",
        credit: {
          source: "https://akane0201.itch.io/free-anime-backgrounds-school-classroom-corridor-4k",
          authorId: "Akane (akane0201)",
          license: "itch 免费版 · 商用可（AI 生成+人工修整，已获 AI 素材使用授权）",
        },
      },
      {
        key: "classroom-night",
        src: "assets/backgrounds/bg-classroom-night.jpg",
        label: "教室·夜晚",
        credit: {
          source: "https://akane0201.itch.io/free-anime-backgrounds-school-classroom-corridor-4k",
          authorId: "Akane (akane0201)",
          license: "itch 免费版 · 商用可（AI 生成+人工修整，已获 AI 素材使用授权）",
        },
      },
      {
        key: "corridor-day",
        src: "assets/backgrounds/bg-corridor-day.jpg",
        label: "走廊·白天",
        credit: {
          source: "https://akane0201.itch.io/free-anime-backgrounds-school-classroom-corridor-4k",
          authorId: "Akane (akane0201)",
          license: "itch 免费版 · 商用可（AI 生成+人工修整，已获 AI 素材使用授权）",
        },
      },
    ],
    positions: [
      { key: "left",   className: "pos-left",   label: "左" },
      { key: "center", className: "pos-center", label: "中" },
      { key: "right",  className: "pos-right",  label: "右" },
    ],
    characters: [
      {
        id: "char-a",
        name: "示例甲",
        accent: "#e0a458",
        defaultPosition: "center",
        defaultExpression: "normal",
        expressions: {
          normal: { src: "assets/sprites/char-a/char-a-normal.png", label: "平静" },
          smile:  { src: "assets/sprites/char-a/char-a-smile.png",  label: "微笑" },
          wink:   { src: "assets/sprites/char-a/char-a-wink.png",   label: "眨眼" },
        },
        credit: {
          source: "https://opengameart.org/content/character-imageset",
          authorId: "HachiStudio",
          license: "CC0 1.0",
        },
      },
      {
        id: "char-b",
        name: "示例乙",
        accent: "#7aa5b8",
        defaultPosition: "left",
        defaultExpression: "normal",
        expressions: {
          normal: { src: "assets/placeholders/char-b-normal.svg", label: "平静" },
        },
        credit: {
          source: "https://mokurou-art.itch.io/trpg-vn-character-sprite-school-uniform-boy-with-phone-black-hair-5-expression",
          authorId: "Mokurou.",
          license: "itch 免费 demo（允许 VN/游戏使用；demo 单表情）",
        },
      },
      {
        id: "char-c",
        name: "示例丙",
        accent: "#9caf6e",
        defaultPosition: "right",
        defaultExpression: "normal",
        expressions: {
          normal: { src: "assets/placeholders/char-c-normal.svg", label: "平静" },
        },
        credit: {
          source: "https://mokurou-art.itch.io/trpg-vn-character-sprite-schoolgirl-sailor-uniform-black-hair",
          authorId: "Mokurou.",
          license: "itch 免费 demo（允许 VN/游戏使用；demo 单表情）",
        },
      },
    ],
  };
})();
