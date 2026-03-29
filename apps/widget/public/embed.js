/**
 * SupportAI Widget Embed Script
 *
 * Usage:
 * <script
 *   src="https://widget.supportai.com/embed.js"
 *   data-api-key="sk_live_xxx"
 *   data-supportai
 *   data-position="bottom-right"
 *   data-sound-enabled="true"
 *   data-auto-open-delay="0"
 * ></script>
 *
 * Public API:
 *   window.SupportAI.open()
 *   window.SupportAI.close()
 *   window.SupportAI.toggle()
 *   window.SupportAI.setUnread(count)
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. Script detection
  // ---------------------------------------------------------------------------
  var currentScript =
    document.currentScript ||
    document.querySelector("script[data-supportai]");

  if (!currentScript) {
    console.error("[SupportAI] Could not locate the embed script tag.");
    return;
  }

  var apiKey = currentScript.getAttribute("data-api-key");

  if (!apiKey) {
    console.error("[SupportAI] Missing data-api-key attribute on script tag.");
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Configuration from data attributes
  // ---------------------------------------------------------------------------
  var WIDGET_URL =
    currentScript.getAttribute("data-widget-url") || "http://localhost:3001";
  var API_URL =
    currentScript.getAttribute("data-api-url") || "http://localhost:3002";
  var POSITION =
    currentScript.getAttribute("data-position") || "bottom-right";
  var soundEnabled =
    currentScript.getAttribute("data-sound-enabled") !== "false";
  var autoOpenDelay =
    parseInt(currentScript.getAttribute("data-auto-open-delay") || "0", 10);

  // ---------------------------------------------------------------------------
  // 3. State
  // ---------------------------------------------------------------------------
  var isOpen = false;
  var unreadCount = 0;
  var iframe = null;
  var launcher = null;
  var badge = null;

  // ---------------------------------------------------------------------------
  // 4. Sound notification (Web Audio API beep)
  // ---------------------------------------------------------------------------
  var notificationSound = null;
  if (soundEnabled && typeof Audio !== "undefined") {
    try {
      notificationSound = {
        play: function () {
          try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } catch (e) {
            // Silently ignore — user may not have interacted yet
          }
        },
      };
    } catch (e) {
      // AudioContext not available
    }
  }

  // ---------------------------------------------------------------------------
  // 5. SVG icons
  // ---------------------------------------------------------------------------
  var CHAT_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>' +
    "</svg>";

  var CLOSE_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>' +
    "</svg>";

  // ---------------------------------------------------------------------------
  // 6. Unread badge helpers
  // ---------------------------------------------------------------------------
  function updateBadge() {
    if (!badge) return;
    if (unreadCount > 0 && !isOpen) {
      badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Open / Close with CSS transitions (no display toggle)
  // ---------------------------------------------------------------------------
  function openWidget() {
    if (!iframe) return;
    iframe.style.transform = "translateY(0)";
    iframe.style.opacity = "1";
    iframe.style.pointerEvents = "auto";
    isOpen = true;
    unreadCount = 0;
    updateBadge();
    if (launcher) {
      launcher.innerHTML = CLOSE_ICON;
      if (badge) launcher.appendChild(badge);
    }
  }

  function closeWidget() {
    if (!iframe) return;
    iframe.style.transform = "translateY(20px)";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    isOpen = false;
    if (launcher) {
      launcher.innerHTML = CHAT_ICON;
      if (badge) launcher.appendChild(badge);
    }
  }

  function toggleWidget() {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Create launcher button
  // ---------------------------------------------------------------------------
  function createLauncher() {
    launcher = document.createElement("div");
    launcher.id = "supportai-launcher";
    launcher.setAttribute("role", "button");
    launcher.setAttribute("aria-label", "Open support chat");
    launcher.setAttribute("tabindex", "0");
    launcher.style.cssText =
      "position:fixed;z-index:2147483647;" +
      (POSITION === "bottom-left" ? "left:20px;" : "right:20px;") +
      "bottom:20px;width:56px;height:56px;border-radius:50%;" +
      "background:#6366f1;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);" +
      "display:flex;align-items:center;justify-content:center;transition:transform 0.2s;";

    launcher.innerHTML = CHAT_ICON;

    // Unread badge
    badge = document.createElement("div");
    badge.style.cssText =
      "position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;" +
      "border-radius:9px;background:#ef4444;color:white;font-size:11px;" +
      "font-weight:700;display:none;align-items:center;justify-content:center;" +
      "padding:0 4px;font-family:sans-serif;";
    launcher.style.position = "relative";
    launcher.appendChild(badge);

    // Events
    launcher.addEventListener("click", toggleWidget);
    launcher.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleWidget();
      }
    });
    launcher.addEventListener("mouseenter", function () {
      launcher.style.transform = "scale(1.1)";
    });
    launcher.addEventListener("mouseleave", function () {
      launcher.style.transform = "scale(1)";
    });

    document.body.appendChild(launcher);
  }

  // ---------------------------------------------------------------------------
  // 9. Create iframe (always in DOM, hidden via opacity/transform)
  // ---------------------------------------------------------------------------
  function createIframe() {
    iframe = document.createElement("iframe");
    iframe.id = "supportai-widget";
    iframe.allow = "microphone";

    var isMobile = window.innerWidth < 640;

    iframe.style.cssText =
      "position:fixed;z-index:2147483646;border:none;background:white;" +
      "border-radius:" + (isMobile ? "0" : "16px") + ";" +
      "box-shadow:0 8px 32px rgba(0,0,0,0.12);" +
      (isMobile
        ? "top:0;left:0;width:100%;height:100%;"
        : (POSITION === "bottom-left" ? "left:20px;" : "right:20px;") +
          "bottom:88px;width:400px;height:600px;max-height:calc(100vh - 108px);") +
      "transform:translateY(20px);opacity:0;pointer-events:none;" +
      "transition:transform 0.3s ease, opacity 0.3s ease;";

    document.body.appendChild(iframe);

    // Session token exchange — fetch a short-lived token from the API
    fetch(API_URL + "/api/v1/widget/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.token) {
          iframe.src =
            WIDGET_URL +
            "?token=" +
            encodeURIComponent(data.token) +
            "&host=" +
            encodeURIComponent(API_URL);
        } else {
          throw new Error("No token in response");
        }
      })
      .catch(function () {
        // Fallback: use apiKey directly (backward compatibility)
        iframe.src =
          WIDGET_URL +
          "?apiKey=" +
          encodeURIComponent(apiKey) +
          "&host=" +
          encodeURIComponent(API_URL);
      });
  }

  // ---------------------------------------------------------------------------
  // 10. postMessage listener with origin validation
  // ---------------------------------------------------------------------------
  window.addEventListener("message", function (event) {
    // Validate origin matches widget URL
    var widgetOrigin;
    try {
      widgetOrigin = new URL(WIDGET_URL).origin;
    } catch (e) {
      return;
    }
    if (event.origin !== widgetOrigin) return;

    if (!event.data || !event.data.type) return;

    if (event.data.type === "supportai:close") {
      closeWidget();
    }

    if (event.data.type === "supportai:unread") {
      if (!isOpen) {
        unreadCount = event.data.count || unreadCount + 1;
        updateBadge();
        if (soundEnabled && notificationSound) {
          notificationSound.play();
        }
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 11. Public API
  // ---------------------------------------------------------------------------
  window.SupportAI = {
    open: openWidget,
    close: closeWidget,
    toggle: function () {
      isOpen ? closeWidget() : openWidget();
    },
    setUnread: function (count) {
      unreadCount = count;
      updateBadge();
    },
  };

  // ---------------------------------------------------------------------------
  // 12. Initialize
  // ---------------------------------------------------------------------------
  function init() {
    createLauncher();
    createIframe();

    // Proactive auto-open
    if (autoOpenDelay > 0 && !sessionStorage.getItem("supportai_auto_opened")) {
      setTimeout(function () {
        if (!isOpen) {
          openWidget();
          sessionStorage.setItem("supportai_auto_opened", "1");
        }
      }, autoOpenDelay);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
