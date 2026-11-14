/* 剧本运行器：静态逐节点校验（内容 + 可达性推演）+ 单步/自动播放；对具体角色 ID / 表情名 / 位置名零感知。
 * 舞台操作全部委托 window.LIHUI_STAGE，本文件只负责剧本语义、分支跳转与对话框展示。
 *
 * 节点类型（内容一律写在 config/script.js）：
 *   enter   { charId, position? }           进场
 *   exit    { charId }                      退场
 *   express { charId, expression }          切表情差分
 *   say     { charId, text }                说话（自动聚焦、压暗他人；自动播放到此暂停等翻页）
 *   focus   { charId }                      显式聚焦说话
 *   choice  { prompt, options:[{label,goto}] } 分支选项（暂停等选择，选项按钮由面板按 pendingChoice 渲染）
 *   goto    { goto }                        无条件跳转（不落穿到下一节点）
 *   wait    { ms }                          定时停顿（ms 到点自动续播；点「下一步」可跳过停顿）
 *   clear   {}                              全部退场
 *
 * 对外 API：window.LIHUI_SCRIPT_RUNNER.{ step, reset, progress, play, pause, choose, pendingChoice, onChange }
 */
(function () {
  "use strict";

  const config = window.LIHUI_CONFIG;
  const script = window.LIHUI_SCRIPT;
  const stage = window.LIHUI_STAGE;
  if (!config || !script || !stage) {
    throw new Error("缺少注册表 / 剧本 / 舞台引擎");
  }

  const dialogueEl = document.querySelector("[data-dialogue]");
  if (!dialogueEl) {
    throw new Error("缺少 [data-dialogue] 对话框容器");
  }
  const speakerEl = dialogueEl.querySelector("[data-dialogue-speaker]");
  const textEl = dialogueEl.querySelector("[data-dialogue-text]");
  if (!speakerEl || !textEl) {
    throw new Error("对话框缺少说话人 / 文本节点");
  }

  /* 自动播放连续步数上限，防止后向 goto 环导致死循环（具名常量，非 magic number） */
  const AUTO_STEP_LIMIT_FACTOR = 2;
  const autoStepLimit = script.nodes.length * AUTO_STEP_LIMIT_FACTOR;

  const positionKeySet = new Set(config.positions.map((p) => p.key));

  function msFromToken(tokenName) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
    const value = parseFloat(raw);
    if (!raw.endsWith("ms") || Number.isNaN(value)) {
      throw new Error("动效时长 token 非法: " + tokenName + " = " + raw);
    }
    return value;
  }

  /* ============ 静态逐节点校验：内容合法性 + 台上状态推演 + 分支可达性 ============ */
  function validateNodes() {
    const errors = [];
    const nodes = script.nodes;
    const total = nodes.length;
    const onstage = new Set();
    const findChar = (id) => config.characters.find((c) => c.id === id);
    const validTarget = (t) => Number.isInteger(t) && t >= 0 && t < total;

    nodes.forEach((node, index) => {
      const at = "节点 #" + index;
      switch (node.type) {
        case "enter": {
          if (!findChar(node.charId)) { errors.push(at + ": 未知角色 " + node.charId); break; }
          if (node.position !== undefined && !positionKeySet.has(node.position)) {
            errors.push(at + ": 未知位置 " + node.position);
          }
          onstage.add(node.charId);
          break;
        }
        case "exit": {
          if (!findChar(node.charId)) { errors.push(at + ": 未知角色 " + node.charId); break; }
          if (!onstage.has(node.charId)) {
            errors.push(at + ": 角色 " + node.charId + " 不在台上，无法退场");
          } else {
            onstage.delete(node.charId);
          }
          break;
        }
        case "say":
        case "focus": {
          if (!findChar(node.charId)) { errors.push(at + ": 未知角色 " + node.charId); break; }
          if (!onstage.has(node.charId)) {
            errors.push(at + ": 角色 " + node.charId + " 不在台上，无法" + (node.type === "say" ? "说话" : "聚焦"));
          }
          break;
        }
        case "express": {
          const character = findChar(node.charId);
          if (!character) { errors.push(at + ": 未知角色 " + node.charId); break; }
          if (!character.expressions[node.expression]) {
            errors.push(at + ": 角色 " + node.charId + " 没有表情差分 " + node.expression);
            break;
          }
          if (!onstage.has(node.charId)) {
            errors.push(at + ": 角色 " + node.charId + " 不在台上，无法切换表情");
          }
          break;
        }
        case "choice": {
          if (!Array.isArray(node.options) || node.options.length < 2) {
            errors.push(at + ": choice 至少需要 2 个选项");
            break;
          }
          node.options.forEach((option, i) => {
            if (!validTarget(option.goto)) {
              errors.push(at + ": 选项 " + i + "（" + option.label + "）的 goto 越界: " + option.goto);
            }
          });
          break;
        }
        case "goto": {
          if (!validTarget(node.goto)) {
            errors.push(at + ": goto 越界: " + node.goto);
          }
          break;
        }
        case "wait": {
          if (!Number.isInteger(node.ms) || node.ms < 0) {
            errors.push(at + ": wait 的 ms 必须是非负整数，当前: " + node.ms);
          }
          break;
        }
        case "clear":
          onstage.clear();
          break;
        default:
          errors.push(at + ": 未知节点类型 " + node.type);
      }
    });

    /* 分支可达性：从节点 #0 推演；goto 不落穿（运行时语义与推演一致） */
    const reachable = new Set();
    const walk = (i) => {
      if (!Number.isInteger(i) || i < 0 || i >= total || reachable.has(i)) { return; }
      reachable.add(i);
      const node = nodes[i];
      if (node.type === "goto") { walk(node.goto); return; }
      walk(i + 1);
      if (node.type === "choice" && Array.isArray(node.options)) {
        node.options.forEach((option) => walk(option.goto));
      }
    };
    walk(0);
    nodes.forEach((_, index) => {
      if (!reachable.has(index)) {
        errors.push("节点 #" + index + ": 不可达（从开头推演无法到达）");
      }
    });

    if (errors.length) {
      throw new Error("剧本校验失败（共 " + errors.length + " 处）:\n" + errors.join("\n"));
    }
  }

  validateNodes(); // 加载即校验，fail-loud

  /* ============ 运行时 ============ */
  let cursor = 0;
  let choiceNode = null;       // 当前等待选择的 choice 节点（null = 无待选择）
  let autoTimer = 0;           // 自动续播定时器（wait 到点 / 动作节点节奏续播）
  let autoStepCount = 0;       // 自动播放连续步数（防 goto 环）
  let observer = null;         // 面板订阅：每次状态变化回传结果

  function clearAutoTimer() {
    if (autoTimer) {
      window.clearTimeout(autoTimer);
      autoTimer = 0;
    }
  }

  function emit(result) {
    if (observer) { observer(result); }
  }

  function hideDialogue() {
    dialogueEl.classList.remove("is-visible");
    speakerEl.textContent = "";
    textEl.textContent = "";
  }

  function showSpeech(character, text) {
    speakerEl.textContent = character.name;
    if (character.accent) {
      speakerEl.style.setProperty("--char-accent", character.accent);
    }
    textEl.textContent = text;
    dialogueEl.classList.add("is-visible");
  }

  function executeNode(node) {
    switch (node.type) {
      case "enter": {
        const character = config.characters.find((c) => c.id === node.charId);
        stage.enter(node.charId, node.position);
        return character.name + " 进场" + (node.position !== undefined ? " @ " + node.position : "");
      }
      case "exit": {
        const character = config.characters.find((c) => c.id === node.charId);
        stage.exit(node.charId);
        return character.name + " 退场";
      }
      case "express": {
        const character = config.characters.find((c) => c.id === node.charId);
        stage.express(node.charId, node.expression);
        return character.name + " → " + character.expressions[node.expression].label;
      }
      case "focus": {
        const character = config.characters.find((c) => c.id === node.charId);
        stage.focus(node.charId);
        return "聚焦说话: " + character.name;
      }
      case "say": {
        const character = config.characters.find((c) => c.id === node.charId);
        stage.focus(node.charId);
        showSpeech(character, node.text);
        return character.name + "：" + node.text;
      }
      case "choice": {
        choiceNode = node;
        speakerEl.textContent = "";
        speakerEl.style.removeProperty("--char-accent");
        textEl.textContent = node.prompt;
        dialogueEl.classList.add("is-visible");
        return "选择出现：" + node.prompt;
      }
      case "wait":
        return "停顿 " + node.ms + "ms";
      case "clear":
        stage.clear();
        hideDialogue();
        return "全部退场";
      default:
        throw new Error("未知节点类型: " + node.type); // validateNodes 已拦，防御性保留
    }
  }

  /* 单步推进。wait 节点执行后自动排定续播（手动/自动模式一致）；点「下一步」可跳过停顿。 */
  function step() {
    clearAutoTimer();
    if (choiceNode) {
      const blocked = { blocked: true, cursor: cursor, total: script.nodes.length, log: "请先点选项按钮完成选择" };
      emit(blocked);
      return blocked;
    }
    if (cursor >= script.nodes.length) {
      const wasVisible = dialogueEl.classList.contains("is-visible");
      hideDialogue();
      const done = { done: true, cursor: cursor, total: script.nodes.length, log: wasVisible ? "收起台词 —— 剧本播放完毕" : "剧本播放完毕" };
      emit(done);
      return done;
    }
    const node = script.nodes[cursor];
    if (node.type === "goto") {
      cursor = node.goto;
      const result = { jumped: true, cursor: cursor, total: script.nodes.length, log: "跳转 → 节点 #" + node.goto };
      emit(result);
      return result;
    }
    cursor += 1;
    const log = executeNode(node);
    if (node.type === "wait") {
      clearAutoTimer();
      autoTimer = window.setTimeout(runAuto, node.ms);
    }
    const result = { cursor: cursor, total: script.nodes.length, log: log };
    emit(result);
    return result;
  }

  /* 自动播放：动作节点按动效时长节奏续播；say/choice/wait 按各自语义暂停或续播 */
  function runAuto() {
    const result = step();
    if (result.done || result.blocked) { return result; }
    autoStepCount += 1;
    if (autoStepCount >= autoStepLimit) { return result; } // 防后向 goto 环死循环：停住等用户
    if (choiceNode) { return result; }                     // 等待选择
    const executed = result.jumped ? null : script.nodes[result.cursor - 1];
    if (executed && executed.type === "say") { return result; }  // 等待翻页
    if (executed && executed.type === "wait") { return result; } // step() 已排定到点续播
    autoTimer = window.setTimeout(runAuto, msFromToken("--motion-duration-enter"));
    return result;
  }

  function play() {
    if (choiceNode) {
      const blocked = { blocked: true, cursor: cursor, total: script.nodes.length, log: "请先点选项按钮完成选择" };
      emit(blocked);
      return blocked;
    }
    clearAutoTimer();
    autoStepCount = 0;
    return runAuto();
  }

  function pause() {
    clearAutoTimer();
    return { cursor: cursor, total: script.nodes.length, log: "已暂停自动播放" };
  }

  function choose(optionIndex) {
    if (!choiceNode) {
      throw new Error("当前没有待选择的节点");
    }
    const option = choiceNode.options[optionIndex];
    if (!option) {
      throw new Error("选项不存在: " + optionIndex);
    }
    const label = option.label;
    cursor = option.goto;
    choiceNode = null;
    hideDialogue();
    const result = { cursor: cursor, total: script.nodes.length, log: "选择「" + label + "」→ 跳转节点 #" + option.goto };
    emit(result);
    return result;
  }

  function pendingChoice() {
    return choiceNode
      ? { prompt: choiceNode.prompt, options: choiceNode.options.map((o) => ({ label: o.label })) }
      : null;
  }

  function reset() {
    clearAutoTimer();
    cursor = 0;
    choiceNode = null;
    stage.clear();
    hideDialogue();
    const result = { cursor: 0, total: script.nodes.length, log: "剧本已重置（共 " + script.nodes.length + " 个节点）" };
    emit(result);
    return result;
  }

  function progress() {
    return { cursor: cursor, total: script.nodes.length };
  }

  function onChange(fn) {
    observer = fn;
  }

  window.LIHUI_SCRIPT_RUNNER = { step, reset, progress, play, pause, choose, pendingChoice, onChange };
})();
