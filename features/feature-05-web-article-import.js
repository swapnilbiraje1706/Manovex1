(() => {
  "use strict";

  const STYLE_ID = "mv-wa-feature-styles";
  const ROOT_ID = "mv-wa-root";

  const DEFAULTS = {
    mount: null,
    endpoint: "",
    openReader: null,
    autoConsumeUrl: true,
    sectionTitle: "Web Article Import",
    sectionSubtitle:
      "Open online articles in a clean RSVP-ready reading view. Paste a URL, remove distractions, and launch the text directly into your reader."
  };

  const state = {
    options: { ...DEFAULTS },
    mounted: false,
    busy: false,
    root: null,
    els: {}
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mv-wa-section {
        padding: 56px 0;
      }

      .mv-wa-shell {
        display: grid;
        grid-template-columns: minmax(0, 980px);
        justify-content: center;
        align-items: start;
      }

      .mv-wa-card {
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 18px;
        background: color-mix(in srgb, var(--card, #1f1a12) 96%, transparent);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
        padding: clamp(22px, 4vw, 34px);
      }

      .mv-wa-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(245, 176, 65, 0.12);
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-wa-title {
        margin: 0 0 10px;
        color: var(--text, #f5eadb);
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.05;
      }

      .mv-wa-copy,
      .mv-wa-hint,
      .mv-wa-status,
      .mv-wa-sidecopy,
      .mv-wa-meta {
        color: var(--muted, #a89b85);
        font-size: 14px;
        line-height: 1.6;
      }

      .mv-wa-copy {
        margin: 0 0 20px;
      }

      .mv-wa-grid {
        display: grid;
        gap: 14px;
      }

      .mv-wa-field label {
        display: block;
        margin-bottom: 6px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-wa-input,
      .mv-wa-textarea {
        width: 100%;
        padding: 13px 14px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 12px;
        outline: none;
        background: var(--bg2, #1a1610);
        color: var(--text, #f5eadb);
        font-family: Georgia, serif;
        font-size: 15px;
        transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
      }

      .mv-wa-input:focus,
      .mv-wa-textarea:focus {
        border-color: var(--accent, #f5b041);
        box-shadow: 0 0 0 3px rgba(245, 176, 65, 0.12);
      }

      .mv-wa-textarea {
        min-height: 180px;
        resize: vertical;
      }

      .mv-wa-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .mv-wa-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 44px;
        padding: 12px 18px;
        border: 1px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 700;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s, background 0.2s;
      }

      .mv-wa-btn:hover {
        transform: translateY(-1px);
      }

      .mv-wa-btn-primary {
        background: var(--accent, #f5b041);
        color: var(--accent-contrast, #120f0a);
        box-shadow: 0 8px 24px rgba(245, 176, 65, 0.22);
      }

      .mv-wa-btn-secondary {
        border-color: var(--border, rgba(245,176,65,0.15));
        background: transparent;
        color: var(--text, #f5eadb);
      }

      .mv-wa-btn[disabled] {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .mv-wa-status {
        min-height: 22px;
        margin-top: 8px;
      }

      .mv-wa-info-panel {
        margin-top: 22px;
        padding: 20px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 14px;
        background: color-mix(in srgb, var(--bg2, #1a1610) 76%, transparent);
      }

      .mv-wa-info-panel h4 {
        margin: 0 0 10px;
        color: var(--text, #f5eadb);
        font-size: 22px;
      }

      .mv-wa-benefits {
        display: grid;
        gap: 12px;
        margin: 18px 0;
        padding: 0;
        list-style: none;
      }

      .mv-wa-benefits li {
        position: relative;
        padding-left: 18px;
        color: var(--text, #f5eadb);
        font-size: 14px;
        line-height: 1.55;
      }

      .mv-wa-benefits li::before {
        content: "";
        position: absolute;
        top: 9px;
        left: 0;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--accent, #f5b041);
      }

      .mv-wa-preview {
        margin-top: 14px;
        padding: 16px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 12px;
        background: rgba(245, 176, 65, 0.05);
      }

      .mv-wa-preview strong {
        display: block;
        margin-bottom: 6px;
        color: var(--text, #f5eadb);
        font-size: 15px;
      }

      .mv-wa-meta {
        margin-top: 8px;
        font-size: 13px;
      }

      @media (max-width: 780px) {
        .mv-wa-section {
          padding: 44px 0;
        }

        .mv-wa-card {
          border-radius: 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createMarkup() {
    return `
      <section class="mv-wa-section" id="${ROOT_ID}">
        <div class="mv-wa-shell">
          <div class="mv-wa-card">
            <div class="mv-wa-kicker">Article reader</div>
            <h3 class="mv-wa-title">${escapeHtml(state.options.sectionTitle)}</h3>
            <p class="mv-wa-copy">${escapeHtml(state.options.sectionSubtitle)}</p>

            <div class="mv-wa-grid">
              <div class="mv-wa-field">
                <label for="mvWaUrl">Article URL</label>
                <input
                  id="mvWaUrl"
                  class="mv-wa-input"
                  type="url"
                  placeholder="https://example.com/article"
                  autocomplete="off"
                >
              </div>

              <div class="mv-wa-actions">
                <button class="mv-wa-btn mv-wa-btn-primary" id="mvWaImportBtn" type="button">
                  Import article
                </button>
                <button class="mv-wa-btn mv-wa-btn-secondary" id="mvWaPasteUrlBtn" type="button">
                  Paste from clipboard
                </button>
              </div>

              <div class="mv-wa-field">
                <label for="mvWaPasteTitle">Fallback title for pasted text</label>
                <input
                  id="mvWaPasteTitle"
                  class="mv-wa-input"
                  type="text"
                  placeholder="Optional title"
                >
              </div>

              <div class="mv-wa-field">
                <label for="mvWaPasteText">Paste article text</label>
                <textarea
                  id="mvWaPasteText"
                  class="mv-wa-textarea"
                  placeholder="Paste article text here if you already copied it from the web."
                ></textarea>
              </div>

              <div class="mv-wa-actions">
                <button class="mv-wa-btn mv-wa-btn-primary" id="mvWaReadPasteBtn" type="button">
                  Read pasted text
                </button>
                <button class="mv-wa-btn mv-wa-btn-secondary" id="mvWaClearBtn" type="button">
                  Clear
                </button>
              </div>
            </div>

            <div class="mv-wa-status" id="mvWaStatus" aria-live="polite"></div>

            <div class="mv-wa-info-panel">
              <h4>Clean article reading</h4>
              <p class="mv-wa-sidecopy">
                Add articles from the web and read them with the same focused Manovex controls used for books and documents.
              </p>
              <ul class="mv-wa-benefits">
                <li>Imports public articles from a URL</li>
                <li>Removes obvious clutter such as scripts, menus, and sidebars</li>
                <li>Moves cleaned text into the Manovex reader</li>
                <li>Lets readers paste text when a page blocks automatic import</li>
                <li>Supports quick article handoff from browser links</li>
              </ul>
              <div class="mv-wa-preview" id="mvWaPreview" hidden>
                <strong id="mvWaPreviewTitle"></strong>
                <div class="mv-wa-sidecopy" id="mvWaPreviewExcerpt"></div>
                <div class="mv-wa-meta" id="mvWaPreviewMeta"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function resolveMountTarget(target) {
    if (!target) return null;
    if (target instanceof Element) return target;
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  function resolveOpenReader() {
    if (typeof state.options.openReader === "function") return state.options.openReader;
    if (typeof window.openReaderFromText === "function") return window.openReaderFromText;
    return null;
  }

  function normalizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return "https://" + trimmed;
  }

  function setBusy(busy, message = "") {
    state.busy = busy;
    if (state.els.importBtn) state.els.importBtn.disabled = busy;
    if (state.els.readPasteBtn) state.els.readPasteBtn.disabled = busy;
    if (state.els.pasteUrlBtn) state.els.pasteUrlBtn.disabled = busy;
    if (message) setStatus(message);
  }

  function setStatus(message, kind = "info") {
    if (!state.els.status) return;
    const color =
      kind === "error"
        ? "#ff7b7b"
        : kind === "success"
          ? "var(--accent, #f5b041)"
          : "var(--muted, #a89b85)";
    state.els.status.style.color = color;
    state.els.status.textContent = message;
  }

  function showPreview(article) {
    if (!state.els.preview) return;
    if (!article) {
      state.els.preview.hidden = true;
      state.els.previewTitle.textContent = "";
      state.els.previewExcerpt.textContent = "";
      state.els.previewMeta.textContent = "";
      return;
    }

    state.els.preview.hidden = false;
    state.els.previewTitle.textContent = article.title || "Imported article";
    state.els.previewExcerpt.textContent = article.excerpt || "";
    const metaBits = [];
    if (article.wordCount) metaBits.push(article.wordCount + " words");
    if (article.sourceUrl) metaBits.push(article.sourceUrl);
    state.els.previewMeta.textContent = metaBits.join(" • ");
  }

  async function pasteUrlFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        state.els.url.value = text.trim();
        setStatus("Pasted URL from clipboard.");
      }
    } catch (_error) {
      setStatus("Clipboard access failed. Paste the URL manually.", "error");
    }
  }

  async function fetchArticle(url) {
    if (!state.options.endpoint) {
      throw new Error("Article import is not available right now. Paste the article text below to read it.");
    }

    const response = await fetch(state.options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "Article import failed.");
    }

    return payload;
  }

  async function importUrl(url) {
    const normalizedUrl = normalizeUrl(url || state.els.url?.value);
    if (!normalizedUrl) {
      setStatus("Paste an article URL first.", "error");
      return;
    }

    const openReader = resolveOpenReader();
    if (!openReader) {
      setStatus("The reader is not ready yet. Please refresh and try again.", "error");
      return;
    }

    setBusy(true, "Importing article...");
    showPreview(null);

    try {
      const article = await fetchArticle(normalizedUrl);
      if (!article?.text) throw new Error("The article extractor returned no readable text.");

      state.els.url.value = normalizedUrl;
      showPreview(article);
      setStatus("Article imported. Opening reader...", "success");

      openReader(article.title || "Web Article", article.text, {
        sourceUrl: article.sourceUrl || normalizedUrl,
        kind: "web-article"
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Article import failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  function readPastedText() {
    const text = String(state.els.pasteText?.value || "").trim();
    if (!text) {
      setStatus("Paste some article text first.", "error");
      return;
    }

    const openReader = resolveOpenReader();
    if (!openReader) {
      setStatus("The reader is not ready yet. Please refresh and try again.", "error");
      return;
    }

    const title = String(state.els.pasteTitle?.value || "").trim() || "Pasted Web Article";
    showPreview({
      title,
      excerpt: text.slice(0, 180) + (text.length > 180 ? "..." : ""),
      wordCount: text.split(/\s+/).filter(Boolean).length
    });
    setStatus("Opening pasted article in the reader.", "success");
    openReader(title, text, { kind: "web-article-paste" });
  }

  function clearInputs() {
    if (state.els.url) state.els.url.value = "";
    if (state.els.pasteTitle) state.els.pasteTitle.value = "";
    if (state.els.pasteText) state.els.pasteText.value = "";
    showPreview(null);
    setStatus("");
  }

  async function consumeImportQuery() {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("import_url");
    if (!url) return;
    state.els.url.value = url;
    await importUrl(url);
    params.delete("import_url");
    const nextQuery = params.toString();
    const nextUrl = window.location.pathname + (nextQuery ? "?" + nextQuery : "") + window.location.hash;
    window.history.replaceState({}, "", nextUrl);
  }

  function createBookmarklet(appUrl) {
    const safeAppUrl = String(appUrl || "").trim();
    if (!safeAppUrl) return "";
    const js = `
javascript:(function(){
  var u=window.location.href;
  var target='${safeAppUrl.replace(/'/g, "\\'")}';
  var joiner=target.indexOf('?')===-1?'?':'&';
  window.open(target+joiner+'import_url='+encodeURIComponent(u),'_blank');
})();`;
    return js.trim();
  }

  function bindEvents() {
    state.els.importBtn.addEventListener("click", () => importUrl());
    state.els.readPasteBtn.addEventListener("click", readPastedText);
    state.els.clearBtn.addEventListener("click", clearInputs);
    state.els.pasteUrlBtn.addEventListener("click", pasteUrlFromClipboard);
    state.els.url.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        importUrl();
      }
    });
  }

  function captureElements(root) {
    state.els = {
      url: root.querySelector("#mvWaUrl"),
      importBtn: root.querySelector("#mvWaImportBtn"),
      pasteUrlBtn: root.querySelector("#mvWaPasteUrlBtn"),
      pasteTitle: root.querySelector("#mvWaPasteTitle"),
      pasteText: root.querySelector("#mvWaPasteText"),
      readPasteBtn: root.querySelector("#mvWaReadPasteBtn"),
      clearBtn: root.querySelector("#mvWaClearBtn"),
      status: root.querySelector("#mvWaStatus"),
      preview: root.querySelector("#mvWaPreview"),
      previewTitle: root.querySelector("#mvWaPreviewTitle"),
      previewExcerpt: root.querySelector("#mvWaPreviewExcerpt"),
      previewMeta: root.querySelector("#mvWaPreviewMeta")
    };
  }

  function mount(options = {}) {
    const nextOptions = { ...DEFAULTS, ...options };
    const target = resolveMountTarget(nextOptions.mount);
    if (!target) {
      throw new Error("Article import mount target was not found.");
    }

    state.options = nextOptions;
    ensureStyles();

    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = createMarkup();
    const root = wrapper.firstElementChild;
    target.appendChild(root);

    state.root = root;
    state.mounted = true;
    captureElements(root);
    bindEvents();

    if (state.options.autoConsumeUrl) {
      consumeImportQuery();
    }

    return api;
  }

  const api = {
    mount,
    importUrl,
    readPastedText,
    clearInputs,
    consumeImportQuery,
    createBookmarklet
  };

  window.ManovexFeature05WebArticleImport = api;
})();
