(() => {
  "use strict";

  const STYLE_ID = "mv-sgs-feature-styles";
  const ROOT_ID = "mv-sgs-root";

  const DEFAULTS = {
    mount: null,
    storageKey: "mv_feature_10_streak_gamification",
    sectionTitle: "Streaks & Reading Milestones",
    sectionSubtitle:
      "Bring the habit loop back with streaks, achievements, personal bests, and small celebrations that reinforce real progress instead of empty reward noise.",
    onChange: null,
    onCelebrate: null
  };

  const BADGE_LIBRARY = [
    {
      id: "first_session",
      name: "First Session",
      badge: "Start",
      description: "Finish the first recorded reading session.",
      check: (stats) => stats.totalSessions >= 1
    },
    {
      id: "three_day_streak",
      name: "3-Day Streak",
      badge: "Habit",
      description: "Read on three consecutive days.",
      check: (stats) => stats.currentStreak >= 3
    },
    {
      id: "seven_day_streak",
      name: "7-Day Streak",
      badge: "Consistency",
      description: "Keep the streak alive for one full week.",
      check: (stats) => stats.currentStreak >= 7
    },
    {
      id: "ten_sessions",
      name: "10 Sessions",
      badge: "Volume",
      description: "Complete ten total sessions.",
      check: (stats) => stats.totalSessions >= 10
    },
    {
      id: "ten_thousand_words",
      name: "10,000 Words",
      badge: "Distance",
      description: "Read ten thousand words through the app.",
      check: (stats) => stats.totalWordsRead >= 10000
    },
    {
      id: "speed_500",
      name: "500 WPM",
      badge: "Speed",
      description: "Reach a personal best of 500 WPM.",
      check: (stats) => stats.personalBests.wpm >= 500
    },
    {
      id: "comprehension_90",
      name: "90% Comprehension",
      badge: "Quality",
      description: "Score 90% or higher on comprehension.",
      check: (stats) => stats.personalBests.comprehension >= 90
    },
    {
      id: "retention_85",
      name: "Deep Retention",
      badge: "Recall",
      description: "Hit 85% retention in any recorded session.",
      check: (stats) => stats.personalBests.retention >= 85
    },
    {
      id: "fifty_minutes",
      name: "50 Focused Minutes",
      badge: "Depth",
      description: "Accumulate at least 50 total reading minutes.",
      check: (stats) => stats.totalMinutes >= 50
    },
    {
      id: "perfect_combo",
      name: "Perfect Combo",
      badge: "Peak",
      description: "Finish a session with at least 450 WPM and 85% comprehension.",
      check: (stats) => stats.recentBestCombo === true
    }
  ];

  const LEVELS = [
    { level: 1, minXp: 0, label: "Getting Started" },
    { level: 2, minXp: 120, label: "Building Rhythm" },
    { level: 3, minXp: 280, label: "Momentum Reader" },
    { level: 4, minXp: 520, label: "Focused Accelerator" },
    { level: 5, minXp: 860, label: "Reading Machine" }
  ];

  const state = {
    options: { ...DEFAULTS },
    mounted: false,
    root: null,
    sessions: [],
    badgesUnlocked: {},
    celebrations: [],
    stats: null,
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
      .mv-sgs-section {
        padding: 56px 0;
      }

      .mv-sgs-shell {
        display: grid;
        gap: 22px;
      }

      .mv-sgs-hero,
      .mv-sgs-panel,
      .mv-sgs-badge,
      .mv-sgs-log-card,
      .mv-sgs-celebration {
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 18px;
        background: color-mix(in srgb, var(--card, #1f1a12) 96%, transparent);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
      }

      .mv-sgs-hero,
      .mv-sgs-panel {
        padding: 28px;
      }

      .mv-sgs-kicker {
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

      .mv-sgs-title {
        margin: 0 0 10px;
        color: var(--text, #f5eadb);
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.05;
      }

      .mv-sgs-copy,
      .mv-sgs-meta,
      .mv-sgs-status,
      .mv-sgs-note {
        color: var(--muted, #a89b85);
        font-size: 14px;
        line-height: 1.6;
      }

      .mv-sgs-copy {
        margin: 0 0 20px;
      }

      .mv-sgs-topline {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
        gap: 18px;
        align-items: start;
      }

      .mv-sgs-metric-grid,
      .mv-sgs-insight-grid,
      .mv-sgs-chip-grid,
      .mv-sgs-badge-grid,
      .mv-sgs-log-grid {
        display: grid;
        gap: 12px;
      }

      .mv-sgs-metric-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-top: 18px;
      }

      .mv-sgs-metric,
      .mv-sgs-chip,
      .mv-sgs-log-card {
        padding: 16px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
      }

      .mv-sgs-metric span,
      .mv-sgs-chip span,
      .mv-sgs-badge-badge {
        display: block;
        margin-bottom: 6px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-sgs-metric strong,
      .mv-sgs-chip strong {
        color: var(--text, #f5eadb);
        font-size: 20px;
      }

      .mv-sgs-level {
        display: grid;
        gap: 10px;
        padding: 18px;
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(245,176,65,0.14), rgba(245,176,65,0.04));
      }

      .mv-sgs-level h4,
      .mv-sgs-panel h4 {
        margin: 0;
        color: var(--text, #f5eadb);
        font-size: 24px;
      }

      .mv-sgs-level-bar,
      .mv-sgs-bar {
        height: 10px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.08);
      }

      .mv-sgs-level-fill,
      .mv-sgs-bar > div {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent, #f5b041), #ffd37f);
      }

      .mv-sgs-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }

      .mv-sgs-btn {
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

      .mv-sgs-btn:hover {
        transform: translateY(-1px);
      }

      .mv-sgs-btn-primary {
        background: var(--accent, #f5b041);
        color: var(--accent-contrast, #120f0a);
        box-shadow: 0 8px 24px rgba(245, 176, 65, 0.22);
      }

      .mv-sgs-btn-secondary {
        border-color: var(--border, rgba(245,176,65,0.15));
        background: transparent;
        color: var(--text, #f5eadb);
      }

      .mv-sgs-status {
        min-height: 20px;
        margin-top: 12px;
      }

      .mv-sgs-insight-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .mv-sgs-chip-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .mv-sgs-badge-grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      .mv-sgs-badge {
        display: grid;
        gap: 8px;
        min-height: 152px;
        padding: 18px;
      }

      .mv-sgs-badge.is-locked {
        opacity: 0.56;
        filter: saturate(0.6);
      }

      .mv-sgs-badge-name {
        color: var(--text, #f5eadb);
        font-size: 17px;
        font-weight: 700;
      }

      .mv-sgs-badge-meta {
        color: var(--muted, #a89b85);
        font-size: 13px;
        line-height: 1.5;
      }

      .mv-sgs-log-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .mv-sgs-log-card h5,
      .mv-sgs-celebration h5 {
        margin: 0 0 8px;
        color: var(--text, #f5eadb);
        font-size: 18px;
      }

      .mv-sgs-celebration-list {
        display: grid;
        gap: 12px;
      }

      .mv-sgs-celebration {
        padding: 16px;
        border-left: 4px solid var(--accent, #f5b041);
      }

      .mv-sgs-empty {
        padding: 18px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
      }

      @media (max-width: 920px) {
        .mv-sgs-topline,
        .mv-sgs-metric-grid,
        .mv-sgs-insight-grid,
        .mv-sgs-chip-grid,
        .mv-sgs-badge-grid,
        .mv-sgs-log-grid {
          grid-template-columns: 1fr;
        }

        .mv-sgs-section {
          padding: 44px 0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function resolveMountTarget(target) {
    if (!target) return null;
    if (target instanceof Element) return target;
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  function formatDayKey(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDayKey(dayKey) {
    const [year, month, day] = dayKey.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function diffDays(dayA, dayB) {
    const first = parseDayKey(dayA).getTime();
    const second = parseDayKey(dayB).getTime();
    return Math.round((second - first) / 86400000);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(navigator.language || undefined).format(Math.round(value || 0));
  }

  function formatDate(dateValue) {
    try {
      return new Intl.DateTimeFormat(navigator.language || undefined, {
        month: "short",
        day: "numeric"
      }).format(new Date(dateValue));
    } catch (_error) {
      return String(dateValue);
    }
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(state.options.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function saveState() {
    localStorage.setItem(
      state.options.storageKey,
      JSON.stringify({
        sessions: state.sessions,
        badgesUnlocked: state.badgesUnlocked,
        celebrations: state.celebrations
      })
    );
  }

  function computeXp(session) {
    const minutes = Number(session.minutes || 0);
    const words = Number(session.wordsRead || 0);
    const wpm = Number(session.wpm || 0);
    const comprehension = Number(session.comprehension || 0);
    const retention = Number(session.retention || 0);

    let xp = 18;
    xp += Math.min(40, Math.round(minutes * 2));
    xp += Math.min(32, Math.round(words / 400));
    xp += comprehension >= 80 ? 14 : comprehension >= 65 ? 8 : 0;
    xp += retention >= 80 ? 10 : retention >= 65 ? 5 : 0;
    xp += wpm >= 500 ? 16 : wpm >= 380 ? 8 : 0;

    return xp;
  }

  function normalizeSession(session = {}) {
    const occurredAt = session.occurredAt || new Date().toISOString();
    const dayKey = formatDayKey(occurredAt);
    const minutes = Math.max(0, Number(session.minutes || session.durationMinutes || 0));
    const wordsRead = Math.max(0, Number(session.wordsRead || 0));
    const wpm = Math.max(0, Number(session.wpm || session.actualWpm || 0));
    const comprehension = Math.max(0, Math.min(100, Number(session.comprehension || 0)));
    const retention = Math.max(0, Math.min(100, Number(session.retention || 0)));

    return {
      id: session.id || `session_${Math.random().toString(36).slice(2, 10)}`,
      occurredAt,
      dayKey,
      minutes,
      wordsRead,
      wpm,
      comprehension,
      retention,
      mode: String(session.mode || "steady"),
      sourceType: String(session.sourceType || "reader"),
      xp: Math.max(10, Number(session.xp || computeXp({ minutes, wordsRead, wpm, comprehension, retention })))
    };
  }

  function getCurrentAndLongestStreak(dayKeys) {
    if (!dayKeys.length) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const sorted = Array.from(new Set(dayKeys)).sort();
    let longest = 1;
    let currentRun = 1;

    for (let index = 1; index < sorted.length; index += 1) {
      const gap = diffDays(sorted[index - 1], sorted[index]);
      if (gap === 1) {
        currentRun += 1;
        longest = Math.max(longest, currentRun);
      } else {
        currentRun = 1;
      }
    }

    let tailRun = 1;
    for (let index = sorted.length - 1; index > 0; index -= 1) {
      const gap = diffDays(sorted[index - 1], sorted[index]);
      if (gap === 1) {
        tailRun += 1;
      } else {
        break;
      }
    }

    const todayKey = formatDayKey();
    const yesterdayKey = formatDayKey(new Date(Date.now() - 86400000));
    const lastDay = sorted[sorted.length - 1];
    const currentStreak = lastDay === todayKey || lastDay === yesterdayKey ? tailRun : 0;

    return { currentStreak, longestStreak: longest };
  }

  function getLevelFromXp(xp) {
    const sorted = LEVELS.slice().sort((a, b) => a.minXp - b.minXp);
    let current = sorted[0];
    let next = null;

    for (let index = 0; index < sorted.length; index += 1) {
      if (xp >= sorted[index].minXp) {
        current = sorted[index];
        next = sorted[index + 1] || null;
      }
    }

    const progress = next
      ? Math.max(0, Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp)))
      : 1;

    return {
      level: current.level,
      label: current.label,
      xp,
      nextLevel: next ? next.level : null,
      nextLabel: next ? next.label : null,
      progress,
      xpToNext: next ? Math.max(0, next.minXp - xp) : 0
    };
  }

  function buildStats() {
    const sessions = state.sessions.slice().sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, item) => sum + item.minutes, 0);
    const totalWordsRead = sessions.reduce((sum, item) => sum + item.wordsRead, 0);
    const totalXp = sessions.reduce((sum, item) => sum + item.xp, 0);
    const dayKeys = sessions.map((item) => item.dayKey);
    const { currentStreak, longestStreak } = getCurrentAndLongestStreak(dayKeys);
    const personalBests = {
      wpm: sessions.reduce((max, item) => Math.max(max, item.wpm), 0),
      comprehension: sessions.reduce((max, item) => Math.max(max, item.comprehension), 0),
      retention: sessions.reduce((max, item) => Math.max(max, item.retention), 0),
      wordsRead: sessions.reduce((max, item) => Math.max(max, item.wordsRead), 0),
      minutes: sessions.reduce((max, item) => Math.max(max, item.minutes), 0)
    };

    const recentSession = sessions[sessions.length - 1] || null;
    const recentBestCombo = Boolean(
      recentSession &&
      recentSession.wpm >= 450 &&
      recentSession.comprehension >= 85
    );

    const level = getLevelFromXp(totalXp);

    return {
      totalSessions,
      totalMinutes,
      totalWordsRead,
      totalXp,
      currentStreak,
      longestStreak,
      personalBests,
      recentSession,
      recentBestCombo,
      level
    };
  }

  function createCelebration(type, title, copy, meta = {}) {
    return {
      id: `cele_${Math.random().toString(36).slice(2, 10)}`,
      type,
      title,
      copy,
      meta,
      createdAt: new Date().toISOString()
    };
  }

  function appendCelebration(item) {
    state.celebrations.unshift(item);
    state.celebrations = state.celebrations.slice(0, 12);

    if (typeof state.options.onCelebrate === "function") {
      state.options.onCelebrate(JSON.parse(JSON.stringify(item)));
    }
  }

  function unlockBadges() {
    const newlyUnlocked = [];

    BADGE_LIBRARY.forEach((badge) => {
      if (state.badgesUnlocked[badge.id]) return;
      if (badge.check(state.stats)) {
        state.badgesUnlocked[badge.id] = new Date().toISOString();
        newlyUnlocked.push(badge);
      }
    });

    newlyUnlocked.forEach((badge) => {
      appendCelebration(
        createCelebration(
          "badge_unlock",
          `Badge unlocked: ${badge.name}`,
          badge.description,
          { badgeId: badge.id }
        )
      );
    });
  }

  function maybeCelebrateMilestones(previousStats, nextStats) {
    if (!previousStats) {
      appendCelebration(
        createCelebration(
          "session_recorded",
          "First reading session recorded",
          "The habit loop has started. Keep the chain alive tomorrow."
        )
      );
      return;
    }

    if (nextStats.currentStreak > previousStats.currentStreak && [3, 7, 14, 30].includes(nextStats.currentStreak)) {
      appendCelebration(
        createCelebration(
          "streak",
          `${nextStats.currentStreak}-day streak`,
          "Consistency matters more than occasional intensity. Protect the chain.",
          { streak: nextStats.currentStreak }
        )
      );
    }

    if (nextStats.personalBests.wpm > previousStats.personalBests.wpm) {
      appendCelebration(
        createCelebration(
          "personal_best",
          "New speed record",
          `${formatNumber(nextStats.personalBests.wpm)} WPM is the new personal best.`,
          { metric: "wpm", value: nextStats.personalBests.wpm }
        )
      );
    }

    if (nextStats.personalBests.comprehension > previousStats.personalBests.comprehension) {
      appendCelebration(
        createCelebration(
          "personal_best",
          "New comprehension best",
          `${formatNumber(nextStats.personalBests.comprehension)}% comprehension is the strongest score so far.`,
          { metric: "comprehension", value: nextStats.personalBests.comprehension }
        )
      );
    }

    if (nextStats.level.level > previousStats.level.level) {
      appendCelebration(
        createCelebration(
          "level_up",
          `Level ${nextStats.level.level} reached`,
          `You are now in ${nextStats.level.label}.`,
          { level: nextStats.level.level }
        )
      );
    }
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

  function createMarkup() {
    return `
      <section class="mv-sgs-section" id="${ROOT_ID}">
        <div class="mv-sgs-shell">
          <div class="mv-sgs-hero">
            <div class="mv-sgs-kicker">Progress</div>
            <div class="mv-sgs-topline">
              <div>
                <h3 class="mv-sgs-title">${escapeHtml(state.options.sectionTitle)}</h3>
                <p class="mv-sgs-copy">${escapeHtml(state.options.sectionSubtitle)}</p>
              </div>
              <div class="mv-sgs-level">
                <div class="mv-sgs-kicker" id="mvSgsLevelBadge">Level 1</div>
                <h4 id="mvSgsLevelTitle">Getting Started</h4>
                <div class="mv-sgs-meta" id="mvSgsLevelMeta">0 XP earned</div>
                <div class="mv-sgs-level-bar">
                  <div class="mv-sgs-level-fill" id="mvSgsLevelFill" style="width:0%"></div>
                </div>
                <div class="mv-sgs-meta" id="mvSgsLevelNext">Earn progress through real sessions.</div>
              </div>
            </div>

            <div class="mv-sgs-metric-grid" id="mvSgsMetricGrid"></div>

            <div class="mv-sgs-actions">
              <button class="mv-sgs-btn mv-sgs-btn-primary" id="mvSgsDemoBtn" type="button">Record sample session</button>
              <button class="mv-sgs-btn mv-sgs-btn-secondary" id="mvSgsPerfectBtn" type="button">Simulate strong session</button>
              <button class="mv-sgs-btn mv-sgs-btn-secondary" id="mvSgsResetBtn" type="button">Reset progress</button>
            </div>

            <div class="mv-sgs-status" id="mvSgsStatus" aria-live="polite"></div>
          </div>

          <div class="mv-sgs-panel">
            <div class="mv-sgs-kicker">Insights</div>
            <h4>Personal bests and milestones</h4>
            <div class="mv-sgs-chip-grid" id="mvSgsChipGrid"></div>
          </div>

          <div class="mv-sgs-panel">
            <div class="mv-sgs-kicker">Achievements</div>
            <h4>Unlocked badges</h4>
            <div class="mv-sgs-badge-grid" id="mvSgsBadgeGrid"></div>
          </div>

          <div class="mv-sgs-log-grid">
            <div class="mv-sgs-panel">
              <div class="mv-sgs-kicker">Celebrations</div>
              <h4>Recent wins</h4>
              <div class="mv-sgs-celebration-list" id="mvSgsCelebrationList"></div>
            </div>

            <div class="mv-sgs-panel">
              <div class="mv-sgs-kicker">Session Log</div>
              <h4>Recent reading sessions</h4>
              <div class="mv-sgs-log-grid" id="mvSgsLogGrid"></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function captureElements(root) {
    state.els = {
      levelBadge: root.querySelector("#mvSgsLevelBadge"),
      levelTitle: root.querySelector("#mvSgsLevelTitle"),
      levelMeta: root.querySelector("#mvSgsLevelMeta"),
      levelFill: root.querySelector("#mvSgsLevelFill"),
      levelNext: root.querySelector("#mvSgsLevelNext"),
      metricGrid: root.querySelector("#mvSgsMetricGrid"),
      chipGrid: root.querySelector("#mvSgsChipGrid"),
      badgeGrid: root.querySelector("#mvSgsBadgeGrid"),
      celebrationList: root.querySelector("#mvSgsCelebrationList"),
      logGrid: root.querySelector("#mvSgsLogGrid"),
      demoBtn: root.querySelector("#mvSgsDemoBtn"),
      perfectBtn: root.querySelector("#mvSgsPerfectBtn"),
      resetBtn: root.querySelector("#mvSgsResetBtn"),
      status: root.querySelector("#mvSgsStatus")
    };
  }

  function renderMetrics() {
    const stats = state.stats;
    state.els.metricGrid.innerHTML = [
      { label: "Current streak", value: `${stats.currentStreak} days` },
      { label: "Longest streak", value: `${stats.longestStreak} days` },
      { label: "Total sessions", value: formatNumber(stats.totalSessions) },
      { label: "XP earned", value: formatNumber(stats.totalXp) }
    ].map((item) => `
      <div class="mv-sgs-metric">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </div>
    `).join("");
  }

  function renderLevel() {
    const level = state.stats.level;
    state.els.levelBadge.textContent = `Level ${level.level}`;
    state.els.levelTitle.textContent = level.label;
    state.els.levelMeta.textContent = `${formatNumber(level.xp)} XP earned`;
    state.els.levelFill.style.width = `${Math.round(level.progress * 100)}%`;
    state.els.levelNext.textContent = level.nextLevel
      ? `${formatNumber(level.xpToNext)} XP to Level ${level.nextLevel} - ${level.nextLabel}`
      : "Top level reached. Keep stacking strong sessions.";
  }

  function renderInsights() {
    const stats = state.stats;
    const recent = stats.recentSession;

    state.els.chipGrid.innerHTML = [
      { label: "Speed best", value: `${formatNumber(stats.personalBests.wpm)} WPM` },
      { label: "Comprehension best", value: `${formatNumber(stats.personalBests.comprehension)}%` },
      { label: "Retention best", value: `${formatNumber(stats.personalBests.retention)}%` },
      { label: "Words read", value: formatNumber(stats.totalWordsRead) },
      { label: "Minutes read", value: formatNumber(stats.totalMinutes) },
      { label: "Largest session", value: `${formatNumber(stats.personalBests.wordsRead)} words` },
      { label: "Latest mode", value: recent ? recent.mode : "-" },
      { label: "Last active", value: recent ? formatDate(recent.occurredAt) : "-" }
    ].map((item) => `
      <div class="mv-sgs-chip">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </div>
    `).join("");
  }

  function renderBadges() {
    state.els.badgeGrid.innerHTML = BADGE_LIBRARY.map((badge) => {
      const unlockedAt = state.badgesUnlocked[badge.id];
      return `
        <div class="mv-sgs-badge ${unlockedAt ? "" : "is-locked"}">
          <div class="mv-sgs-badge-badge">${escapeHtml(badge.badge)}</div>
          <div class="mv-sgs-badge-name">${escapeHtml(badge.name)}</div>
          <div class="mv-sgs-badge-meta">${escapeHtml(badge.description)}</div>
          <div class="mv-sgs-badge-meta">${escapeHtml(unlockedAt ? `Unlocked ${formatDate(unlockedAt)}` : "Locked")}</div>
        </div>
      `;
    }).join("");
  }

  function renderCelebrations() {
    if (!state.celebrations.length) {
      state.els.celebrationList.innerHTML = `
        <div class="mv-sgs-empty">
          <div class="mv-sgs-note">No celebrations yet. Record a real reading session and the system will start tracking wins automatically.</div>
        </div>
      `;
      return;
    }

    state.els.celebrationList.innerHTML = state.celebrations.map((item) => `
      <div class="mv-sgs-celebration">
        <h5>${escapeHtml(item.title)}</h5>
        <div class="mv-sgs-note">${escapeHtml(item.copy)}</div>
        <div class="mv-sgs-meta">${escapeHtml(formatDate(item.createdAt))}</div>
      </div>
    `).join("");
  }

  function renderSessionLog() {
    const sessions = state.sessions.slice().sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).slice(0, 6);
    if (!sessions.length) {
      state.els.logGrid.innerHTML = `
        <div class="mv-sgs-empty">
          <div class="mv-sgs-note">No sessions recorded yet. Finish a reading session to start building your history.</div>
        </div>
      `;
      return;
    }

    state.els.logGrid.innerHTML = sessions.map((item) => `
      <div class="mv-sgs-log-card">
        <h5>${escapeHtml(formatDate(item.occurredAt))}</h5>
        <div class="mv-sgs-meta">${escapeHtml(item.mode)} mode · ${escapeHtml(item.sourceType)}</div>
        <div class="mv-sgs-note">${escapeHtml(`${formatNumber(item.wpm)} WPM · ${formatNumber(item.comprehension)}% comprehension · ${formatNumber(item.minutes)} min`)}</div>
      </div>
    `).join("");
  }

  function renderAll() {
    renderLevel();
    renderMetrics();
    renderInsights();
    renderBadges();
    renderCelebrations();
    renderSessionLog();
  }

  function emitChange() {
    if (typeof state.options.onChange === "function") {
      state.options.onChange(getState());
    }
  }

  function recomputeAndRender() {
    state.stats = buildStats();
    renderAll();
    saveState();
    emitChange();
  }

  function recordReadingSession(session) {
    const previousStats = state.stats;
    const normalized = normalizeSession(session);
    state.sessions.push(normalized);
    state.stats = buildStats();
    maybeCelebrateMilestones(previousStats, state.stats);
    unlockBadges();
    renderAll();
    saveState();
    emitChange();
    setStatus(`Session recorded: ${formatNumber(normalized.wpm)} WPM, ${formatNumber(normalized.comprehension)}% comprehension.`, "success");
    return getState();
  }

  function recordEvent(event) {
    if (!event || !event.title) return getState();
    appendCelebration(
      createCelebration(
        String(event.type || "custom_event"),
        String(event.title),
        String(event.copy || ""),
        event.meta || {}
      )
    );
    renderCelebrations();
    saveState();
    emitChange();
    return getState();
  }

  function resetProgress() {
    state.sessions = [];
    state.badgesUnlocked = {};
    state.celebrations = [];
    recomputeAndRender();
    setStatus("Gamification progress reset.");
    return getState();
  }

  function getState() {
    return {
      sessions: JSON.parse(JSON.stringify(state.sessions)),
      badgesUnlocked: JSON.parse(JSON.stringify(state.badgesUnlocked)),
      celebrations: JSON.parse(JSON.stringify(state.celebrations)),
      stats: JSON.parse(JSON.stringify(state.stats))
    };
  }

  function buildSampleSession(kind = "regular") {
    const daysBack = state.sessions.length;
    const occurredAt = new Date(Date.now() - daysBack * 86400000).toISOString();

    if (kind === "strong") {
      return {
        occurredAt,
        minutes: 18,
        wordsRead: 4800,
        wpm: 520,
        comprehension: 91,
        retention: 86,
        mode: "intensity",
        sourceType: "training"
      };
    }

    return {
      occurredAt,
      minutes: 12,
      wordsRead: 2300,
      wpm: 320,
      comprehension: 78,
      retention: 70,
      mode: "steady",
      sourceType: "reader"
    };
  }

  function bindEvents() {
    state.els.demoBtn.addEventListener("click", () => {
      recordReadingSession(buildSampleSession("regular"));
    });

    state.els.perfectBtn.addEventListener("click", () => {
      recordReadingSession(buildSampleSession("strong"));
    });

    state.els.resetBtn.addEventListener("click", () => {
      resetProgress();
    });
  }

  function mount(options = {}) {
    state.options = { ...DEFAULTS, ...options };
    ensureStyles();

    const mountTarget = resolveMountTarget(state.options.mount);
    if (!mountTarget) {
      throw new Error("Progress tracker mount target was not found.");
    }

    const saved = loadSavedState();
    state.sessions = Array.isArray(saved?.sessions) ? saved.sessions.map((item) => normalizeSession(item)) : [];
    state.badgesUnlocked = saved?.badgesUnlocked && typeof saved.badgesUnlocked === "object" ? saved.badgesUnlocked : {};
    state.celebrations = Array.isArray(saved?.celebrations) ? saved.celebrations : [];

    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = createMarkup();
    const root = wrapper.firstElementChild;
    mountTarget.appendChild(root);

    state.root = root;
    state.mounted = true;
    captureElements(root);
    state.stats = buildStats();
    bindEvents();
    unlockBadges();
    renderAll();
    setStatus(
      state.sessions.length
        ? `Loaded ${formatNumber(state.sessions.length)} recorded session(s).`
        : "Ready. Finish a reading session to start tracking progress.",
      state.sessions.length ? "success" : "info"
    );

    return api;
  }

  const api = {
    mount,
    recordReadingSession,
    recordEvent,
    resetProgress,
    getState
  };

  window.ManovexFeature10StreakGamification = api;
})();
