/* 演示控制面板：按钮全部由注册表生成，本文件不写死任何角色 ID / 表情名 / 位置名 / 剧本节点。 */
(function () {
  "use strict";

  const config = window.LIHUI_CONFIG;
  const stage = window.LIHUI_STAGE;
  const script = window.LIHUI_SCRIPT;
  const runner = window.LIHUI_SCRIPT_RUNNER;
  const logEl = document.querySelector("[data-action-log]");
  const markerRoot = document.querySelector("[data-stage-markers]");
  const panelRoot = document.querySelector("[data-control-panel]");
  const globalRoot = document.querySelector("[data-global-panel]");
  const choicesRoot = document.querySelector("[data-script-choices]");
  const creditsRoot = document.querySelector("[data-credits]");

  if (!config || !stage || !script || !runner || !logEl || !markerRoot || !panelRoot || !globalRoot || !choicesRoot || !creditsRoot) {
    throw new Error("演示面板缺少必要容器或注册表");
  }

  function log(text) {
    logEl.textContent = text;
  }

  function guarded(action) {
    return () => {
      try {
        action();
      } catch (err) {
        log("错误: " + err.message);
      }
    };
  }

  function addButton(row, label, action, modifier) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "control-btn" + (modifier ? " " + modifier : "");
    button.textContent = label;
    button.addEventListener("click", guarded(action));
    row.appendChild(button);
    return button;
  }

  /* 站位标记：与立绘共用同一组 .pos-* 位置类 */
  config.positions.forEach((position) => {
    const marker = document.createElement("div");
    marker.className = "stage-marker " + position.className;
    marker.textContent = position.label;
    markerRoot.appendChild(marker);
  });

  /* 角色控制行 */
  config.characters.forEach((character) => {
    const row = document.createElement("div");
    row.className = "control-row";

    const name = document.createElement("span");
    name.className = "control-name";
    name.textContent = character.name;
    if (character.accent) {
      name.style.setProperty("--char-accent", character.accent);
    }
    row.appendChild(name);

    addButton(row, "进场", () => {
      stage.enter(character.id);
      log(character.name + " 进场 @ " + character.defaultPosition);
    });
    addButton(row, "退场", () => {
      stage.exit(character.id);
      log(character.name + " 退场");
    });
    config.positions.forEach((position) => {
      addButton(row, position.label, () => {
        stage.enter(character.id, position.key);
        log(character.name + " 移至 " + position.label);
      }, "is-small");
    });
    Object.keys(character.expressions).forEach((key) => {
      const expression = character.expressions[key];
      addButton(row, expression.label, () => {
        stage.express(character.id, key);
        log(character.name + " → " + expression.label);
      }, "is-small");
    });
    addButton(row, "说话", () => {
      stage.focus(character.id);
      log("聚焦说话: " + character.name);
    }, "is-small");

    panelRoot.appendChild(row);
  });

  /* 背景控制行：按钮由注册表 backgrounds 生成，本文件不感知具体背景 */
  if (Array.isArray(config.backgrounds) && config.backgrounds.length) {
    const bgRow = document.createElement("div");
    bgRow.className = "control-row";
    const bgName = document.createElement("span");
    bgName.className = "control-name";
    bgName.textContent = "背景";
    bgRow.appendChild(bgName);
    addButton(bgRow, "无背景", () => {
      const result = stage.setBackground(null);
      log("背景 → " + result.label);
    });
    config.backgrounds.forEach((bg) => {
      addButton(bgRow, bg.label, () => {
        const result = stage.setBackground(bg.key);
        log(result.changed ? "背景 → " + bg.label : "背景已是 " + bg.label);
      });
    });
    panelRoot.appendChild(bgRow);
  }

  /* 剧本控制行：播放/暂停/单步全部委托运行器，UI 由 onChange 订阅统一刷新 */
  const scriptRow = document.createElement("div");
  scriptRow.className = "control-row";
  const scriptName = document.createElement("span");
  scriptName.className = "control-name";
  scriptName.textContent = script.title || "剧本";
  scriptRow.appendChild(scriptName);
  addButton(scriptRow, "开始 / 重置", () => { runner.reset(); });
  addButton(scriptRow, "播放", () => { runner.play(); });
  addButton(scriptRow, "暂停", () => { runner.pause(); });
  addButton(scriptRow, "下一步", () => { runner.step(); });
  panelRoot.appendChild(scriptRow);

  /* 分支选项行：由运行器的 pendingChoice 驱动，动态重建；本文件不感知选项内容 */
  function refreshChoices(pending) {
    choicesRoot.textContent = "";
    if (!pending) {
      return;
    }
    const row = document.createElement("div");
    row.className = "control-row";
    const label = document.createElement("span");
    label.className = "control-name";
    label.textContent = "选择";
    row.appendChild(label);
    pending.options.forEach((option, index) => {
      addButton(row, option.label, () => { runner.choose(index); });
    });
    choicesRoot.appendChild(row);
  }

  runner.onChange((result) => {
    if (result && result.log) {
      const suffix = result.done ? "（完）" : "";
      const prefix = result.blocked ? "" : "[" + result.cursor + "/" + result.total + "] ";
      log(prefix + result.log + suffix);
    }
    refreshChoices(runner.pendingChoice());
  });

  addButton(globalRoot, "全部退场", () => {
    stage.clear();
    log("全部退场");
  });
  addButton(globalRoot, "取消聚焦", () => {
    stage.focus(null);
    log("取消聚焦");
  });

  /* 素材署名栏：credit 填了才显示对应画师信息，本文件不感知具体作者 */
  const credited = config.characters.filter((c) => c.credit);
  const creditsLine = document.createElement("p");
  creditsLine.className = "credits";
  creditsLine.textContent = credited.length
    ? "立绘署名 — " + credited.map((c) => c.name + "：" + c.credit.authorId + "（" + c.credit.license + " · " + c.credit.source + "）").join("；")
    : "立绘署名：暂无 —— 按 assets/sprites/README.md 接入真实素材并填 credit 后，此处自动显示作者 ID 与授权。";
  creditsRoot.appendChild(creditsLine);

  /* 背景署名行：背景注册表带 credit 时按画师去重列出 */
  if (Array.isArray(config.backgrounds) && config.backgrounds.length) {
    const bgAuthors = [];
    config.backgrounds.forEach((bg) => {
      if (bg.credit && !bgAuthors.some((a) => a.authorId === bg.credit.authorId)) {
        bgAuthors.push(bg.credit);
      }
    });
    if (bgAuthors.length) {
      const bgCredits = document.createElement("p");
      bgCredits.className = "credits";
      bgCredits.textContent = "背景署名 — " + bgAuthors.map((c) => c.authorId + "（" + c.license + " · " + c.source + "）").join("；");
      creditsRoot.appendChild(bgCredits);
    }
  }

  log("就绪 —— 可点「开始 / 重置」后用「下一步 / 播放」运行剧本");
})();
