/* 立绘舞台引擎：对角色 ID / 表情名 / 位置名零感知，一切从注册表（window.LIHUI_CONFIG）读取。
 * 对外 API：window.LIHUI_STAGE.{ enter, exit, express, focus, clear, setBackground }
 */
(function () {
  "use strict";

  const config = window.LIHUI_CONFIG;
  if (!config) {
    throw new Error("缺少注册表 window.LIHUI_CONFIG");
  }

  const spriteRoot = document.querySelector("[data-stage-sprites]");
  if (!spriteRoot) {
    throw new Error("缺少 [data-stage-sprites] 舞台容器");
  }

  const positionClassByKey = new Map(config.positions.map((p) => [p.key, p.className]));
  const backgroundByKey = new Map((config.backgrounds || []).map((b) => [b.key, b]));
  const spritesById = new Map(); // 精灵节点常驻缓存：退场只切类，不删节点（无时序依赖，且保留图像解码缓存）
  const preloadedUrls = new Set(); // 已预热的表情图 URL，避免首次切换大图差分时"闪空"

  const stageEl = spriteRoot.closest(".stage") || spriteRoot.parentElement;
  let activeBgKey = null;

  /* 启动时预热全部背景大图，避免首次切换 5MB 级 JPG 时闪白 */
  (config.backgrounds || []).forEach((bg) => {
    const img = new Image();
    img.src = bg.src;
  });

  /* 舞台背景：key 必须来自注册表 backgrounds；传 null 恢复默认纯色 */
  function setBackground(key) {
    if (key === null) {
      activeBgKey = null;
      stageEl.style.backgroundImage = "";
      return { key: null, label: "默认舞台", changed: true };
    }
    const bg = backgroundByKey.get(key);
    if (!bg) {
      throw new Error("注册表中没有背景: " + key);
    }
    if (activeBgKey === key) {
      return { key: key, label: bg.label, changed: false };
    }
    activeBgKey = key;
    stageEl.style.backgroundImage = 'url("' + bg.src + '")';
    return { key: key, label: bg.label, changed: true };
  }

  /* 预热某角色全部表情差分：浏览器缓存加载完成后，express() 的交叉淡化不再等待网络 */
  function preloadExpressions(character) {
    Object.keys(character.expressions).forEach((key) => {
      const url = character.expressions[key].src;
      if (preloadedUrls.has(url)) { return; }
      preloadedUrls.add(url);
      const img = new Image();
      img.src = url;
    });
  }

  function isOnstage(sprite) {
    return sprite.el.classList.contains("is-onstage");
  }

  function requireCharacter(charId) {
    const character = config.characters.find((c) => c.id === charId);
    if (!character) {
      throw new Error("注册表中没有角色: " + charId);
    }
    return character;
  }

  function requirePositionClass(positionKey) {
    const className = positionClassByKey.get(positionKey);
    if (!className) {
      throw new Error("注册表中没有位置: " + positionKey);
    }
    return className;
  }

  function buildSprite(character) {
    const el = document.createElement("div");
    el.className = "sprite";
    el.dataset.charId = character.id;

    const body = document.createElement("div");
    body.className = "sprite-body";

    const layersBox = document.createElement("div");
    layersBox.className = "sprite-layers";

    const layerA = document.createElement("img");
    layerA.className = "face-layer";
    layerA.alt = "";
    const layerB = document.createElement("img");
    layerB.className = "face-layer";
    layerB.alt = "";

    const tag = document.createElement("div");
    tag.className = "sprite-tag";
    tag.textContent = character.name;
    if (character.accent) {
      tag.style.setProperty("--char-accent", character.accent);
    }
    if (character.credit) {
      // 署名可见：正式立绘接入后，悬停名牌即显示来源 / 作者 ID / 授权
      tag.title = "来源: " + character.credit.source + " | 作者: " + character.credit.authorId + " | 授权: " + character.credit.license;
    }

    layersBox.appendChild(layerA);
    layersBox.appendChild(layerB);
    body.appendChild(layersBox);
    el.appendChild(body);
    el.appendChild(tag);

    return { el, layers: [layerA, layerB], character, expressionKey: null, frontIndex: 0 };
  }

  function applyDefaultExpression(sprite) {
    const character = sprite.character;
    const expression = character.expressions[character.defaultExpression];
    if (!expression) {
      throw new Error("角色 " + character.id + " 缺少默认表情: " + character.defaultExpression);
    }
    const front = sprite.layers[sprite.frontIndex];
    front.alt = character.name + " · " + expression.label;
    front.src = expression.src;
    front.classList.add("is-active");
    sprite.expressionKey = character.defaultExpression;
  }

  /* 进场；对已在台上的角色等价于"移位"（left 过渡 → 平滑滑动），对已退场角色复用缓存节点 */
  function enter(charId, positionKey) {
    const character = requireCharacter(charId);
    const targetKey = positionKey || character.defaultPosition;
    const positionClass = requirePositionClass(targetKey);

    let sprite = spritesById.get(charId);
    const wasOnstage = sprite ? isOnstage(sprite) : false;
    if (!sprite) {
      sprite = buildSprite(character);
      spriteRoot.appendChild(sprite.el);
      spritesById.set(charId, sprite);
      preloadExpressions(character);
    }

    config.positions.forEach((p) => sprite.el.classList.remove(p.className));
    sprite.el.classList.add(positionClass);

    if (sprite.expressionKey === null) {
      applyDefaultExpression(sprite);
    }
    if (!wasOnstage) {
      // 强制重排提交初始样式后再加台上类；不依赖 rAF（后台标签页会节流 rAF，进场会卡在透明态）
      void sprite.el.offsetWidth;
      sprite.el.classList.add("is-onstage");
    }
    return { charId: charId, position: targetKey, entered: !wasOnstage };
  }

  /* 退场：只移除台上类（视觉淡出交给 CSS 过渡），节点保留在缓存中 */
  function exit(charId) {
    const sprite = spritesById.get(charId);
    if (!sprite || !isOnstage(sprite)) {
      return false;
    }
    sprite.el.classList.remove("is-onstage", "is-speaking", "is-dimmed");
    return true;
  }

  /* 表情差分：双图层交叉淡化（仅限台上角色） */
  function express(charId, expressionKey) {
    const sprite = spritesById.get(charId);
    if (!sprite || !isOnstage(sprite)) {
      throw new Error("角色不在舞台上: " + charId);
    }
    if (sprite.expressionKey === expressionKey) {
      return;
    }
    const expression = sprite.character.expressions[expressionKey];
    if (!expression) {
      throw new Error("角色 " + charId + " 没有表情差分: " + expressionKey);
    }
    const back = sprite.layers[1 - sprite.frontIndex];
    const front = sprite.layers[sprite.frontIndex];
    const swap = () => {
      back.classList.add("is-active");
      front.classList.remove("is-active");
      sprite.frontIndex = 1 - sprite.frontIndex;
      sprite.expressionKey = expressionKey;
    };
    const fail = () => {
      back.removeEventListener("load", swap);
      console.error("立绘加载失败:", expression.src);
    };
    back.addEventListener("load", swap, { once: true });
    back.addEventListener("error", fail, { once: true });
    back.alt = sprite.character.name + " · " + expression.label;
    back.src = expression.src;
  }

  /* 说话聚焦：目标点亮名牌，其余台上角色压暗；传 null 解除 */
  function focus(charId) {
    if (charId !== null) {
      const target = spritesById.get(charId);
      if (!target || !isOnstage(target)) {
        throw new Error("角色不在舞台上: " + charId);
      }
    }
    spritesById.forEach((sprite, id) => {
      if (charId === null || !isOnstage(sprite)) {
        sprite.el.classList.remove("is-speaking", "is-dimmed");
        return;
      }
      const speaking = id === charId;
      sprite.el.classList.toggle("is-speaking", speaking);
      sprite.el.classList.toggle("is-dimmed", !speaking);
    });
    return charId;
  }

  function clear() {
    Array.from(spritesById.keys()).forEach((charId) => exit(charId));
  }

  window.LIHUI_STAGE = { enter, exit, express, focus, clear, setBackground };
})();
