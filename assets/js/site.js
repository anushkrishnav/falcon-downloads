(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  // mobile menu
  var btn = $(".menu-btn"), nav = $("nav.main");
  if (btn && nav) {
    function setMenu(open) {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      var glyph = $(".icon", btn);
      if (glyph) glyph.src = "assets/icons/lucide/" + (open ? "x" : "menu") + ".svg";
    }
    btn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (event) { if (event.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && nav.classList.contains("open")) { setMenu(false); btn.focus(); } });
  }

  // Homepage gallery: real demos and screenshots share one preview window.
  var preview = $("#feature-preview"), choices = $$(".feature-preview");
  if (preview && choices.length) {
    var video = $("#demo-video"), screenshot = $("#demo-image");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function selectPreview(choice, announce) {
      var data = choice.dataset;
      choices.forEach(function (item) { item.setAttribute("aria-pressed", String(item === choice)); });
      video.pause();
      video.autoplay = !reduceMotion.matches;
      video.hidden = !data.previewVideo;
      screenshot.hidden = Boolean(data.previewVideo);
      $("#demo-title").textContent = data.previewTitle;
      $("#demo-description").textContent = data.previewDescription;
      $("#demo-link").setAttribute("href", data.previewLink);
      video.setAttribute("aria-label", data.previewAlt);
      if (data.previewVideo) {
        video.poster = data.previewImage;
        var source = $("source", video);
        if (source.getAttribute("src") !== data.previewVideo) {
          source.setAttribute("src", data.previewVideo);
          video.load();
        }
        if (!reduceMotion.matches) video.play().catch(function () { /* Native controls remain available. */ });
      } else {
        screenshot.src = data.previewImage;
        screenshot.alt = data.previewAlt;
      }
      if (announce) $(".gallery-status").textContent = "Preview: " + data.previewTitle;
    }
    choices.forEach(function (choice, index) {
      choice.addEventListener("click", function () { selectPreview(choice, true); });
      choice.addEventListener("keydown", function (event) {
        var next;
        if (event.key === "ArrowRight") next = (index + 1) % choices.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + choices.length) % choices.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = choices.length - 1;
        else return;
        event.preventDefault();
        choices[next].focus();
        selectPreview(choices[next], true);
      });
    });
    selectPreview(choices[0], false);
    var expand = $(".preview-expand"), stage = $("#demo-stage");
    if (expand && stage) expand.addEventListener("click", function () {
      function openAsset() {
        var url = video.hidden ? screenshot.src : $("source", video).src;
        window.open(url, "_blank", "noopener,noreferrer");
      }
      if (stage.requestFullscreen) stage.requestFullscreen().catch(openAsset);
      else openAsset();
    });
  }

  // copy buttons on code blocks
  $$("pre").forEach(function (pre) {
    var b = document.createElement("button"); b.className = "copy"; b.type = "button"; b.textContent = "Copy";
    b.addEventListener("click", function () {
      var t = pre.querySelector("code") ? pre.querySelector("code").innerText : pre.innerText;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); }, function () { b.textContent = "Press Ctrl+C"; });
    });
    pre.appendChild(b);
  });

  // tabs
  $$("[role=tablist]").forEach(function (list) {
    var tabs = $$("[role=tab]", list);
    function show(tab) {
      tabs.forEach(function (t) { var on = t === tab; t.setAttribute("aria-selected", on); var p = document.getElementById(t.getAttribute("aria-controls")); if (p) p.hidden = !on; });
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { show(t); history.replaceState(null, "", "#" + t.getAttribute("aria-controls")); }); });
    var hash = location.hash.slice(1), match = tabs.filter(function (t) { return t.getAttribute("aria-controls") === hash; })[0];
    var os = /Linux/i.test(navigator.userAgent) && !/Android/i.test(navigator.userAgent) ? "linux" : "windows";
    show(match || tabs.filter(function (t) { return t.dataset.os === os; })[0] || tabs[0]);
  });

  // versions
  var VERSIONS_URL = "assets/versions.json";
  function fmtSize(n) { if (!n) return ""; return n > 1e9 ? (n / 1e9).toFixed(2) + " GB" : Math.round(n / 1e6) + " MB"; }
  function assetRows(v) {
    var a = v.assets || {}, out = [];
    [["windows", "Windows 11 (64-bit)", "Installer (.exe)"], ["linux-deb", "Linux (Debian / Ubuntu)", "Package (.deb)"], ["linux-appimage", "Linux (any distribution)", "AppImage"]].forEach(function (k) {
      if (a[k[0]]) out.push({ key: k[0], label: k[1], kind: k[2], file: a[k[0]] });
    });
    return out;
  }
  function loadVersions() {
    return fetch(VERSIONS_URL, { cache: "no-cache" }).then(function (r) { return r.json(); });
  }
  function renderLatest(data) {
    var box = $("#latest"); if (!box) return;
    var latest = data.versions.filter(function (v) { return v.version === data.latest; })[0] || data.versions[0];
    var rows = assetRows(latest), os = /Linux/i.test(navigator.userAgent) ? "linux-deb" : "windows";
    var html = '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><div><span class="badge gold">' + esc(latest.channel || "release") + '</span> <h2 style="display:inline;margin:0 0 0 8px">Falcon Pro ' + esc(latest.version) + '</h2><div class="meta" style="color:var(--muted)">' + esc(latest.date || "") + '</div></div><a class="btn line" href="changelog.html">What\'s new</a></div>';
    if (latest.status !== "available" || !rows.length) {
      html += '<div class="callout info" style="margin-top:18px"><b>This version is being prepared.</b> The installer appears here as soon as it is published. Until then you can follow the <a href="' + esc(data.releasesUrl) + '">release page</a> or read the <a href="install.html">installation guide</a> to get ready.</div>';
      html += '<div class="dl-grid"><div class="dl-item rec"><h3>Windows 11 (64-bit)</h3><div class="meta">Installer (.exe) &middot; coming with this release</div><a class="btn gold" aria-disabled="true">Download for Windows</a></div><div class="dl-item"><h3>Linux (Debian / Ubuntu)</h3><div class="meta">Package (.deb) &middot; coming with this release</div><a class="btn line" aria-disabled="true">Download .deb</a></div></div>';
    } else {
      html += '<div class="dl-grid">' + rows.map(function (r) {
        var f = r.file, rec = r.key === os;
        return '<div class="dl-item' + (rec ? " rec" : "") + '"><h3>' + esc(r.label) + (rec ? ' <span class="badge gold">Recommended</span>' : "") + '</h3><div class="meta">' + esc(r.kind) + (f.size ? " &middot; " + fmtSize(f.size) : "") + '</div><a class="btn ' + (rec ? "gold" : "line") + '" href="' + esc(f.url) + '" rel="noopener">Download</a>' + (f.sha256 ? '<div style="margin-top:12px;font-size:.8rem;color:var(--muted)">SHA-256</div><div class="hash">' + esc(f.sha256) + '</div>' : "") + '</div>';
      }).join("") + "</div>";
      var a = latest.assets || {}, ex = [["checksums", "SHA256SUMS.txt"], ["manifest", "Signed release manifest"], ["manifest-signature", "Signature"], ["sbom", "Software bill of materials"]].filter(function (e) { return a[e[0]]; });
      if (ex.length) html += '<p style="margin-top:16px;color:var(--muted)">Verification files: ' + ex.map(function (e) { return '<a href="' + esc(a[e[0]].url) + '" rel="noopener">' + e[1] + '</a>'; }).join(" &middot; ") + '</p>';
    }
    box.innerHTML = html;
  }
  function renderTable(data) {
    var t = $("#versions-table tbody"); if (!t) return;
    t.innerHTML = data.versions.map(function (v) {
      var rows = assetRows(v);
      var links = v.status === "available" && rows.length ? rows.map(function (r) { return '<a href="' + esc(r.file.url) + '" rel="noopener">' + esc(r.label.split(" (")[0]) + "</a>"; }).join(" &middot; ") : '<span style="color:var(--muted)">' + (v.status === "upcoming" ? "In preparation" : "Not published") + "</span>";
      return "<tr><td><b>" + esc(v.version) + '</b> <span class="badge ' + (v.status === "available" ? "ok" : "warn") + '">' + esc(v.status === "available" ? "available" : v.status) + "</span></td><td>" + esc(v.date || "") + "</td><td>" + esc(v.channel || "") + "</td><td>" + links + "</td></tr>";
    }).join("");
  }
  function renderChangelog(data) {
    var box = $("#changelog"); if (!box) return;
    box.innerHTML = '<div class="timeline">' + data.versions.map(function (v) {
      return '<div class="rel"><h3>Falcon Pro ' + esc(v.version) + ' <span class="badge gold">' + esc(v.channel || "") + '</span> <span class="date">' + esc(v.date || "") + "</span></h3>" + (v.summary ? "<p>" + esc(v.summary) + "</p>" : "") + '<ul class="tick">' + (v.notes || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></div>";
    }).join("") + "</div>";
  }
  if ($("#latest") || $("#versions-table") || $("#changelog")) {
    loadVersions().then(function (d) { renderLatest(d); renderTable(d); renderChangelog(d); $$("[data-releases-url]").forEach(function (a) { a.href = d.releasesUrl; }); }, function () {
      var b = $("#latest"); if (b) b.innerHTML = '<div class="callout">Could not load the version list. See the <a href="https://github.com/anushkrishnav/falcon-downloads/releases">release page</a>.</div>';
    });
  }


  // Email extension downloads (assets/extension.json; same pattern as versions.json)
  var extBox = $("#ext-download");
  if (extBox) {
    var extNote = '<div class="callout info" style="margin-top:14px"><b>Not published yet.</b> The beta files appear here, with their sizes and SHA-256 values, as soon as they are released. Until then you can read the guide below, or watch the <a data-releases-url href="https://github.com/anushkrishnav/falcon-downloads/releases" rel="noopener">release page</a>.</div>';
    fetch("assets/extension.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      var v = (d.versions || []).filter(function (x) { return x.version === d.latest; })[0] || (d.versions || [])[0];
      if (!v) throw new Error("empty");
      var a = v.assets || {}, live = v.status === "available";
      var rows = [["extension", "Browser extension", "Zip: unzip, then load unpacked"], ["bridge-windows", "Windows bridge", "Zip: includes install-bridge.bat"], ["bridge-linux", "Linux bridge", "tar.gz: includes install.sh"], ["checksums", "Checksums", "SHA-256 of every file"]].filter(function (k) { return a[k[0]]; });
      var html = '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><div><span class="badge gold">' + esc(v.channel || "beta") + '</span> <h3 style="display:inline;margin:0 0 0 8px;font-size:1.3rem">Falcon Email Translator ' + esc(v.version) + '</h3><div style="color:var(--muted)">' + esc(live ? (v.date || "") : "Not published yet") + '</div></div></div>';
      if (v.summary) html += '<p style="margin-top:12px">' + esc(v.summary) + '</p>';
      if (!live) html += extNote;
      html += '<div class="ext-files">' + rows.map(function (k) {
        var f = a[k[0]];
        var btn = live ? '<a class="btn ' + (k[0] === "extension" || k[0] === "bridge-windows" ? "gold" : "line") + '" href="' + esc(f.url) + '" rel="noopener">Download</a>' : '<a class="btn line" aria-disabled="true">Not yet</a>';
        return '<div class="ext-file"><div><h3>' + esc(f.name) + '</h3><div class="meta">' + esc(k[1]) + " &middot; " + esc(k[2]) + (f.size ? " &middot; " + (f.size > 1e6 ? (f.size / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB") : "") + '</div></div>' + btn + (f.sha256 ? '<div><div style="font-size:.8rem;color:var(--muted)">SHA-256</div><div class="hash">' + esc(f.sha256) + '</div></div>' : "") + '</div>';
      }).join("") + "</div>";
      extBox.innerHTML = html;
      if (d.releasesUrl) $$("[data-releases-url]").forEach(function (l) { l.href = d.releasesUrl; });
    }).catch(function () {
      extBox.innerHTML = extNote;
    });
  }

  // error code search
  var codes = $("#codes");
  if (codes) {
    var all = [];
    var draw = function (q) {
      q = (q || "").trim().toLowerCase().replace(/^flc[\s-]*/, "flc-");
      var list = all.filter(function (c) { return !q || (c.code + " " + c.title + " " + c.fix + " " + c.name).toLowerCase().indexOf(q) !== -1; });
      $("tbody", codes).innerHTML = list.map(function (c) { return "<tr><td><code>" + esc(c.code) + "</code></td><td><b>" + esc(c.title) + "</b></td><td>" + esc(c.fix) + "</td></tr>"; }).join("") || '<tr><td colspan="3">No matching code.</td></tr>';
      var n = $("#code-count"); if (n) n.textContent = list.length + " of " + all.length + " codes";
    };
    fetch("assets/error-codes.json").then(function (r) { return r.json(); }).then(function (d) { all = d; draw($("#code-q").value); });
    $("#code-q").addEventListener("input", function (e) { draw(e.target.value); });
    var pre = new URLSearchParams(location.search).get("code"); if (pre) { $("#code-q").value = pre; }
  }
  // Looping clips: stop them for people who ask for less motion, and give them controls.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$("video[autoplay]").forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); v.setAttribute("controls", ""); });
  }
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
