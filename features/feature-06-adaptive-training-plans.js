(() => {
  "use strict";

  const STYLE_ID = "mv-atp-feature-styles";
  const ROOT_ID = "mv-atp-root";

  const DEFAULTS = {
    mount: null,
    storageKey: "mv_feature_06_training_state",
    launchSession: null,
    sectionTitle: "Adaptive Training Plans",
    sectionSubtitle:
      "Guide readers from beginner to advanced with structured sessions, automatic difficulty adjustment, deep retention mode, and a custom training builder."
  };

  const PLAN_LIBRARY = [
    {
      id: "beginner",
      name: "Beginner Foundation",
      badge: "Beginner",
      intro: "Build consistency, reduce eye friction, and protect comprehension before chasing top speed.",
      baseWpm: 220,
      targetWpm: 320,
      dailyMinutes: 12,
      comprehensionFloor: 82,
      retentionFloor: 70,
      rampOn: true,
      wordsPerStep: 1,
      fontSize: 24
    },
    {
      id: "intermediate",
      name: "Intermediate Builder",
      badge: "Growth",
      intro: "Push speed upward while keeping comprehension stable through structured practice blocks.",
      baseWpm: 320,
      targetWpm: 480,
      dailyMinutes: 16,
      comprehensionFloor: 80,
      retentionFloor: 72,
      rampOn: true,
      wordsPerStep: 1,
      fontSize: 22
    },
    {
      id: "advanced",
      name: "Advanced Accelerator",
      badge: "Advanced",
      intro: "Train high-speed recognition, shorter ramp-up, and more aggressive progression rules.",
      baseWpm: 480,
      targetWpm: 750,
      dailyMinutes: 20,
      comprehensionFloor: 76,
      retentionFloor: 70,
      rampOn: false,
      wordsPerStep: 2,
      fontSize: 20
    }
  ];

  const MODE_LIBRARY = [
    {
      id: "steady",
      name: "Steady Build",
      summary: "Balanced speed, comprehension, and recall.",
      speedBonus: 0,
      durationShift: 0,
      retentionBoost: 0
    },
    {
      id: "intensity",
      name: "High-Intensity",
      summary: "Shorter, faster sessions that push speed adaptation harder.",
      speedBonus: 35,
      durationShift: -4,
      retentionBoost: -4
    },
    {
      id: "retention",
      name: "Deep Retention",
      summary: "Slightly slower pace with stronger recall reinforcement after the read.",
      speedBonus: -20,
      durationShift: 4,
      retentionBoost: 8
    }
  ];

  const defaultCustomPlan = () => ({
    name: "Custom Builder",
    baseWpm: 280,
    targetWpm: 520,
    dailyMinutes: 15,
    comprehensionFloor: 80,
    retentionFloor: 74,
    rampOn: true,
    wordsPerStep: 1,
    fontSize: 22
  });

  const defaultData = () => ({
    selectedPlanId: "beginner",
    selectedModeId: "steady",
    customPlan: defaultCustomPlan(),
    history: [],
    createdAt: new Date().toISOString()
  });

  const state = {
    options: { ...DEFAULTS },
    root: null,
    mounted: false,
    data: defaultData(),
    recommendation: null,
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
      .mv-atp-section {
        padding: 56px 0;
      }

      .mv-atp-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.12fr) minmax(300px, 0.88fr);
        gap: 22px;
        align-items: start;
      }

      .mv-atp-card,
      .mv-atp-sidecard,
      .mv-atp-plan,
      .mv-atp-mini {
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 18px;
        background: color-mix(in srgb, var(--card, #1f1a12) 96%, transparent);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
      }

      .mv-atp-card,
      .mv-atp-sidecard {
        padding: 28px;
      }

      .mv-atp-kicker {
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

      .mv-atp-title {
        margin: 0 0 10px;
        color: var(--text, #f5eadb);
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.05;
      }

      .mv-atp-copy,
      .mv-atp-subcopy,
      .mv-atp-note,
      .mv-atp-meta,
      .mv-atp-status {
        color: var(--muted, #a89b85);
        font-size: 14px;
        line-height: 1.6;
      }

      .mv-atp-copy {
        margin: 0 0 22px;
      }

      .mv-atp-grid {
        display: grid;
        gap: 18px;
      }

      .mv-atp-statrow {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .mv-atp-mini {
        padding: 16px;
      }

      .mv-atp-mini span {
        display: block;
        margin-bottom: 6px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-atp-mini strong {
        color: var(--text, #f5eadb);
        font-size: 24px;
        line-height: 1;
      }

      .mv-atp-planlist {
        display: grid;
        gap: 12px;
      }

      .mv-atp-plan {
        padding: 18px;
        cursor: pointer;
        transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s, background 0.2s;
      }

      .mv-atp-plan:hover {
        transform: translateY(-1px);
        border-color: rgba(245, 176, 65, 0.4);
      }

      .mv-atp-plan.active {
        border-color: var(--accent, #f5b041);
        box-shadow: 0 10px 28px rgba(245, 176, 65, 0.16);
        background: rgba(245, 176, 65, 0.06);
      }

      .mv-atp-plan-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .mv-atp-plan h4 {
        margin: 0;
        color: var(--text, #f5eadb);
        font-size: 18px;
      }

      .mv-atp-badge {
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(245, 176, 65, 0.12);
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .mv-atp-plan-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }

      .mv-atp-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--text, #f5eadb);
        font-family: Arial, sans-serif;
        font-size: 12px;
      }

      .mv-atp-mode-row,
      .mv-atp-action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .mv-atp-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 10px 14px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 999px;
        background: transparent;
        color: var(--text, #f5eadb);
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 13px;
        font-weight: 700;
        transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
      }

      .mv-atp-chip:hover {
        transform: translateY(-1px);
        border-color: rgba(245, 176, 65, 0.4);
      }

      .mv-atp-chip.active {
        border-color: var(--accent, #f5b041);
        background: var(--accent, #f5b041);
        color: var(--accent-contrast, #120f0a);
      }

      .mv-atp-field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .mv-atp-field label {
        display: block;
        margin-bottom: 6px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-atp-input,
      .mv-atp-select {
        width: 100%;
        min-height: 44px;
        padding: 12px 13px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 12px;
        outline: none;
        background: var(--bg2, #1a1610);
        color: var(--text, #f5eadb);
        font-family: Georgia, serif;
        font-size: 15px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .mv-atp-input:focus,
      .mv-atp-select:focus {
        border-color: var(--accent, #f5b041);
        box-shadow: 0 0 0 3px rgba(245, 176, 65, 0.12);
      }

      .mv-atp-btn {
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

      .mv-atp-btn:hover {
        transform: translateY(-1px);
      }

      .mv-atp-btn-primary {
        background: var(--accent, #f5b041);
        color: var(--accent-contrast, #120f0a);
        box-shadow: 0 8px 24px rgba(245, 176, 65, 0.22);
      }

      .mv-atp-btn-secondary {
        border-color: var(--border, rgba(245,176,65,0.15));
        background: transparent;
        color: var(--text, #f5eadb);
      }

      .mv-atp-recommendation {
        padding: 18px;
        border: 1px solid rgba(245, 176, 65, 0.18);
        border-radius: 14px;
        background: rgba(245, 176, 65, 0.06);
      }

      .mv-atp-recommendation h4,
      .mv-atp-sidecard h4 {
        margin: 0 0 8px;
        color: var(--text, #f5eadb);
        font-size: 22px;
      }

      .mv-atp-recommendation-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin: 16px 0;
      }

      .mv-atp-recommendation-grid div {
        padding: 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
      }

      .mv-atp-recommendation-grid span {
        display: block;
        margin-bottom: 4px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-atp-recommendation-grid strong {
        color: var(--text, #f5eadb);
        font-size: 18px;
      }

      .mv-atp-sidecard ul {
        display: grid;
        gap: 12px;
        margin: 18px 0;
        padding: 0;
        list-style: none;
      }

      .mv-atp-sidecard li {
        position: relative;
        padding-left: 18px;
        color: var(--text, #f5eadb);
        font-size: 14px;
        line-height: 1.55;
      }

      .mv-atp-sidecard li::before {
        content: "";
        position: absolute;
        top: 9px;
        left: 0;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--accent, #f5b041);
      }

      .mv-atp-status {
        min-height: 20px;
      }

      @media (max-width: 860px) {
        .mv-atp-shell,
        .mv-atp-statrow,
        .mv-atp-field-grid,
        .mv-atp-recommendation-grid {
          grid-template-columns: 1fr;
        }

        .mv-atp-section {
          padding: 44px 0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function safeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function loadPersistedState() {
    try {
      const raw = localStorage.getItem(state.options.storageKey);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      return {
        ...defaultData(),
        ...parsed,
        customPlan: {
          ...defaultCustomPlan(),
          ...(parsed?.customPlan || {})
        },
        history: Array.isArray(parsed?.history) ? parsed.history : []
      };
    } catch (_error) {
      return defaultData();
    }
  }

  function saveState() {
    localStorage.setItem(state.options.storageKey, JSON.stringify(state.data));
  }

  function getPlanById(id) {
    return PLAN_LIBRARY.find((plan) => plan.id === id) || PLAN_LIBRARY[0];
  }

  function getModeById(id) {
    return MODE_LIBRARY.find((mode) => mode.id === id) || MODE_LIBRARY[0];
  }

  function getSelectedPlan() {
    return state.data.selectedPlanId === "custom"
      ? { id: "custom", badge: "Custom", intro: "Hand-built plan", ...state.data.customPlan }
      : getPlanById(state.data.selectedPlanId);
  }

  function getRecentHistory(limit = 5) {
    return state.data.history.slice(-limit);
  }

  function averageFromHistory(field, fallback) {
    const recent = getRecentHistory();
    if (!recent.length) return fallback;
    const total = recent.reduce((sum, item) => sum + safeNumber(item[field], fallback), 0);
    return Math.round(total / recent.length);
  }

  function getBestWpm() {
    if (!state.data.history.length) return 0;
    return Math.max(...state.data.history.map((item) => safeNumber(item.actualWpm, 0)));
  }

  function computeRecommendation() {
    const plan = getSelectedPlan();
    const mode = getModeById(state.data.selectedModeId);
    const recent = getRecentHistory();
    const latest = recent[recent.length - 1] || null;

    const baselineWpm = latest ? safeNumber(latest.actualWpm, plan.baseWpm) : plan.baseWpm;
    const baselineComp = latest ? safeNumber(latest.comprehension, plan.comprehensionFloor) : plan.comprehensionFloor;
    const baselineRetention = latest ? safeNumber(latest.retention, plan.retentionFloor) : plan.retentionFloor;

    let nextWpm = baselineWpm;
    let wordsPerStep = plan.wordsPerStep;
    let duration = Math.max(8, safeNumber(plan.dailyMinutes, 14) + mode.durationShift);
    const notes = [];

    if (baselineComp >= plan.comprehensionFloor + 6 && baselineRetention >= plan.retentionFloor) {
      nextWpm += 25;
      notes.push("Strong comprehension and recall. Increase target speed slightly.");
    } else if (baselineComp < plan.comprehensionFloor - 8) {
      nextWpm -= 20;
      notes.push("Comprehension dropped below the plan floor. Slow down and stabilise.");
    } else if (baselineRetention < plan.retentionFloor - 8) {
      nextWpm -= 10;
      notes.push("Retention needs reinforcement. Reduce speed a little and add recall time.");
    } else {
      notes.push("Hold the current range and reinforce consistency.");
    }

    nextWpm += mode.speedBonus;
    nextWpm = Math.max(160, Math.min(safeNumber(plan.targetWpm, 600), nextWpm));

    if (nextWpm >= 460) wordsPerStep = Math.max(wordsPerStep, 2);
    if (nextWpm >= 620) wordsPerStep = Math.max(wordsPerStep, 3);

    const comprehensionTarget = Math.max(70, Math.min(94, plan.comprehensionFloor));
    const retentionTarget = Math.max(65, Math.min(92, plan.retentionFloor + mode.retentionBoost));
    const recallDelay = mode.id === "retention" ? 15 : mode.id === "intensity" ? 3 : 8;

    return {
      planId: plan.id,
      planName: plan.name,
      modeId: mode.id,
      modeName: mode.name,
      label: plan.name + " - " + mode.name,
      targetWpm: nextWpm,
      durationMinutes: duration,
      wordsPerStep,
      rampOn: mode.id === "intensity" ? false : !!plan.rampOn,
      fontSize: safeNumber(plan.fontSize, 22),
      comprehensionTarget,
      retentionTarget,
      recallDelayMinutes: recallDelay,
      intensityLevel: mode.id === "intensity" ? "high" : mode.id === "retention" ? "retention" : "balanced",
      notes,
      planSnapshot: cloneData(plan),
      historyCount: state.data.history.length
    };
  }

  function createMarkup() {
    return `
      <section class="mv-atp-section" id="${ROOT_ID}">
        <div class="mv-atp-shell">
          <div class="mv-atp-card">
            <div class="mv-atp-kicker">Adaptive training</div>
            <h3 class="mv-atp-title">${escapeHtml(state.options.sectionTitle)}</h3>
            <p class="mv-atp-copy">${escapeHtml(state.options.sectionSubtitle)}</p>

            <div class="mv-atp-grid">
              <div class="mv-atp-statrow">
                <div class="mv-atp-mini">
                  <span>Sessions logged</span>
                  <strong id="mvAtpSessionsCount">0</strong>
                </div>
                <div class="mv-atp-mini">
                  <span>Average comprehension</span>
                  <strong id="mvAtpAvgComp">0%</strong>
                </div>
                <div class="mv-atp-mini">
                  <span>Personal best</span>
                  <strong id="mvAtpBestWpm">0</strong>
                </div>
              </div>

              <div>
                <div class="mv-atp-kicker">Training tracks</div>
                <div class="mv-atp-planlist" id="mvAtpPlanList"></div>
              </div>

              <div>
                <div class="mv-atp-kicker">Training mode</div>
                <div class="mv-atp-mode-row" id="mvAtpModeRow"></div>
              </div>

              <div>
                <div class="mv-atp-kicker">Custom builder</div>
                <div class="mv-atp-field-grid">
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomName">Plan name</label>
                    <input id="mvAtpCustomName" class="mv-atp-input" type="text" placeholder="Custom Builder">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomBaseWpm">Base WPM</label>
                    <input id="mvAtpCustomBaseWpm" class="mv-atp-input" type="number" min="120" max="1200" step="5">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomTargetWpm">Target WPM</label>
                    <input id="mvAtpCustomTargetWpm" class="mv-atp-input" type="number" min="140" max="1500" step="5">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomMinutes">Daily minutes</label>
                    <input id="mvAtpCustomMinutes" class="mv-atp-input" type="number" min="5" max="60" step="1">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomComp">Comprehension floor</label>
                    <input id="mvAtpCustomComp" class="mv-atp-input" type="number" min="50" max="100" step="1">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomRetention">Retention floor</label>
                    <input id="mvAtpCustomRetention" class="mv-atp-input" type="number" min="50" max="100" step="1">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomWords">Highlight words</label>
                    <select id="mvAtpCustomWords" class="mv-atp-select">
                      <option value="1">1 word</option>
                      <option value="2">2 words</option>
                      <option value="3">3 words</option>
                    </select>
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpCustomFont">Reader font size</label>
                    <input id="mvAtpCustomFont" class="mv-atp-input" type="number" min="18" max="36" step="1">
                  </div>
                </div>
                <div class="mv-atp-action-row" style="margin-top:12px">
                  <button class="mv-atp-btn mv-atp-btn-primary" id="mvAtpSaveCustomBtn" type="button">Save custom plan</button>
                  <button class="mv-atp-btn mv-atp-btn-secondary" id="mvAtpUseCustomBtn" type="button">Use custom plan</button>
                </div>
              </div>

              <div class="mv-atp-recommendation">
                <div class="mv-atp-kicker">Next recommended session</div>
                <h4 id="mvAtpRecoTitle">Training recommendation</h4>
                <p class="mv-atp-subcopy" id="mvAtpRecoCopy"></p>
                <div class="mv-atp-recommendation-grid">
                  <div>
                    <span>Target WPM</span>
                    <strong id="mvAtpRecoWpm">0</strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong id="mvAtpRecoMinutes">0 min</strong>
                  </div>
                  <div>
                    <span>Words per step</span>
                    <strong id="mvAtpRecoWords">1</strong>
                  </div>
                  <div>
                    <span>Recall delay</span>
                    <strong id="mvAtpRecoRecall">0 min</strong>
                  </div>
                </div>
                <p class="mv-atp-note" id="mvAtpRecoNotes"></p>
                <div class="mv-atp-action-row" style="margin-top:14px">
                  <button class="mv-atp-btn mv-atp-btn-primary" id="mvAtpLaunchBtn" type="button">Launch recommended session</button>
                </div>
              </div>

              <div>
                <div class="mv-atp-kicker">Log last session</div>
                <div class="mv-atp-field-grid">
                  <div class="mv-atp-field">
                    <label for="mvAtpResultWpm">Actual WPM</label>
                    <input id="mvAtpResultWpm" class="mv-atp-input" type="number" min="120" max="1500" step="1">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpResultComp">Comprehension %</label>
                    <input id="mvAtpResultComp" class="mv-atp-input" type="number" min="0" max="100" step="1">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpResultRetention">Retention %</label>
                    <input id="mvAtpResultRetention" class="mv-atp-input" type="number" min="0" max="100" step="1">
                  </div>
                  <div class="mv-atp-field">
                    <label for="mvAtpResultMinutes">Minutes read</label>
                    <input id="mvAtpResultMinutes" class="mv-atp-input" type="number" min="1" max="90" step="1">
                  </div>
                </div>
                <div class="mv-atp-action-row" style="margin-top:12px">
                  <button class="mv-atp-btn mv-atp-btn-primary" id="mvAtpSaveResultBtn" type="button">Save session result</button>
                  <button class="mv-atp-btn mv-atp-btn-secondary" id="mvAtpResetHistoryBtn" type="button">Reset history</button>
                </div>
                <div class="mv-atp-status" id="mvAtpStatus" aria-live="polite"></div>
              </div>
            </div>
          </div>

          <aside class="mv-atp-sidecard">
            <div class="mv-atp-kicker">Planner notes</div>
            <h4>How training adapts</h4>
            <p class="mv-atp-subcopy">
              The planner watches speed, comprehension, and retention together. It nudges the next session up or down instead of just increasing WPM blindly.
            </p>
            <ul>
              <li>Beginner, intermediate, and advanced tracks are built in.</li>
              <li>High-intensity mode shortens the session and increases pressure.</li>
              <li>Deep retention mode slows the pace slightly and adds stronger recall spacing.</li>
              <li>The custom builder lets you define your own progression envelope.</li>
              <li>Session results can guide the next recommendation.</li>
            </ul>
            <p class="mv-atp-meta">
              Launch a recommended session, then save the result to keep the training plan adaptive.
            </p>
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

  function captureElements(root) {
    state.els = {
      planList: root.querySelector("#mvAtpPlanList"),
      modeRow: root.querySelector("#mvAtpModeRow"),
      sessionsCount: root.querySelector("#mvAtpSessionsCount"),
      avgComp: root.querySelector("#mvAtpAvgComp"),
      bestWpm: root.querySelector("#mvAtpBestWpm"),
      recoTitle: root.querySelector("#mvAtpRecoTitle"),
      recoCopy: root.querySelector("#mvAtpRecoCopy"),
      recoWpm: root.querySelector("#mvAtpRecoWpm"),
      recoMinutes: root.querySelector("#mvAtpRecoMinutes"),
      recoWords: root.querySelector("#mvAtpRecoWords"),
      recoRecall: root.querySelector("#mvAtpRecoRecall"),
      recoNotes: root.querySelector("#mvAtpRecoNotes"),
      launchBtn: root.querySelector("#mvAtpLaunchBtn"),
      saveCustomBtn: root.querySelector("#mvAtpSaveCustomBtn"),
      useCustomBtn: root.querySelector("#mvAtpUseCustomBtn"),
      saveResultBtn: root.querySelector("#mvAtpSaveResultBtn"),
      resetHistoryBtn: root.querySelector("#mvAtpResetHistoryBtn"),
      status: root.querySelector("#mvAtpStatus"),
      customName: root.querySelector("#mvAtpCustomName"),
      customBaseWpm: root.querySelector("#mvAtpCustomBaseWpm"),
      customTargetWpm: root.querySelector("#mvAtpCustomTargetWpm"),
      customMinutes: root.querySelector("#mvAtpCustomMinutes"),
      customComp: root.querySelector("#mvAtpCustomComp"),
      customRetention: root.querySelector("#mvAtpCustomRetention"),
      customWords: root.querySelector("#mvAtpCustomWords"),
      customFont: root.querySelector("#mvAtpCustomFont"),
      resultWpm: root.querySelector("#mvAtpResultWpm"),
      resultComp: root.querySelector("#mvAtpResultComp"),
      resultRetention: root.querySelector("#mvAtpResultRetention"),
      resultMinutes: root.querySelector("#mvAtpResultMinutes")
    };
  }

  function renderPlanList() {
    state.els.planList.innerHTML = "";
    const plans = [...PLAN_LIBRARY, { id: "custom", name: state.data.customPlan.name || "Custom Builder", badge: "Custom", intro: "Use your own progression values." }];

    plans.forEach((plan) => {
      const isCustom = plan.id === "custom";
      const planData = isCustom ? { ...state.data.customPlan, ...plan } : plan;
      const article = document.createElement("article");
      article.className = "mv-atp-plan" + (state.data.selectedPlanId === plan.id ? " active" : "");
      article.innerHTML = `
        <div class="mv-atp-plan-head">
          <h4>${escapeHtml(planData.name)}</h4>
          <span class="mv-atp-badge">${escapeHtml(planData.badge)}</span>
        </div>
        <p class="mv-atp-subcopy">${escapeHtml(planData.intro || "Custom training plan")}</p>
        <div class="mv-atp-plan-stats">
          <span class="mv-atp-pill">${escapeHtml(String(planData.baseWpm || 0))} WPM start</span>
          <span class="mv-atp-pill">${escapeHtml(String(planData.dailyMinutes || 0))} min / day</span>
          <span class="mv-atp-pill">${escapeHtml(String(planData.comprehensionFloor || 0))}% comp</span>
        </div>
      `;
      article.addEventListener("click", () => {
        state.data.selectedPlanId = plan.id;
        saveState();
        rerender();
      });
      state.els.planList.appendChild(article);
    });
  }

  function renderModeRow() {
    state.els.modeRow.innerHTML = "";
    MODE_LIBRARY.forEach((mode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mv-atp-chip" + (state.data.selectedModeId === mode.id ? " active" : "");
      button.textContent = mode.name;
      button.title = mode.summary;
      button.addEventListener("click", () => {
        state.data.selectedModeId = mode.id;
        saveState();
        rerender();
      });
      state.els.modeRow.appendChild(button);
    });
  }

  function renderCustomBuilder() {
    const custom = state.data.customPlan;
    state.els.customName.value = custom.name || "";
    state.els.customBaseWpm.value = custom.baseWpm || 280;
    state.els.customTargetWpm.value = custom.targetWpm || 520;
    state.els.customMinutes.value = custom.dailyMinutes || 15;
    state.els.customComp.value = custom.comprehensionFloor || 80;
    state.els.customRetention.value = custom.retentionFloor || 74;
    state.els.customWords.value = String(custom.wordsPerStep || 1);
    state.els.customFont.value = custom.fontSize || 22;
  }

  function renderStats() {
    const history = state.data.history;
    state.els.sessionsCount.textContent = String(history.length);
    state.els.avgComp.textContent = averageFromHistory("comprehension", 0) + "%";
    state.els.bestWpm.textContent = String(getBestWpm());
  }

  function renderRecommendation() {
    state.recommendation = computeRecommendation();
    const reco = state.recommendation;
    state.els.recoTitle.textContent = reco.label;
    state.els.recoCopy.textContent =
      "Use this as the next guided session. It reflects your current track, mode, and the latest performance trend.";
    state.els.recoWpm.textContent = String(reco.targetWpm);
    state.els.recoMinutes.textContent = reco.durationMinutes + " min";
    state.els.recoWords.textContent = String(reco.wordsPerStep);
    state.els.recoRecall.textContent = reco.recallDelayMinutes + " min";
    state.els.recoNotes.textContent = reco.notes.join(" ");
  }

  function rerender() {
    renderStats();
    renderPlanList();
    renderModeRow();
    renderCustomBuilder();
    renderRecommendation();
  }

  function saveCustomPlan() {
    state.data.customPlan = {
      name: String(state.els.customName.value || "Custom Builder").trim() || "Custom Builder",
      baseWpm: safeNumber(state.els.customBaseWpm.value, 280),
      targetWpm: safeNumber(state.els.customTargetWpm.value, 520),
      dailyMinutes: safeNumber(state.els.customMinutes.value, 15),
      comprehensionFloor: safeNumber(state.els.customComp.value, 80),
      retentionFloor: safeNumber(state.els.customRetention.value, 74),
      rampOn: true,
      wordsPerStep: safeNumber(state.els.customWords.value, 1),
      fontSize: safeNumber(state.els.customFont.value, 22)
    };
    saveState();
    rerender();
    setStatus("Custom plan saved.", "success");
  }

  function useCustomPlan() {
    saveCustomPlan();
    state.data.selectedPlanId = "custom";
    saveState();
    rerender();
    setStatus("Custom plan is now the active track.", "success");
  }

  function recordSession(result) {
    const recommendation = state.recommendation || computeRecommendation();
    const entry = {
      timestamp: new Date().toISOString(),
      planId: recommendation.planId,
      modeId: recommendation.modeId,
      actualWpm: safeNumber(result.actualWpm, recommendation.targetWpm),
      comprehension: safeNumber(result.comprehension, recommendation.comprehensionTarget),
      retention: safeNumber(result.retention, recommendation.retentionTarget),
      durationMinutes: safeNumber(result.durationMinutes, recommendation.durationMinutes)
    };

    state.data.history.push(entry);
    if (state.data.history.length > 60) {
      state.data.history = state.data.history.slice(-60);
    }
    saveState();
    rerender();
    setStatus("Session result saved. Recommendation updated.", "success");
    return entry;
  }

  function saveResultFromForm() {
    const actualWpm = safeNumber(state.els.resultWpm.value, 0);
    const comprehension = safeNumber(state.els.resultComp.value, 0);
    const retention = safeNumber(state.els.resultRetention.value, 0);
    const durationMinutes = safeNumber(state.els.resultMinutes.value, 0);

    if (!actualWpm || !comprehension || !retention || !durationMinutes) {
      setStatus("Enter WPM, comprehension, retention, and minutes before saving a result.", "error");
      return;
    }

    recordSession({ actualWpm, comprehension, retention, durationMinutes });
  }

  function launchRecommendedSession() {
    const recommendation = state.recommendation || computeRecommendation();
    if (typeof state.options.launchSession !== "function") {
      setStatus("No launchSession callback is connected yet. Merge this later with your reader launcher.", "error");
      return recommendation;
    }

    state.options.launchSession(recommendation);
    setStatus("Recommended session sent to the reader callback.", "success");
    return recommendation;
  }

  function resetHistory() {
    state.data.history = [];
    saveState();
    rerender();
    setStatus("Training history cleared.", "success");
  }

  function bindEvents() {
    state.els.saveCustomBtn.addEventListener("click", saveCustomPlan);
    state.els.useCustomBtn.addEventListener("click", useCustomPlan);
    state.els.saveResultBtn.addEventListener("click", saveResultFromForm);
    state.els.resetHistoryBtn.addEventListener("click", resetHistory);
    state.els.launchBtn.addEventListener("click", launchRecommendedSession);
  }

  function mount(options = {}) {
    const mergedOptions = { ...DEFAULTS, ...options };
    const target = resolveMountTarget(mergedOptions.mount);
    if (!target) {
      throw new Error("Training plan mount target was not found.");
    }

    state.options = mergedOptions;
    state.data = loadPersistedState();
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
    rerender();

    return api;
  }

  function getState() {
    return {
      data: cloneData(state.data),
      recommendation: state.recommendation ? cloneData(state.recommendation) : null
    };
  }

  function choosePlan(planId) {
    state.data.selectedPlanId = planId;
    saveState();
    rerender();
  }

  function chooseMode(modeId) {
    state.data.selectedModeId = modeId;
    saveState();
    rerender();
  }

  const api = {
    mount,
    getState,
    choosePlan,
    chooseMode,
    recordSession,
    launchRecommendedSession,
    resetHistory
  };

  window.ManovexFeature06AdaptiveTrainingPlans = api;
})();
