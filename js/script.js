/* CodeNotes – user-experience scripts
   1. text size buttons (all pages)
   2. high-contrast / large-font alternative style sheet (all pages)
   3. project gallery lightbox (gallery.html)
   4. message character counter (contact.html)
   5. open all <details> before printing */

(function () {
  "use strict";

  var root = document.documentElement;
  root.className = root.className.replace("no-js", "js");

  /* localStorage may be blocked (private mode) – never let it break the page */
  function load(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function store(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  /* ---------- 1. Text size ---------- */
  var sizes = [87.5, 100, 112.5, 125, 150];
  var sizeIndex = parseInt(load("cn-size"), 10);
  if (isNaN(sizeIndex) || sizeIndex < 0 || sizeIndex >= sizes.length) {
    sizeIndex = 1;
  }

  var contrastOn = false;

  /* the high-contrast version always uses a 25% larger font,
     on top of the size chosen with the A−/A/A+ buttons */
  function applySize() {
    root.style.fontSize = (sizes[sizeIndex] * (contrastOn ? 1.25 : 1)) + "%";
    store("cn-size", String(sizeIndex));
  }

  /* ---------- 2. High contrast ---------- */
  var contrastLink = document.getElementById("contrast-css");
  var contrastBtn = document.getElementById("btn-contrast");

  function applyContrast(on) {
    if (!contrastLink) { return; }
    contrastOn = on;
    contrastLink.rel = on ? "stylesheet" : "alternate stylesheet";
    contrastLink.disabled = !on;
    if (contrastBtn) {
      contrastBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    store("cn-contrast", on ? "1" : "0");
    applySize();
  }

  applyContrast(load("cn-contrast") === "1");

  var bar = document.querySelector(".a11y-bar");
  if (bar) {
    bar.addEventListener("click", function (event) {
      var btn = event.target.closest("button");
      if (!btn) { return; }
      if (btn.id === "btn-smaller" && sizeIndex > 0) {
        sizeIndex -= 1;
        applySize();
      } else if (btn.id === "btn-bigger" && sizeIndex < sizes.length - 1) {
        sizeIndex += 1;
        applySize();
      } else if (btn.id === "btn-reset-size") {
        sizeIndex = 1;
        applySize();
      } else if (btn.id === "btn-contrast") {
        applyContrast(btn.getAttribute("aria-pressed") !== "true");
      }
    });
  }

  /* ---------- 3. Gallery lightbox ----------
     Without JavaScript the thumbnails are ordinary links to the large image. */
  var thumbs = document.querySelectorAll("a.thumb");
  if (thumbs.length) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Full-size project image");
    box.innerHTML = '<img src="" alt=""><p></p><button type="button">Close image (Esc)</button>';
    document.body.appendChild(box);

    var bigImg = box.querySelector("img");
    var caption = box.querySelector("p");
    var closeBtn = box.querySelector("button");
    var lastLink = null;

    var close = function () {
      box.hidden = true;
      bigImg.src = "";
      if (lastLink) { lastLink.focus(); }
    };

    Array.prototype.forEach.call(thumbs, function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var small = link.querySelector("img");
        lastLink = link;
        bigImg.src = link.href;
        bigImg.alt = small ? small.alt : "";
        caption.textContent = link.getAttribute("data-title") || "";
        box.hidden = false;
        closeBtn.focus();
      });
    });

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (event) {
      if (event.target === box) { close(); }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !box.hidden) { close(); }
    });
  }

  /* ---------- 4. Character counter ---------- */
  var message = document.getElementById("message");
  var counter = document.getElementById("message-count");
  if (message && counter) {
    var max = message.maxLength;
    var update = function () {
      counter.textContent = message.value.length + " / " + max + " characters used";
    };
    message.addEventListener("input", update);
    message.form.addEventListener("reset", function () {
      window.setTimeout(update, 0);
    });
    update();
  }

  /* ---------- 5. Print: show the content of closed <details> ---------- */
  var reopen = [];
  window.addEventListener("beforeprint", function () {
    Array.prototype.forEach.call(document.querySelectorAll("details:not([open])"), function (d) {
      d.open = true;
      reopen.push(d);
    });
  });
  window.addEventListener("afterprint", function () {
    reopen.forEach(function (d) { d.open = false; });
    reopen = [];
  });
}());
