// dsh-ops-health client half: a small sidebar button that calls the plain
// /ops/health route (host half) and renders the report in a modal card.
// Inline styles only — no theme dependency, no stylesheet to clean up.
window.__ModuleLoader__.load({
  id: "dsh-ops-health",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var BUTTON_ID = "dsh-ops-health-btn";
    var MODAL_ID = "dsh-ops-health-modal";
    var LABEL = "🩺 健康检查";
    // Theme-following accents: DSH writes the brand color into
    // --dsw-alias-brand-primary on <body> (skins override it too), so the
    // button follows every theme/skin automatically. color-mix lines carry a
    // plain-color fallback for older engines that ignore the function.
    var ACCENT = "var(--dsw-alias-brand-primary, #2dd4e8)";
    var ACCENT_35 = "rgba(45,212,232,.35)";
    var ACCENT_60 = "rgba(45,212,232,.6)";
    var ACCENT_BG = "rgba(45,212,232,.08)";
    var ACCENT_BG_HOVER = "rgba(45,212,232,.16)";
    var ACCENT_BORDER = "color-mix(in srgb, " + ACCENT + " 35%, transparent)";
    var ACCENT_BORDER_HOVER = "color-mix(in srgb, " + ACCENT + " 60%, transparent)";
    var ACCENT_BG_MIX = "color-mix(in srgb, " + ACCENT + " 8%, transparent)";
    var ACCENT_BG_MIX_HOVER = "color-mix(in srgb, " + ACCENT + " 16%, transparent)";

    function findSidebar() {
      return (
        document.querySelector("[data-pane='sidebar']") ||
        document.querySelector("[class*='sidebarCol']") ||
        document.querySelector("[class*='sidebar']") ||
        document.body
      );
    }

    function buildButton() {
      var b = document.createElement("button");
      b.id = BUTTON_ID;
      b.type = "button";
      b.textContent = LABEL;
      b.setAttribute("aria-label", "运行 dsh 健康检查");
      b.style.cssText =
        "display:block;width:calc(100% - 16px);margin:8px;padding:7px 10px;" +
        "border:1px solid " + ACCENT_35 + ";border-color:" + ACCENT_BORDER + ";border-radius:8px;" +
        "background:" + ACCENT_BG + ";background:" + ACCENT_BG_MIX + ";" +
        "color:" + ACCENT + ";font:12px 'Microsoft YaHei',sans-serif;cursor:pointer;text-align:left;" +
        "transition:background .15s ease,border-color .15s ease;";
      b.addEventListener("mouseenter", function () {
        b.style.borderColor = ACCENT_BORDER_HOVER;
        b.style.background = ACCENT_BG_MIX_HOVER;
      });
      b.addEventListener("mouseleave", function () {
        b.style.borderColor = ACCENT_BORDER;
        b.style.background = ACCENT_BG_MIX;
      });
      return b;
    }

    function buildModal() {
      var overlay = document.createElement("div");
      overlay.id = MODAL_ID;
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;" +
        "background:rgba(6,12,18,.55);";
      var card = document.createElement("div");
      card.style.cssText =
        "width:min(600px,92vw);max-height:74vh;overflow:auto;border-radius:12px;" +
        "background:#0e1826;border:1px solid " + ACCENT_35 + ";border-color:" + ACCENT_BORDER + ";" +
        "color:#dbe9f2;font:13px 'Microsoft YaHei',sans-serif;" +
        "box-shadow:0 10px 40px rgba(0,0,0,.5);padding:16px;";
      overlay.appendChild(card);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.remove();
      });
      return { overlay, card };
    }

    function renderResult(card, result) {
      card.innerHTML = "";
      var head = document.createElement("div");
      head.style.cssText =
        "font:bold 15px 'Microsoft YaHei',sans-serif;letter-spacing:1px;margin-bottom:10px;color:" + ACCENT + ";";
      head.textContent = "🩺 dsh 健康检查";
      card.appendChild(head);

      if (!result || !result.ok) {
        var err = document.createElement("div");
        err.style.cssText = "color:#ff6b4a;line-height:1.7;margin-bottom:12px;";
        err.textContent = "健康检查通道不可用：" + ((result && result.error) || "未知错误");
        card.appendChild(err);
        var tip = document.createElement("div");
        tip.style.cssText = "color:#8fa6ba;font-size:12px;line-height:1.8;";
        tip.textContent =
          "请手动运行体检：运维工具\\cmd\\health-check.cmd（或 scripts\\check-health.ps1）。" +
          "这是独立脚本，不依赖 dsh 进程，进程级故障时也只有它能诊断。";
        card.appendChild(tip);
        appendClose(card);
        return;
      }

      var summary = document.createElement("div");
      var healthy = result.healthy;
      summary.style.cssText =
        "padding:8px 12px;border-radius:8px;margin-bottom:12px;font-weight:600;" +
        (healthy
          ? "background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.35);"
          : "background:rgba(255,107,74,.12);color:#ff6b4a;border:1px solid rgba(255,107,74,.35);");
      summary.textContent = result.summary || (healthy ? "ALL HEALTHY" : "ISSUES FOUND");
      card.appendChild(summary);

      var list = document.createElement("div");
      for (var i = 0; i < result.items.length; i++) {
        var it = result.items[i];
        var row = document.createElement("div");
        row.style.cssText =
          "display:flex;gap:8px;padding:6px 8px;border-bottom:1px solid rgba(45,212,232,.08);" +
          "font-family:Consolas,'Courier New',monospace;font-size:12px;line-height:1.6;";
        var mark = document.createElement("span");
        mark.style.cssText = "flex:none;width:14px;text-align:center;";
        if (it.level === "ok") {
          mark.textContent = "✓";
          mark.style.color = "#34d399";
          row.style.color = "#9fb6c8";
        } else if (it.level === "fail") {
          mark.textContent = "✗";
          mark.style.color = "#ff6b4a";
          row.style.color = "#ffb4a3";
        } else {
          mark.textContent = "•";
          mark.style.color = "#597083";
          row.style.color = "#597083";
        }
        var text = document.createElement("span");
        text.textContent = it.text;
        row.appendChild(mark);
        row.appendChild(text);
        list.appendChild(row);
      }
      card.appendChild(list);

      if (!healthy) {
        var hint = document.createElement("div");
        hint.style.cssText = "margin-top:12px;color:#8fa6ba;font-size:12px;line-height:1.8;";
        hint.textContent =
          "有异常项：请按 运维工具\\运维手册.md（或 dsh-ops runbook.md）的处置流程修复，" +
          "或用 backup-config / restore-snapshot 回滚最近配置改动。";
        card.appendChild(hint);
      }
      appendClose(card);
    }

    function appendClose(card) {
      var close = document.createElement("button");
      close.type = "button";
      close.textContent = "关闭";
      close.style.cssText =
        "margin-top:14px;padding:7px 22px;border-radius:8px;cursor:pointer;" +
        "border:1px solid " + ACCENT_35 + ";border-color:" + ACCENT_BORDER + ";" +
        "background:" + ACCENT_BG + ";background:" + ACCENT_BG_MIX + ";color:" + ACCENT + ";" +
        "font:13px 'Microsoft YaHei',sans-serif;";
      close.addEventListener("click", function () {
        var m = document.getElementById(MODAL_ID);
        if (m) m.remove();
      });
      card.appendChild(close);
    }

    function apply(ctx) {
      if (typeof document === "undefined") return;
      var button = null;
      var stopWaiting = null;
      // cleanup registered before any mutation (safe path)
      ctx.effect(function () {
        return function () {
          if (stopWaiting) stopWaiting();
          var b = document.getElementById(BUTTON_ID);
          if (b && b.parentNode) b.parentNode.removeChild(b);
          var m = document.getElementById(MODAL_ID);
          if (m && m.parentNode) m.parentNode.removeChild(m);
        };
      });

      function runCheck() {
        if (!button) return;
        var prev = button.textContent;
        button.disabled = true;
        button.textContent = "检查中…";
        fetch("/ops/health", { cache: "no-store" })
          .then(function (r) {
            return r
              .json()
              .catch(function () {
                return { ok: false, error: "HTTP " + r.status };
              });
          })
          .then(function (result) {
            var m = buildModal();
            document.body.appendChild(m.overlay);
            renderResult(m.card, result);
          })
          .catch(function (e) {
            var m = buildModal();
            document.body.appendChild(m.overlay);
            renderResult(m.card, { ok: false, error: "网络错误：" + e.message });
          })
          .finally(function () {
            button.disabled = false;
            button.textContent = prev;
          });
      }

      // The sidebar renders asynchronously (React mount, and React may rebuild
      // the column DOM at any time). We insert the button as an in-flow flex
      // item directly above the footer (settings) area so other plugins'
      // buttons stack naturally by DOM order instead of overlapping a fixed
      // overlay. Every insert re-validates the anchor against the live tree
      // and retries on the next poll if React replaced nodes mid-insert.
      stopWaiting = waitForSidebar(function (target) {
        if (document.getElementById(BUTTON_ID)) return;
        var b = buildButton();
        b.addEventListener("click", runCheck);
        b.style.flexShrink = "0";
        try {
          var foot = document.querySelector("[class*='footArea']");
          var holder = null;
          var anchor = null;
          if (foot && foot.parentNode) {
            holder = foot.parentNode;
            anchor = foot;
          } else {
            holder = target;
            anchor = target.lastElementChild && target.lastElementChild.parentNode === target
              ? target.lastElementChild
              : null;
          }
          holder.insertBefore(b, anchor);
          button = b;
        } catch (e) {
          // React replaced the column between findSidebar and insertBefore;
          // drop this attempt, the poll loop will retry with a fresh node.
          var stale = document.getElementById(BUTTON_ID);
          if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
        }
      });
    }

    function waitForSidebar(callback) {
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        var sb = findSidebar();
        if (sb && sb !== document.body) {
          clearInterval(timer);
          callback(sb);
        } else if (tries >= 30) {
          clearInterval(timer);
          callback(document.body);
        }
      }, 500);
      return function () {
        clearInterval(timer);
      };
    }

    exports.apply = apply;
    return module.exports;
  },
});
