(() => {
  "use strict";

  const STYLE_ID = "mv-dff-feature-styles";
  const FONT_LINK_ID = "mv-dff-font-link";
  const ROOT_ID = "mv-dff-root";

  const DEFAULTS = {
    mount: null,
    targets: [],
    storageKey: "mv_feature_08_accessibility_font",
    sectionTitle: "Dyslexia-Friendly Font",
    sectionSubtitle:
      "Add an accessibility reading profile with a dyslexia-friendly typeface, more breathable spacing, and reader-specific font controls.",
    sampleText:
      "Fast reading works best when the text feels calm, evenly spaced, and easy to track from one fixation to the next.",
    enableFontPreload: true,
    fontStylesheetUrl:
      "https://cdn.jsdelivr.net/npm/@fontsource/open-dyslexic@5.2.6/index.css",
    onChange: null
  };

  const PROFILE_LIBRARY = [
    {
      id: "standard",
      name: "Standard",
      badge: "Default",
      description: "Keeps the app's existing typography while allowing light accessibility tuning.",
      fontFamily: "Georgia, serif",
      lineHeight: 1.65,
      letterSpacingEm: 0.01,
      wordSpacingEm: 0.04,
      paragraphGapEm: 0.85,
      sizePercent: 100
    },
    {
      id: "dyslexia",
      name: "Dyslexia-Friendly",
      badge: "Access",
      description: "Uses a dyslexia-friendly font stack with wider spacing and a slightly larger reading size.",
      fontFamily: "\"OpenDyslexic\", \"OpenDyslexicAlta\", \"Atkinson Hyperlegible\", Verdana, Arial, sans-serif",
      lineHeight: 1.9,
      letterSpacingEm: 0.045,
      wordSpacingEm: 0.12,
      paragraphGapEm: 1,
      sizePercent: 108
    },
    {
      id: "hyperlegible",
      name: "High Legibility",
      badge: "Clarity",
      description: "A cleaner sans-serif reading profile for users who want stronger letter distinction without full dyslexia styling.",
      fontFamily: "\"Atkinson Hyperlegible\", \"OpenDyslexic\", Verdana, Arial, sans-serif",
      lineHeight: 1.82,
      letterSpacingEm: 0.03,
      wordSpacingEm: 0.09,
      paragraphGapEm: 0.95,
      sizePercent: 104
    },
    {
      id: "focus",
      name: "Focus Spacing",
      badge: "Tracking",
      description: "Preserves the font but opens up lines and words to reduce crowding during long reading sessions.",
      fontFamily: "\"OpenDyslexic\", \"Atkinson Hyperlegible\", Georgia, serif",
      lineHeight: 2.02,
      letterSpacingEm: 0.05,
      wordSpacingEm: 0.13,
      paragraphGapEm: 1.05,
      sizePercent: 110
    }
  ];

  const state = {
    options: { ...DEFAULTS },
    mounted: false,
    root: null,
    targetElements: [],
    profileId: "dyslexia",
    enabled: true,
    sizePercent: 108,
    lineHeight: 1.9,
    letterSpacingEm: 0.045,
    wordSpacingEm: 0.12,
    paragraphGapEm: 1,
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
      .mv-dff-section {
        padding: 56px 0;
      }

      .mv-dff-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
        gap: 22px;
        align-items: start;
      }

      .mv-dff-card,
      .mv-dff-preview,
      .mv-dff-meter {
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 18px;
        background: color-mix(in srgb, var(--card, #1f1a12) 96%, transparent);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
      }

      .mv-dff-card,
      .mv-dff-preview {
        padding: 28px;
      }

      .mv-dff-kicker {
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

      .mv-dff-title {
        margin: 0 0 10px;
        color: var(--text, #f5eadb);
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.05;
      }

      .mv-dff-copy,
      .mv-dff-meta,
      .mv-dff-status,
      .mv-dff-labelcopy {
        color: var(--muted, #a89b85);
        font-size: 14px;
        line-height: 1.6;
      }

      .mv-dff-copy {
        margin: 0 0 18px;
      }

      .mv-dff-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
        padding: 14px 16px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.03);
      }

      .mv-dff-toggle-copy strong,
      .mv-dff-preview h4,
      .mv-dff-profile-name,
      .mv-dff-meter-value {
        color: var(--text, #f5eadb);
      }

      .mv-dff-switch {
        position: relative;
        width: 60px;
        height: 34px;
        border: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .mv-dff-switch::after {
        content: "";
        position: absolute;
        top: 4px;
        left: 4px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.2s ease;
      }

      .mv-dff-switch[data-enabled="true"] {
        background: var(--accent, #f5b041);
      }

      .mv-dff-switch[data-enabled="true"]::after {
        transform: translateX(26px);
      }

      .mv-dff-profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .mv-dff-profile {
        display: grid;
        gap: 8px;
        min-height: 144px;
        padding: 16px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.03);
        text-align: left;
        cursor: pointer;
        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      }

      .mv-dff-profile:hover {
        transform: translateY(-1px);
      }

      .mv-dff-profile.is-active {
        border-color: var(--accent, #f5b041);
        box-shadow: 0 10px 28px rgba(245, 176, 65, 0.14);
      }

      .mv-dff-badge {
        display: inline-flex;
        align-items: center;
        width: max-content;
        min-height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(245, 176, 65, 0.14);
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.8px;
        text-transform: uppercase;
      }

      .mv-dff-profile-name {
        font-size: 18px;
        font-weight: 700;
      }

      .mv-dff-controls {
        display: grid;
        gap: 12px;
        margin-top: 18px;
      }

      .mv-dff-control {
        display: grid;
        gap: 10px;
        padding: 14px 16px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.03);
      }

      .mv-dff-control-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .mv-dff-control label {
        color: var(--text, #f5eadb);
        font-size: 15px;
        font-weight: 700;
      }

      .mv-dff-meter {
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.04);
      }

      .mv-dff-range {
        width: 100%;
        accent-color: var(--accent, #f5b041);
      }

      .mv-dff-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .mv-dff-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 12px 18px;
        border: 1px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 700;
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
      }

      .mv-dff-btn:hover {
        transform: translateY(-1px);
      }

      .mv-dff-btn-primary {
        background: var(--accent, #f5b041);
        color: var(--accent-contrast, #120f0a);
        box-shadow: 0 8px 24px rgba(245, 176, 65, 0.22);
      }

      .mv-dff-btn-secondary {
        border-color: var(--border, rgba(245,176,65,0.15));
        background: transparent;
        color: var(--text, #f5eadb);
      }

      .mv-dff-status {
        min-height: 20px;
        margin-top: 14px;
      }

      .mv-dff-preview h4 {
        margin: 0 0 8px;
        font-size: 22px;
      }

      .mv-dff-preview-surface {
        margin-top: 16px;
        padding: 22px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
      }

      .mv-dff-preview-surface p {
        margin: 0;
        color: var(--text, #f5eadb);
      }

      .mv-dff-preview-note {
        margin-top: 14px;
      }

      .mv-dff-target[data-mv-dff-enabled="true"],
      .mv-dff-target[data-mv-dff-enabled="true"] p,
      .mv-dff-target[data-mv-dff-enabled="true"] li,
      .mv-dff-target[data-mv-dff-enabled="true"] blockquote,
      .mv-dff-target[data-mv-dff-enabled="true"] figcaption,
      .mv-dff-target[data-mv-dff-enabled="true"] h1,
      .mv-dff-target[data-mv-dff-enabled="true"] h2,
      .mv-dff-target[data-mv-dff-enabled="true"] h3,
      .mv-dff-target[data-mv-dff-enabled="true"] h4,
      .mv-dff-target[data-mv-dff-enabled="true"] h5,
      .mv-dff-target[data-mv-dff-enabled="true"] h6,
      .mv-dff-target[data-mv-dff-enabled="true"] span,
      .mv-dff-target[data-mv-dff-enabled="true"] a,
      .mv-dff-target[data-mv-dff-enabled="true"] strong,
      .mv-dff-target[data-mv-dff-enabled="true"] em,
      .mv-dff-target[data-mv-dff-enabled="true"] small,
      .mv-dff-target[data-mv-dff-enabled="true"] div {
        font-family: var(--mv-dff-font-family) !important;
        font-size: var(--mv-dff-font-size) !important;
        line-height: var(--mv-dff-line-height) !important;
        letter-spacing: var(--mv-dff-letter-spacing) !important;
        word-spacing: var(--mv-dff-word-spacing) !important;
      }

      .mv-dff-target[data-mv-dff-enabled="true"] p + p,
      .mv-dff-target[data-mv-dff-enabled="true"] li + li,
      .mv-dff-target[data-mv-dff-enabled="true"] blockquote + p,
      .mv-dff-target[data-mv-dff-enabled="true"] p + blockquote {
        margin-top: var(--mv-dff-paragraph-gap) !important;
      }

      .mv-dff-target[data-mv-dff-enabled="true"] button,
      .mv-dff-target[data-mv-dff-enabled="true"] input,
      .mv-dff-target[data-mv-dff-enabled="true"] textarea,
      .mv-dff-target[data-mv-dff-enabled="true"] select,
      .mv-dff-target[data-mv-dff-enabled="true"] svg,
      .mv-dff-target[data-mv-dff-enabled="true"] [class*="icon"] {
        font-family: inherit;
        font-size: inherit;
        letter-spacing: normal;
        word-spacing: normal;
      }

      @media (max-width: 860px) {
        .mv-dff-shell {
          grid-template-columns: 1fr;
        }

        .mv-dff-profile-grid {
          grid-template-columns: 1fr;
        }

        .mv-dff-section {
          padding: 44px 0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureFontStylesheet() {
    if (!state.options.enableFontPreload || !state.options.fontStylesheetUrl) return;
    if (document.getElementById(FONT_LINK_ID)) return;

    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = state.options.fontStylesheetUrl;
    document.head.appendChild(link);
  }

  function getProfile(profileId) {
    return PROFILE_LIBRARY.find((item) => item.id === profileId) || PROFILE_LIBRARY[1];
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(state.options.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function saveState() {
    localStorage.setItem(
      state.options.storageKey,
      JSON.stringify({
        profileId: state.profileId,
        enabled: state.enabled,
        sizePercent: state.sizePercent,
        lineHeight: state.lineHeight,
        letterSpacingEm: state.letterSpacingEm,
        wordSpacingEm: state.wordSpacingEm,
        paragraphGapEm: state.paragraphGapEm
      })
    );
  }

  function restoreState() {
    const saved = loadSavedState();
    if (!saved) {
      applyProfileDefaults(getProfile(state.profileId));
      return;
    }

    state.profileId = getProfile(saved.profileId).id;
    state.enabled = saved.enabled !== false;
    state.sizePercent = Number.isFinite(Number(saved.sizePercent)) ? Number(saved.sizePercent) : 108;
    state.lineHeight = Number.isFinite(Number(saved.lineHeight)) ? Number(saved.lineHeight) : 1.9;
    state.letterSpacingEm = Number.isFinite(Number(saved.letterSpacingEm)) ? Number(saved.letterSpacingEm) : 0.045;
    state.wordSpacingEm = Number.isFinite(Number(saved.wordSpacingEm)) ? Number(saved.wordSpacingEm) : 0.12;
    state.paragraphGapEm = Number.isFinite(Number(saved.paragraphGapEm)) ? Number(saved.paragraphGapEm) : 1;
  }

  function applyProfileDefaults(profile) {
    state.profileId = profile.id;
    state.sizePercent = profile.sizePercent;
    state.lineHeight = profile.lineHeight;
    state.letterSpacingEm = profile.letterSpacingEm;
    state.wordSpacingEm = profile.wordSpacingEm;
    state.paragraphGapEm = profile.paragraphGapEm;
  }

  function createMarkup() {
    return `
      <section class="mv-dff-section" id="${ROOT_ID}">
        <div class="mv-dff-shell">
          <div class="mv-dff-card">
            <div class="mv-dff-kicker">Reading comfort</div>
            <h3 class="mv-dff-title">${escapeHtml(state.options.sectionTitle)}</h3>
            <p class="mv-dff-copy">${escapeHtml(state.options.sectionSubtitle)}</p>

            <div class="mv-dff-toggle">
              <div class="mv-dff-toggle-copy">
                <strong>Accessibility font profile</strong>
                <div class="mv-dff-labelcopy">Turn the reading aid on or off without changing your saved reading setup.</div>
              </div>
              <button class="mv-dff-switch" id="mvDffToggle" data-enabled="false" type="button" aria-label="Toggle accessibility font"></button>
            </div>

            <div class="mv-dff-profile-grid" id="mvDffProfileGrid"></div>

            <div class="mv-dff-controls">
              <div class="mv-dff-control">
                <div class="mv-dff-control-head">
                  <label for="mvDffSizeRange">Reader size</label>
                  <div class="mv-dff-meter"><strong class="mv-dff-meter-value" id="mvDffSizeValue">108%</strong></div>
                </div>
                <input class="mv-dff-range" id="mvDffSizeRange" type="range" min="94" max="138" step="2">
              </div>

              <div class="mv-dff-control">
                <div class="mv-dff-control-head">
                  <label for="mvDffLineRange">Line height</label>
                  <div class="mv-dff-meter"><strong class="mv-dff-meter-value" id="mvDffLineValue">1.90x</strong></div>
                </div>
                <input class="mv-dff-range" id="mvDffLineRange" type="range" min="1.5" max="2.2" step="0.05">
              </div>

              <div class="mv-dff-control">
                <div class="mv-dff-control-head">
                  <label for="mvDffLetterRange">Letter spacing</label>
                  <div class="mv-dff-meter"><strong class="mv-dff-meter-value" id="mvDffLetterValue">0.045em</strong></div>
                </div>
                <input class="mv-dff-range" id="mvDffLetterRange" type="range" min="0" max="0.08" step="0.005">
              </div>
            </div>

            <div class="mv-dff-actions">
              <button class="mv-dff-btn mv-dff-btn-primary" id="mvDffApplyBtn" type="button">Apply to reader</button>
              <button class="mv-dff-btn mv-dff-btn-secondary" id="mvDffResetBtn" type="button">Reset profile</button>
            </div>

            <div class="mv-dff-status" id="mvDffStatus" aria-live="polite"></div>
          </div>

          <aside class="mv-dff-preview">
            <div class="mv-dff-kicker">Live preview</div>
            <h4>How the text feels</h4>
            <p class="mv-dff-meta">Use this preview to judge letter separation, breathing room, and readability before applying the profile.</p>
            <div class="mv-dff-preview-surface" id="mvDffPreviewSurface">
              <p id="mvDffPreviewText">${escapeHtml(state.options.sampleText)}</p>
            </div>
            <p class="mv-dff-preview-note mv-dff-meta" id="mvDffPreviewNote"></p>
          </aside>
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

  function resolveTargetElements(targets) {
    const list = Array.isArray(targets) ? targets : [targets];
    const found = [];

    list.forEach((entry) => {
      if (!entry) return;
      if (entry instanceof Element) {
        found.push(entry);
        return;
      }
      if (typeof entry === "string") {
        document.querySelectorAll(entry).forEach((node) => {
          if (node instanceof Element) found.push(node);
        });
      }
    });

    return Array.from(new Set(found));
  }

  function setStatus(message, kind = "info") {
    if (!state.els.status) return;
    state.els.status.style.color =
      kind === "error"
        ? "#ff7b7b"
        : kind === "success"
          ? "var(--accent, #f5b041)"
          : "var(--muted, #a89b85)";
    state.els.status.textContent = message;
  }

  function updateProfileButtons() {
    if (!state.els.profileGrid) return;
    const profile = getProfile(state.profileId);

    state.els.profileGrid.querySelectorAll("[data-profile-id]").forEach((node) => {
      node.classList.toggle("is-active", node.getAttribute("data-profile-id") === profile.id);
    });
  }

  function updateControlValues() {
    if (!state.els.sizeRange) return;
    state.els.sizeRange.value = String(state.sizePercent);
    state.els.lineRange.value = String(state.lineHeight);
    state.els.letterRange.value = String(state.letterSpacingEm);
    state.els.sizeValue.textContent = `${Math.round(state.sizePercent)}%`;
    state.els.lineValue.textContent = `${state.lineHeight.toFixed(2)}x`;
    state.els.letterValue.textContent = `${state.letterSpacingEm.toFixed(3)}em`;
    state.els.toggle.dataset.enabled = String(state.enabled);
  }

  function applyStylesToElement(element) {
    element.classList.add("mv-dff-target");
    element.dataset.mvDffEnabled = state.enabled ? "true" : "false";
    element.style.setProperty("--mv-dff-font-family", getProfile(state.profileId).fontFamily);
    element.style.setProperty("--mv-dff-font-size", `${state.sizePercent}%`);
    element.style.setProperty("--mv-dff-line-height", String(state.lineHeight));
    element.style.setProperty("--mv-dff-letter-spacing", `${state.letterSpacingEm.toFixed(3)}em`);
    element.style.setProperty("--mv-dff-word-spacing", `${state.wordSpacingEm.toFixed(3)}em`);
    element.style.setProperty("--mv-dff-paragraph-gap", `${state.paragraphGapEm.toFixed(2)}em`);
  }

  function applyToTargets() {
    state.targetElements.forEach((element) => {
      applyStylesToElement(element);
    });
  }

  function updatePreview() {
    if (!state.els.previewSurface || !state.els.previewNote) return;
    const profile = getProfile(state.profileId);
    applyStylesToElement(state.els.previewSurface);
    state.els.previewSurface.dataset.mvDffEnabled = state.enabled ? "true" : "false";
    state.els.previewNote.textContent = `${profile.name}: ${profile.description}`;
  }

  function notifyChange() {
    if (typeof state.options.onChange === "function") {
      state.options.onChange(getState());
    }
  }

  function persistAndRefresh(statusMessage, kind = "info") {
    saveState();
    updateControlValues();
    updateProfileButtons();
    updatePreview();
    applyToTargets();
    if (statusMessage) setStatus(statusMessage, kind);
    notifyChange();
  }

  function renderProfiles() {
    state.els.profileGrid.innerHTML = "";
    PROFILE_LIBRARY.forEach((profile) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mv-dff-profile";
      button.setAttribute("data-profile-id", profile.id);
      button.innerHTML = `
        <span class="mv-dff-badge">${escapeHtml(profile.badge)}</span>
        <span class="mv-dff-profile-name">${escapeHtml(profile.name)}</span>
        <span class="mv-dff-labelcopy">${escapeHtml(profile.description)}</span>
      `;
      state.els.profileGrid.appendChild(button);
    });
    updateProfileButtons();
  }

  function captureElements(root) {
    state.els = {
      toggle: root.querySelector("#mvDffToggle"),
      profileGrid: root.querySelector("#mvDffProfileGrid"),
      sizeRange: root.querySelector("#mvDffSizeRange"),
      lineRange: root.querySelector("#mvDffLineRange"),
      letterRange: root.querySelector("#mvDffLetterRange"),
      sizeValue: root.querySelector("#mvDffSizeValue"),
      lineValue: root.querySelector("#mvDffLineValue"),
      letterValue: root.querySelector("#mvDffLetterValue"),
      applyBtn: root.querySelector("#mvDffApplyBtn"),
      resetBtn: root.querySelector("#mvDffResetBtn"),
      status: root.querySelector("#mvDffStatus"),
      previewSurface: root.querySelector("#mvDffPreviewSurface"),
      previewNote: root.querySelector("#mvDffPreviewNote")
    };
  }

  function setTargets(targets) {
    state.targetElements = resolveTargetElements(targets);
    applyToTargets();
    return state.targetElements;
  }

  function setEnabled(enabled) {
    state.enabled = Boolean(enabled);
    persistAndRefresh(
      state.enabled
        ? "Accessibility font enabled."
        : "Accessibility font disabled.",
      state.enabled ? "success" : "info"
    );
    return state.enabled;
  }

  function setProfile(profileId) {
    const profile = getProfile(profileId);
    applyProfileDefaults(profile);
    persistAndRefresh(`${profile.name} profile selected.`, "success");
    return getState();
  }

  function updateSettings(patch = {}) {
    if (Number.isFinite(Number(patch.sizePercent))) {
      state.sizePercent = Math.max(94, Math.min(138, Number(patch.sizePercent)));
    }
    if (Number.isFinite(Number(patch.lineHeight))) {
      state.lineHeight = Math.max(1.5, Math.min(2.2, Number(patch.lineHeight)));
    }
    if (Number.isFinite(Number(patch.letterSpacingEm))) {
      state.letterSpacingEm = Math.max(0, Math.min(0.08, Number(patch.letterSpacingEm)));
      state.wordSpacingEm = Math.max(0.02, Math.min(0.16, Number((patch.letterSpacingEm * 2.4).toFixed(3))));
    }
    if (Number.isFinite(Number(patch.paragraphGapEm))) {
      state.paragraphGapEm = Math.max(0.6, Math.min(1.2, Number(patch.paragraphGapEm)));
    }

    persistAndRefresh("Accessibility font settings updated.");
    return getState();
  }

  function resetPreferences() {
    applyProfileDefaults(getProfile("dyslexia"));
    state.enabled = true;
    persistAndRefresh("Accessibility font profile reset to the recommended dyslexia-friendly preset.", "success");
    return getState();
  }

  function getState() {
    return {
      enabled: state.enabled,
      profileId: state.profileId,
      sizePercent: state.sizePercent,
      lineHeight: state.lineHeight,
      letterSpacingEm: state.letterSpacingEm,
      wordSpacingEm: state.wordSpacingEm,
      paragraphGapEm: state.paragraphGapEm,
      targetCount: state.targetElements.length
    };
  }

  function bindEvents() {
    state.els.toggle.addEventListener("click", () => {
      setEnabled(!state.enabled);
    });

    state.els.profileGrid.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-profile-id]") : null;
      if (!target) return;
      setProfile(target.getAttribute("data-profile-id") || "dyslexia");
    });

    state.els.sizeRange.addEventListener("input", () => {
      updateSettings({ sizePercent: Number(state.els.sizeRange.value) });
    });

    state.els.lineRange.addEventListener("input", () => {
      updateSettings({ lineHeight: Number(state.els.lineRange.value) });
    });

    state.els.letterRange.addEventListener("input", () => {
      updateSettings({ letterSpacingEm: Number(state.els.letterRange.value) });
    });

    state.els.applyBtn.addEventListener("click", () => {
      applyToTargets();
      setStatus(
        state.targetElements.length
          ? "Accessibility font styling applied to the reader."
          : "Open the reader to apply this profile while reading.",
        state.targetElements.length ? "success" : "info"
      );
    });

    state.els.resetBtn.addEventListener("click", () => {
      resetPreferences();
    });
  }

  function mount(options = {}) {
    state.options = { ...DEFAULTS, ...options };
    ensureStyles();
    ensureFontStylesheet();
    restoreState();
    state.targetElements = resolveTargetElements(state.options.targets);

    const mountTarget = resolveMountTarget(state.options.mount);
    if (!mountTarget) {
      throw new Error("Accessibility font mount target was not found.");
    }

    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = createMarkup();
    const root = wrapper.firstElementChild;
    mountTarget.appendChild(root);

    state.root = root;
    state.mounted = true;
    captureElements(root);
    renderProfiles();
    updateControlValues();
    bindEvents();
    updatePreview();
    applyToTargets();
    setStatus(
      state.targetElements.length
        ? "Ready. Accessibility settings can be applied to the reader."
        : "Ready. Open the reader to apply these settings while reading.",
      state.targetElements.length ? "success" : "info"
    );

    return api;
  }

  const api = {
    mount,
    setTargets,
    setEnabled,
    setProfile,
    updateSettings,
    resetPreferences,
    getState
  };

  window.ManovexFeature08DyslexiaFriendlyFont = api;
})();
