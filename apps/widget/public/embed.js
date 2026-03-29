/**
 * SupportAI Widget Embed Script
 *
 * Usage:
 * <script src="https://widget.supportai.com/embed.js" data-api-key="sk_live_xxx"></script>
 */
(function () {
  "use strict";

  // Find this script tag to read data attributes
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  var apiKey = currentScript.getAttribute("data-api-key");

  if (!apiKey) {
    console.error("[SupportAI] Missing data-api-key attribute on script tag.");
    return;
  }

  var WIDGET_URL = currentScript.getAttribute("data-widget-url") || "http://localhost:3001";
  var API_URL = currentScript.getAttribute("data-api-url") || "http://localhost:3002";
  var POSITION = currentScript.getAttribute("data-position") || "bottom-right";

  var isOpen = false;
  var iframe = null;
  var launcher = null;

  // Create launcher button
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

    launcher.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>' +
      "</svg>";

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

  // Create iframe
  function createIframe() {
    iframe = document.createElement("iframe");
    iframe.id = "supportai-widget";
    iframe.src =
      WIDGET_URL +
      "?apiKey=" +
      encodeURIComponent(apiKey) +
      "&host=" +
      encodeURIComponent(API_URL);
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
      "display:none;";

    document.body.appendChild(iframe);
  }

  // Toggle widget open/close
  function toggleWidget() {
    isOpen = !isOpen;
    if (iframe) {
      iframe.style.display = isOpen ? "block" : "none";
    }
    if (launcher) {
      launcher.innerHTML = isOpen
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
    }
  }

  // Listen for postMessage from widget iframe
  window.addEventListener("message", function (event) {
    if (!event.data || !event.data.type) return;
    if (event.data.type === "supportai:close") {
      toggleWidget();
    }
  });

  // Public API
  window.SupportAI = {
    open: function () {
      if (!isOpen) toggleWidget();
    },
    close: function () {
      if (isOpen) toggleWidget();
    },
    toggle: toggleWidget,
  };

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      createLauncher();
      createIframe();
    });
  } else {
    createLauncher();
    createIframe();
  }
})();
