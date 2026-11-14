/* 生成占位立绘 SVG —— 几何剪影，仅用于舞台引擎联调，不是成品素材。
 * 运行：node tools/gen-placeholders.js
 * 正式立绘接入规范见 assets/placeholders/README.md。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "assets", "placeholders");

const CHARACTERS = [
  { id: "char-a", expressions: ["normal", "smile", "surprised"], hair: "short",    hairColor: "#2e3440", clothing: "#3f5d7a", accent: "#e0a458", skin: "#e6cfae" },
  { id: "char-b", expressions: ["normal", "smile"],              hair: "long",     hairColor: "#4a3428", clothing: "#4e6e64", accent: "#7aa5b8", skin: "#dcc4a0" },
  { id: "char-c", expressions: ["normal", "smile"],              hair: "ponytail", hairColor: "#26303c", clothing: "#6d5d43", accent: "#9caf6e", skin: "#cdb190" },
];

const EXPRESSIONS = {
  normal:    { eyes: "oval",  mouth: "flat"  },
  smile:     { eyes: "happy", mouth: "smile" },
  surprised: { eyes: "wide",  mouth: "open"  },
};

const INK = "#2b2b33";

const EYES = {
  oval:  '<ellipse cx="253" cy="308" rx="11" ry="17" fill="' + INK + '"/><ellipse cx="347" cy="308" rx="11" ry="17" fill="' + INK + '"/>',
  happy: '<path d="M 242 312 Q 253 296 264 312" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M 336 312 Q 347 296 358 312" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>',
  wide:  '<circle cx="253" cy="308" r="14" fill="' + INK + '"/><circle cx="347" cy="308" r="14" fill="' + INK + '"/>',
};

const MOUTHS = {
  flat:  '<rect x="284" y="369" width="32" height="7" rx="3.5" fill="' + INK + '"/>',
  smile: '<path d="M 278 364 Q 300 386 322 364" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>',
  open:  '<ellipse cx="300" cy="377" rx="15" ry="19" fill="#7c3a38"/>',
};

const HAIR_BACK = {
  short: (color) =>
    '<ellipse cx="300" cy="295" rx="113" ry="122" fill="' + color + '"/>' +
    '<rect x="187" y="290" width="34" height="90" rx="16" fill="' + color + '"/>' +
    '<rect x="379" y="290" width="34" height="90" rx="16" fill="' + color + '"/>',
  long: (color) =>
    '<path d="M 186 300 Q 186 150 300 148 Q 414 150 414 300 L 420 705 Q 418 722 400 722 L 200 722 Q 182 722 180 705 Z" fill="' + color + '"/>',
  ponytail: (color) =>
    '<ellipse cx="300" cy="295" rx="112" ry="120" fill="' + color + '"/>' +
    '<path d="M 402 290 Q 480 300 470 420 Q 462 500 424 486 Q 404 440 404 370 Z" fill="' + color + '"/>',
};

function figureSvg(character, expressionKey) {
  const expr = EXPRESSIONS[expressionKey];
  const raisedBrows = expr.eyes === "wide"
    ? '<rect x="236" y="268" width="34" height="7" rx="3.5" fill="' + INK + '"/><rect x="330" y="268" width="34" height="7" rx="3.5" fill="' + INK + '"/>'
    : "";
  const parts = [
    '<!-- 占位素材（几何剪影），非成品；正式立绘必须真实来源并标注作者 ID -->',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">',
    HAIR_BACK[character.hair](character.hairColor),
    '<rect x="272" y="395" width="56" height="95" rx="12" fill="' + character.skin + '"/>',
    '<path d="M 118 900 L 118 645 Q 118 545 208 508 L 258 486 L 342 486 L 392 508 Q 482 545 482 645 L 482 900 Z" fill="' + character.clothing + '"/>',
    '<path d="M 262 500 L 300 556 L 338 500 L 320 490 L 300 522 L 280 490 Z" fill="' + character.accent + '"/>',
    '<ellipse cx="196" cy="318" rx="14" ry="20" fill="' + character.skin + '"/>',
    '<ellipse cx="404" cy="318" rx="14" ry="20" fill="' + character.skin + '"/>',
    '<ellipse cx="300" cy="305" rx="100" ry="112" fill="' + character.skin + '"/>',
    '<path d="M 196 318 Q 192 168 300 164 Q 408 168 404 318 Q 396 258 352 240 Q 318 272 254 250 Q 210 248 196 318 Z" fill="' + character.hairColor + '"/>',
    raisedBrows,
    EYES[expr.eyes],
    MOUTHS[expr.mouth],
    '<text x="138" y="864" font-family="sans-serif" font-size="26" fill="rgba(232,234,238,0.5)">占位素材 PLACEHOLDER</text>',
    '</svg>',
  ];
  return parts.join("\n");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
CHARACTERS.forEach((character) => {
  character.expressions.forEach((expressionKey) => {
    if (!EXPRESSIONS[expressionKey]) {
      throw new Error("未定义的表情: " + expressionKey);
    }
    const file = path.join(OUT_DIR, character.id + "-" + expressionKey + ".svg");
    fs.writeFileSync(file, figureSvg(character, expressionKey), "utf8");
    written += 1;
    console.log("written:", path.relative(process.cwd(), file));
  });
});

console.log("total:", written);
