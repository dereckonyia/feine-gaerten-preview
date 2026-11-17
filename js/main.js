(function () {
  "use strict";
  var d = document;
  d.documentElement.classList.add("js");
  var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function alle(sel, w) { return Array.prototype.slice.call((w || d).querySelectorAll(sel)); }

  // Kopfzeile: Zustand beim Scrollen
  var header = d.querySelector(".site-header");
  if (header) {
    var warte = false;
    var pruefe = function () { header.classList.toggle("scrolled", (window.pageYOffset || d.documentElement.scrollTop) > 24); };
    window.addEventListener("scroll", function () { if (warte) { return; } warte = true; requestAnimationFrame(function () { pruefe(); warte = false; }); }, { passive: true });
    pruefe();
  }

  // Mobiles Menü
  var toggle = d.querySelector(".nav-toggle"), nav = d.getElementById("nav");
  function menueZu() { if (!nav || !toggle) { return; } nav.classList.remove("open"); d.body.classList.remove("menu-open"); toggle.setAttribute("aria-expanded", "false"); }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var offen = nav.classList.toggle("open");
      d.body.classList.toggle("menu-open", offen);
      toggle.setAttribute("aria-expanded", offen ? "true" : "false");
    });
    alle("a", nav).forEach(function (a) { a.addEventListener("click", menueZu); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { menueZu(); toggle.focus(); } });
  }

  // Jahreszahl
  var jahr = d.getElementById("jahr"); if (jahr) { jahr.textContent = String(new Date().getFullYear()); }

  // Einblenden beim Scrollen
  var reveals = alle(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !ruhig) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("in"); }); }

  // Galerie: Großansicht
  var box = d.getElementById("lightbox"), links = alle("[data-lightbox]");
  if (box && links.length && typeof box.showModal === "function") {
    var bild = box.querySelector("img"), text = box.querySelector("figcaption"), idx = 0;
    function zeige(n) {
      idx = (n + links.length) % links.length;
      var a = links[idx];
      bild.src = a.getAttribute("href"); bild.alt = a.getAttribute("data-caption") || "";
      text.textContent = a.getAttribute("data-caption") || "";
    }
    links.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); zeige(i); box.showModal(); }); });
    box.querySelector(".prev").addEventListener("click", function () { zeige(idx - 1); });
    box.querySelector(".next").addEventListener("click", function () { zeige(idx + 1); });
    box.querySelector(".close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) { box.close(); } });
    box.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") { zeige(idx - 1); } if (e.key === "ArrowRight") { zeige(idx + 1); } });
  }

  // Kontaktformular: prüft die Pflichtfelder und schickt die Nachricht an kontakt.php.
  // Ohne PHP (Datei, claude.ai, Cloudflare Pages *.pages.dev) erscheint statt des Versands nur ein Hinweis.
  var form = d.getElementById("kontaktformular"), hinweis = d.getElementById("form-hinweis");
  if (form && hinweis) {
    var vorschau = location.protocol === "file:" || /claude|pages\.dev$/i.test(location.hostname);
    var melde = function (text, art) {
      hinweis.textContent = text; hinweis.className = "notice notice-" + art; hinweis.hidden = false;
      hinweis.scrollIntoView({ block: "nearest", behavior: ruhig ? "auto" : "smooth" });
    };
    var q = new URLSearchParams(location.search);
    if (q.get("gesendet") === "1") { melde("Vielen Dank! Ihre Nachricht ist bei uns angekommen. Wir melden uns so schnell wie möglich.", "ok"); }
    else if (q.get("fehler") === "1") { melde("Die Nachricht konnte nicht gesendet werden. Bitte prüfen Sie Ihre Angaben oder rufen Sie uns an: 0178 458 11 27.", "warn"); }
    form.addEventListener("submit", function (e) {
      var fehlt = alle("[required]", form).filter(function (f) {
        if (f.type === "checkbox") { return !f.checked; }
        if (f.type === "email") { return !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value.trim()); }
        return !f.value.trim();
      });
      if (fehlt.length) { e.preventDefault(); melde("Bitte füllen Sie alle Pflichtfelder aus und prüfen Sie Ihre E-Mail-Adresse.", "warn"); fehlt[0].focus(); return; }
      if (vorschau) { e.preventDefault(); melde("Vorschau: Auf www.feine-gaerten.com wird Ihre Nachricht jetzt an info@feine-gaerten.com gesendet.", "ok"); }
    });
  }

  // Titelbild: langsamer Wechsel ohne Bedienelemente
  var folien = alle(".hero-image img");
  if (folien.length > 1 && !ruhig) {
    var aktiv = 0, blende = 1800;
    setInterval(function () {
      var neu = (aktiv + 1) % folien.length;
      if (!folien[neu].complete || !folien[neu].naturalWidth) { return; } // nächstes Bild noch nicht geladen: Takt auslassen
      var alt = aktiv; aktiv = neu;
      folien[alt].classList.remove("is-active"); folien[alt].classList.add("was-active");
      folien[aktiv].classList.add("is-active");
      var note = d.querySelector(".hero-foot .photo-caption"); if (note) { note.textContent = folien[aktiv].getAttribute("data-caption"); }
      // Das alte Bild bleibt als Untergrund stehen, bis das neue ganz eingeblendet ist, und geht erst dann unsichtbar weg.
      setTimeout(function () { folien[alt].classList.remove("was-active"); }, blende);
    }, 7000);
  }

  // Leistungs-Register: Bild wechselt mit der Zeile
  var reg = d.querySelector(".register");
  if (reg) {
    var zeilen = alle(".register-list a", reg), bilder = alle(".register-stage img", reg);
    function setze(i) {
      zeilen.forEach(function (z, n) { z.classList.toggle("is-active", n === i); });
      bilder.forEach(function (b, n) { b.classList.toggle("is-active", n === i); });
    }
    zeilen.forEach(function (z, i) { ["mouseenter", "focus"].forEach(function (ev) { z.addEventListener(ev, function () { setze(i); }); }); });
    setze(0);
  }

  // Anliegen als Reiter
  var tabs = d.querySelector(".tabs");
  if (tabs) {
    var knoepfe = alle("[role=tab]", tabs), felder = alle("[role=tabpanel]", tabs);
    function waehle(i) {
      knoepfe.forEach(function (k, n) { k.setAttribute("aria-selected", n === i ? "true" : "false"); k.tabIndex = n === i ? 0 : -1; });
      felder.forEach(function (f, n) { f.hidden = n !== i; });
    }
    knoepfe.forEach(function (k, i) {
      k.addEventListener("click", function () { waehle(i); });
      k.addEventListener("keydown", function (e) {
        var n = i; if (e.key === "ArrowDown" || e.key === "ArrowRight") { n = (i + 1) % knoepfe.length; } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { n = (i - 1 + knoepfe.length) % knoepfe.length; } else { return; }
        e.preventDefault(); waehle(n); knoepfe[n].focus();
      });
    });
    waehle(0);
  }
})();
