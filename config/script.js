/* 剧本注册表：剧情节点序列全部集中在此，运行器（engine/script.js）对具体节点内容零耦合。
 * 节点类型与语义见 engine/script.js 头注释。
 * 加载时静态逐节点校验：未知角色/表情/位置、对不在台上的角色操作、goto/choice 越界、
 * wait 的 ms 非法、节点不可达，一律 fail-loud。
 *
 * 演示剧本：#3 是分支（两条路线在 #7 汇合），#12 是定时停顿（到点自动续播）。
 */
(function () {
  "use strict";

  window.LIHUI_SCRIPT = {
    title: "演示剧本",
    nodes: [
      { type: "enter",   charId: "char-a", position: "center" },
      { type: "enter",   charId: "char-b", position: "left" },
      { type: "say",     charId: "char-a", text: "早。立绘这边有两件事，你挑一件先做。" },
      { type: "choice",  prompt: "先做哪一件？", options: [
        { label: "补差分",   goto: 4 },
        { label: "接新角色", goto: 6 },
      ] },
      { type: "say",     charId: "char-a", text: "那就先补差分。惊讶那张，今天给你。" },
      { type: "goto",    goto: 7 },
      { type: "say",     charId: "char-a", text: "新角色也行。先把占位剪影跑通，再谈接素材。" },
      { type: "express", charId: "char-a", expression: "wink" },
      { type: "say",     charId: "char-a", text: "喏，这种效果。表情键是 wink，别拼错。" },
      { type: "say",     charId: "char-b", text: "收到。我先走了，下午给你反馈。" },
      { type: "exit",    charId: "char-b" },
      { type: "say",     charId: "char-a", text: "……走了？行，那我先收工。" },
      { type: "wait",    ms: 1200 },
      { type: "clear" },
    ],
  };
})();
