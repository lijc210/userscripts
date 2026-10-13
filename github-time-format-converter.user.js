// ==UserScript==
// @name               Github Time Format Converter
// @name:zh-CN         Github 时间格式转换
// @name:zh-TW         Github 時間格式轉換
// @description        Convert relative times on GitHub to absolute date and time
// @description:zh-CN  将 GitHub 页面上的相对时间转换为绝对日期和时间
// @description:zh-TW  將 GitHub 頁面上的相對時間轉換成絕對日期與時間
// @version            0.0.2
// @icon               https://raw.githubusercontent.com/lijc210/userscripts/main/Icons/Github-Time-Format-Converter-Icon.svg
// @author             lijc210
// @namespace          https://github.com/lijc210/userscripts
// @supportURL         https://github.com/lijc210/userscripts/issues
// @license            MIT
// @match              https://github.com/*
// @exclude            https://github.com/topics/*
// @grant              GM_addStyle
// @run-at             document-idle
// @downloadURL        https://raw.githubusercontent.com/lijc210/userscripts/main/github-time-format-converter.user.js
// @updateURL          https://raw.githubusercontent.com/lijc210/userscripts/main/github-time-format-converter.user.js
// ==/UserScript==

(function () {
  "use strict";

  // ==================== Data Layer ====================
  // 配置、状态管理、日期格式化

  const CONFIG = {
    SETTINGS: {
      TOOLTIP_OFFSET: 8,
      EDGE_MARGIN: 8,
      TRANSITION_MS: 150,
      FONT_STACK: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      FONT_MONO: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    IDS: {
      TOOLTIP: "TimeConverterTooltipContainer",
    },
    CLASSES: {
      PROCESSED: "time-converter-processed",
      VISIBLE: "time-converter-visible",
      NO_TRANSLATE: "notranslate",
    },
    SELECTORS: {
      RELATIVE_TIME: "relative-time:not(.time-converter-processed)",
      PROCESSED_SPAN: "span.time-converter-processed[data-tooltip-time]",
    },
    PAGES: {
      // 路径恰好为两段（/owner/repo）时视为仓库首页，不进行转换。
      // GitHub 自身页面的第一段是保留词（如 /settings/keys、/notifications/subscriptions），
      // 它们不是仓库首页，应继续转换。GitHub 禁止注册这些保留词作为用户名。
      RESERVED_FIRST_SEGMENTS: [
        "settings", "notifications", "login", "logout", "signup", "join",
        "session", "auth", "new", "search", "marketplace", "sponsors", "orgs",
        "topics", "trending", "collections", "events", "about", "features",
        "solutions", "enterprise", "pricing", "customer-stories", "resources",
        "readme", "site", "contact", "security", "apps", "spark", "stars",
        "dashboard", "copilot", "codespaces", "explore", "account", "admin",
        "mine", "import", "git-guides", "watching", "issues", "pulls",
        "discussions",
      ],
    },
    I18N: {
      "zh-CN": { INVALID: "无效日期" },
      "zh-TW": { INVALID: "無效日期" },
      "en-US": { INVALID: "Invalid Date" },
    },
  };

  const state = {
    locale: "en-US",
    formatters: { date: null, time: null },
    tooltip: null,

    init() {
      this.locale = this.detectLocale();
      this.createFormatters();
    },

    detectLocale() {
      const langs = navigator.languages || [navigator.language];
      for (const lang of langs) {
        const lower = lang.toLowerCase();
        if (lower.match(/^zh-(hans|cn)$/) || lower.startsWith("zh-hans") || lower === "zh") return "zh-CN";
        if (lower.match(/^zh-(hant|tw|hk|mo)$/)) return "zh-TW";
        if (lower.startsWith("en")) return "en-US";
      }
      return "en-US";
    },

    createFormatters() {
      try {
        this.formatters.date = new Intl.DateTimeFormat(this.locale, {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        });
        this.formatters.time = new Intl.DateTimeFormat(this.locale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      } catch {
        this.formatters = { date: null, time: null };
      }
    },

    getText(key) {
      return (
        CONFIG.I18N[this.locale]?.[key] ?? CONFIG.I18N["en-US"][key] ?? key
      );
    },
  };

  // ==================== View Layer ====================
  // UI 渲染、提示框、CSS 注入

  const view = {
    injectStyles() {
      const { TRANSITION_MS, FONT_MONO } = CONFIG.SETTINGS;
      const { TOOLTIP } = CONFIG.IDS;
      const { PROCESSED, VISIBLE } = CONFIG.CLASSES;

      GM_addStyle(`
        :root {
          --tooltip-bg-dark: rgba(30, 33, 45, 0.95);
          --tooltip-text-dark: rgb(205, 214, 244);
          --tooltip-border-dark: rgba(108, 112, 134, 0.3);
          --tooltip-shadow-dark: 0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15);

          --tooltip-bg-light: rgba(255, 255, 255, 0.95);
          --tooltip-text-light: rgb(55, 58, 80);
          --tooltip-border-light: rgba(200, 205, 220, 0.4);
          --tooltip-shadow-light: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
        }

        #${TOOLTIP} {
          position: fixed;
          padding: 8px 12px;
          border-radius: 6px;
          font: 12px/1.5 ${FONT_MONO};
          z-index: 2147483647;
          pointer-events: none;
          white-space: pre;
          max-width: 350px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          backdrop-filter: blur(12px) saturate(200%);
          -webkit-backdrop-filter: blur(12px) saturate(200%);
          transition: opacity ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1),
                      visibility ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1);
          background: var(--tooltip-bg-dark);
          color: var(--tooltip-text-dark);
          border: 1px solid var(--tooltip-border-dark);
          box-shadow: var(--tooltip-shadow-dark);
        }

        #${TOOLTIP}.${VISIBLE} {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .${PROCESSED}[data-tooltip-time] {
          display: inline-block;
          font-family: ${FONT_MONO};
          cursor: help;
          transition: opacity 0.15s ease;
        }

        .${PROCESSED}[data-tooltip-time]:hover {
          opacity: 0.8;
        }

        @media (prefers-color-scheme: light) {
          #${TOOLTIP} {
            background: var(--tooltip-bg-light);
            color: var(--tooltip-text-light);
            border-color: var(--tooltip-border-light);
            box-shadow: var(--tooltip-shadow-light);
          }
        }
      `);
    },

    createTooltip() {
      if (state.tooltip) return state.tooltip;

      const tooltip = document.createElement("div");
      tooltip.id = CONFIG.IDS.TOOLTIP;
      tooltip.setAttribute("role", "tooltip");
      tooltip.setAttribute("aria-hidden", "true");
      tooltip.setAttribute("translate", "no");
      tooltip.classList.add(CONFIG.CLASSES.NO_TRANSLATE);

      document.body?.appendChild(tooltip);
      state.tooltip = tooltip;
      return tooltip;
    },

    showTooltip(target) {
      const time = target.dataset.tooltipTime;
      if (!time) return;

      const tooltip = this.createTooltip();
      tooltip.textContent = time;
      tooltip.setAttribute("aria-hidden", "false");
      tooltip.classList.add(CONFIG.CLASSES.VISIBLE);

      requestAnimationFrame(() => this.positionTooltip(target, tooltip));
    },

    positionTooltip(target, tooltip) {
      if (!target.isConnected) {
        this.hideTooltip();
        return;
      }

      const rect = target.getBoundingClientRect();
      const { TOOLTIP_OFFSET: offset, EDGE_MARGIN: margin } = CONFIG.SETTINGS;
      const { offsetWidth: w, offsetHeight: h } = tooltip;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = rect.left + rect.width / 2 - w / 2;
      left = Math.max(margin, Math.min(vw - w - margin, left));

      const spaceAbove = rect.top - offset;
      const spaceBelow = vh - rect.bottom - offset;
      let top;

      if (spaceAbove >= h + margin) {
        top = rect.top - h - offset;
      } else if (spaceBelow >= h + margin) {
        top = rect.bottom + offset;
      } else {
        top =
          spaceAbove > spaceBelow
            ? Math.max(margin, rect.top - h - offset)
            : Math.min(vh - h - margin, rect.bottom + offset);
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    },

    hideTooltip() {
      state.tooltip?.classList.remove(CONFIG.CLASSES.VISIBLE);
      state.tooltip?.setAttribute("aria-hidden", "true");
    },
  };

  // ==================== Controller Layer ====================
  // 事件处理、DOM 监听、转换逻辑

  const controller = {
    format(date, type) {
      if (!(date instanceof Date) || isNaN(date.getTime())) return state.getText("INVALID");

      const formatter = state.formatters[type];
      if (formatter) {
        return formatter.format(date).replace(/\//g, "-");
      }

      const pad = (n) => String(n).padStart(2, "0");
      if (type === "date") {
        return `${String(date.getFullYear()).slice(-2)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      }
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },

    // 仓库首页（/owner/repo）不进行转换，其余页面正常转换。
    // 不能只在启动时判断后退出：GitHub 是 SPA 导航，启动后可能从仓库首页
    // 切换到其他页面（或反之），因此每次处理元素时都要重新判断。
    isActive() {
      const segments = location.pathname.split("/").filter(Boolean);
      if (segments.length !== 2) return true;
      return CONFIG.PAGES.RESERVED_FIRST_SEGMENTS.includes(segments[0]);
    },

    convertElement(el) {
      if (!this.isActive()) return;
      if (!(el instanceof Element) || el.classList.contains(CONFIG.CLASSES.PROCESSED)) {
        return;
      }

      const datetime = el.getAttribute("datetime");
      if (!datetime) {
        // GitHub 有时先插入元素、随后才异步设置 datetime 属性。
        // 这里不能打 PROCESSED 标记，否则元素会永远被跳过。
        return;
      }

      const date = new Date(datetime);
      const dateText = this.format(date, "date");
      const timeText = this.format(date, "time");
      const invalid = state.getText("INVALID");

      if (dateText === invalid || timeText === invalid) {
        el.classList.add(CONFIG.CLASSES.PROCESSED);
        return;
      }

      const span = document.createElement("span");
      span.textContent = dateText;
      span.dataset.tooltipTime = timeText;
      span.classList.add(CONFIG.CLASSES.PROCESSED, CONFIG.CLASSES.NO_TRANSLATE);
      span.setAttribute("translate", "no");

      el.parentNode?.replaceChild(span, el);
    },

    processAll(root = document.body) {
      root
        ?.querySelectorAll(CONFIG.SELECTORS.RELATIVE_TIME)
        .forEach((el) => this.convertElement(el));
    },

    setupTooltipEvents() {
      const selector = CONFIG.SELECTORS.PROCESSED_SPAN;

      document.body.addEventListener("mouseover", (e) => {
        const target = e.target.closest(selector);
        if (target) view.showTooltip(target);
      });

      document.body.addEventListener("mouseout", (e) => {
        const target = e.target.closest(selector);
        if (target && !e.relatedTarget?.closest?.(`#${CONFIG.IDS.TOOLTIP}`)) {
          view.hideTooltip();
        }
      });

      document.body.addEventListener(
        "focusin",
        (e) => {
          const target = e.target.closest(selector);
          if (target) view.showTooltip(target);
        },
        true
      );

      document.body.addEventListener(
        "focusout",
        (e) => {
          const target = e.target.closest(selector);
          if (target) view.hideTooltip();
        },
        true
      );
    },

    setupObserver() {
      const selector = CONFIG.SELECTORS.RELATIVE_TIME;
      const observer = new MutationObserver((mutations) => {
        const elements = new Set();

        for (const mutation of mutations) {
          if (mutation.type === "attributes") {
            // GitHub 的 React 会先插入 <relative-time> 再异步设置
            // datetime 属性，必须监听属性变化才能捕获这一时序。
            if (mutation.target.matches?.(selector)) elements.add(mutation.target);
            continue;
          }

          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.matches?.(selector)) elements.add(node);
            node.querySelectorAll?.(selector).forEach((el) => elements.add(el));
          }
        }

        elements.forEach((el) => this.convertElement(el));
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["datetime"],
      });
    },

    init() {
      this.setupTooltipEvents();
      this.setupObserver();
    },
  };

  // ==================== Main ====================

  function init() {
    state.init();
    view.injectStyles();
    controller.processAll();
    controller.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
