(() => {
  "use strict";

  const STYLE_ID = "mv-rbtq-feature-styles";
  const ROOT_ID = "mv-rbtq-root";

  const DEFAULTS = {
    mount: null,
    storageKey: "mv_feature_09_reading_brain_type",
    sectionTitle: "Reading Brain Type Quiz",
    sectionSubtitle:
      "Classify each reader before they start. This gives Manovex an onboarding hook and a concrete preset for speed, focus, comprehension, and accessibility choices.",
    onChange: null,
    onComplete: null
  };

  const PROFILE_LIBRARY = {
    precision_builder: {
      id: "precision_builder",
      name: "Precision Builder",
      badge: "Comprehension First",
      summary:
        "This reader improves fastest when speed increases are controlled, comprehension stays high, and the interface stays calm and predictable.",
      strengths: [
        "Builds stable reading habits with low cognitive friction.",
        "Retains detail well when the pace increases gradually.",
        "Responds well to guided plans and measurable progress."
      ],
      watchouts: [
        "Can stall if the reader is pushed into aggressive speed jumps too early.",
        "Benefits from one-word focus and stronger comprehension checks."
      ],
      readerPreset: {
        startWpm: 250,
        targetWpm: 360,
        wordsPerStep: 1,
        rampOn: true,
        fontProfile: "dyslexia",
        themeBias: "warm",
        gradualSpeed: true,
        trainingPlanId: "beginner",
        trainingModeId: "steady",
        comprehensionQuizAfterReading: true
      }
    },
    pattern_sprinter: {
      id: "pattern_sprinter",
      name: "Pattern Sprinter",
      badge: "Speed Hungry",
      summary:
        "This reader naturally chases momentum. They tolerate higher speed, adapt quickly to chunked text, and stay engaged when the app feels dynamic.",
      strengths: [
        "Adapts to fast pacing and short high-intensity sessions.",
        "Can absorb familiar material quickly without losing structure.",
        "Responds well to measurable stretch targets and personal bests."
      ],
      watchouts: [
        "Can outrun comprehension if the app never forces review.",
        "Needs periodic retention checks to prevent shallow scanning."
      ],
      readerPreset: {
        startWpm: 420,
        targetWpm: 650,
        wordsPerStep: 2,
        rampOn: false,
        fontProfile: "hyperlegible",
        themeBias: "dark",
        gradualSpeed: false,
        trainingPlanId: "advanced",
        trainingModeId: "intensity",
        comprehensionQuizAfterReading: true
      }
    },
    visual_mapper: {
      id: "visual_mapper",
      name: "Visual Mapper",
      badge: "Structure Driven",
      summary:
        "This reader understands best when information is chunked clearly. They benefit from larger visual anchors, grouping, and stronger spacing cues.",
      strengths: [
        "Tracks hierarchy, structure, and transitions very well.",
        "Benefits from two- or three-word grouping for context.",
        "Improves when typography and layout are clean and spacious."
      ],
      watchouts: [
        "Crowded layouts create fatigue quickly.",
        "Needs clean themes and spacing-sensitive display settings."
      ],
      readerPreset: {
        startWpm: 320,
        targetWpm: 500,
        wordsPerStep: 2,
        rampOn: true,
        fontProfile: "focus",
        themeBias: "light",
        gradualSpeed: true,
        trainingPlanId: "intermediate",
        trainingModeId: "steady",
        comprehensionQuizAfterReading: false
      }
    },
    reflective_deep_reader: {
      id: "reflective_deep_reader",
      name: "Reflective Deep Reader",
      badge: "Retention Focused",
      summary:
        "This reader values understanding, recall, and internal synthesis over raw speed. They convert best when the app proves that faster reading can still preserve meaning.",
      strengths: [
        "Retains meaning well when reflection is built into the flow.",
        "Responds strongly to review loops and post-reading checks.",
        "Good candidate for long-term habit formation and premium usage."
      ],
      watchouts: [
        "Can reject speed tools if the app feels too mechanical.",
        "Needs recall reinforcement, not just faster playback."
      ],
      readerPreset: {
        startWpm: 240,
        targetWpm: 340,
        wordsPerStep: 1,
        rampOn: true,
        fontProfile: "dyslexia",
        themeBias: "sepia",
        gradualSpeed: true,
        trainingPlanId: "beginner",
        trainingModeId: "retention",
        comprehensionQuizAfterReading: true
      }
    },
    adaptive_explorer: {
      id: "adaptive_explorer",
      name: "Adaptive Explorer",
      badge: "Balanced",
      summary:
        "This reader can move between speed, comprehension, and experimentation. They do best when the app gives flexibility without overwhelming them.",
      strengths: [
        "Can handle multiple modes and feature sets without confusion.",
        "Responds well to custom plans and gradual optimization.",
        "Strong fit for premium feature discovery."
      ],
      watchouts: [
        "Can lose momentum if the product does not recommend a clear next step.",
        "Needs a suggested preset rather than too many defaults."
      ],
      readerPreset: {
        startWpm: 300,
        targetWpm: 460,
        wordsPerStep: 2,
        rampOn: true,
        fontProfile: "hyperlegible",
        themeBias: "neutral",
        gradualSpeed: true,
        trainingPlanId: "intermediate",
        trainingModeId: "steady",
        comprehensionQuizAfterReading: true
      }
    }
  };

  const QUESTIONS = [
    {
      id: "session_goal",
      prompt: "What should a strong reading session feel like?",
      helper: "Pick the answer that feels most natural, not the one that sounds ideal.",
      options: [
        {
          id: "steady_confident",
          label: "Calm, controlled, and easy to follow",
          copy: "I want speed to rise only if understanding stays solid.",
          scores: { precision_builder: 3, reflective_deep_reader: 2, adaptive_explorer: 1 }
        },
        {
          id: "fast_momentum",
          label: "Fast and energising",
          copy: "I stay motivated when the pace feels ambitious.",
          scores: { pattern_sprinter: 3, adaptive_explorer: 1 }
        },
        {
          id: "clear_structure",
          label: "Visually clear and well spaced",
          copy: "I need the display to guide my eyes properly.",
          scores: { visual_mapper: 3, precision_builder: 1 }
        },
        {
          id: "deep_understanding",
          label: "Meaningful enough to remember later",
          copy: "If I cannot recall it, the speed does not matter.",
          scores: { reflective_deep_reader: 3, precision_builder: 1 }
        }
      ]
    },
    {
      id: "when_lost",
      prompt: "If meaning starts slipping during fast reading, what happens first?",
      helper: "",
      options: [
        {
          id: "slow_down",
          label: "I want to slow down and stabilise",
          copy: "Accuracy matters more than forcing pace.",
          scores: { precision_builder: 3, reflective_deep_reader: 2 }
        },
        {
          id: "push_through",
          label: "I can push through and recover from context",
          copy: "Speed does not scare me if the pattern is intact.",
          scores: { pattern_sprinter: 3, adaptive_explorer: 1 }
        },
        {
          id: "need_visual_anchor",
          label: "I need better spacing or chunking",
          copy: "The display is usually the problem before the pace is.",
          scores: { visual_mapper: 3, adaptive_explorer: 1 }
        },
        {
          id: "review_after",
          label: "I want a recap or follow-up check",
          copy: "I can continue if I know recall will be tested later.",
          scores: { reflective_deep_reader: 3, adaptive_explorer: 1 }
        }
      ]
    },
    {
      id: "motivation",
      prompt: "Which reward would keep you using a reading app consistently?",
      helper: "",
      options: [
        {
          id: "mastery",
          label: "Seeing comprehension stay high",
          copy: "I want proof that speed is not hurting quality.",
          scores: { precision_builder: 2, reflective_deep_reader: 3 }
        },
        {
          id: "personal_best",
          label: "Breaking a speed record",
          copy: "I enjoy pushing my own ceiling.",
          scores: { pattern_sprinter: 3, adaptive_explorer: 1 }
        },
        {
          id: "clarity",
          label: "A display that feels easier on my eyes",
          copy: "If the interface feels right, I stay longer.",
          scores: { visual_mapper: 3, precision_builder: 1 }
        },
        {
          id: "guided_path",
          label: "A recommended plan that adapts to me",
          copy: "I want the app to tell me what to do next.",
          scores: { adaptive_explorer: 3, precision_builder: 1, reflective_deep_reader: 1 }
        }
      ]
    },
    {
      id: "dense_text",
      prompt: "How do you usually react to dense or technical text?",
      helper: "",
      options: [
        {
          id: "go_stepwise",
          label: "I prefer smaller steps and steady pacing",
          copy: "I can handle it if the pace grows gradually.",
          scores: { precision_builder: 3, reflective_deep_reader: 1 }
        },
        {
          id: "scan_patterns",
          label: "I scan for patterns and move fast",
          copy: "I understand more than it looks like from the outside.",
          scores: { pattern_sprinter: 3, adaptive_explorer: 1 }
        },
        {
          id: "need_layout_help",
          label: "Layout matters a lot",
          copy: "Good spacing changes everything for me.",
          scores: { visual_mapper: 3 }
        },
        {
          id: "reflect_and_recall",
          label: "I need time to consolidate the ideas",
          copy: "Retention matters more than finishing quickly.",
          scores: { reflective_deep_reader: 3, precision_builder: 1 }
        }
      ]
    },
    {
      id: "visual_preference",
      prompt: "Which reader display sounds closest to your preference?",
      helper: "",
      options: [
        {
          id: "single_focus",
          label: "One focused word at a time",
          copy: "Minimal distraction helps me stay accurate.",
          scores: { precision_builder: 3, reflective_deep_reader: 1 }
        },
        {
          id: "double_chunk",
          label: "Two-word chunks with momentum",
          copy: "I like context but still want speed.",
          scores: { pattern_sprinter: 2, adaptive_explorer: 2, visual_mapper: 1 }
        },
        {
          id: "triple_chunk",
          label: "Grouped words with strong visual spacing",
          copy: "I want chunking and layout support together.",
          scores: { visual_mapper: 3, adaptive_explorer: 1 }
        },
        {
          id: "adaptive_mix",
          label: "Let the app adjust it for me",
          copy: "I am open to switching modes if the app guides me.",
          scores: { adaptive_explorer: 3, pattern_sprinter: 1 }
        }
      ]
    },
    {
      id: "accessibility_signal",
      prompt: "What causes fatigue first during longer sessions?",
      helper: "",
      options: [
        {
          id: "pace_fatigue",
          label: "The speed becomes mentally tiring",
          copy: "I need controlled pacing more than visual changes.",
          scores: { precision_builder: 2, reflective_deep_reader: 2 }
        },
        {
          id: "crowded_letters",
          label: "Letters and spacing start to feel crowded",
          copy: "Typography affects my stamina a lot.",
          scores: { visual_mapper: 3, precision_builder: 1 }
        },
        {
          id: "boredom",
          label: "I get bored before I get tired",
          copy: "The app has to keep me moving.",
          scores: { pattern_sprinter: 3 }
        },
        {
          id: "mixed",
          label: "It depends on the material",
          copy: "I need flexible settings more than a fixed mode.",
          scores: { adaptive_explorer: 3 }
        }
      ]
    },
    {
      id: "after_reading",
      prompt: "What should happen right after a reading session?",
      helper: "",
      options: [
        {
          id: "quick_next",
          label: "Move straight into the next session",
          copy: "Momentum matters most.",
          scores: { pattern_sprinter: 3 }
        },
        {
          id: "score_me",
          label: "Give me a comprehension check",
          copy: "I want confirmation that I understood the material.",
          scores: { reflective_deep_reader: 3, precision_builder: 2 }
        },
        {
          id: "show_key_points",
          label: "Show structure, summary, or vocabulary",
          copy: "That helps me anchor what I read.",
          scores: { visual_mapper: 2, reflective_deep_reader: 1, adaptive_explorer: 1 }
        },
        {
          id: "recommend_next",
          label: "Recommend the next mode or training block",
          copy: "I want smart guidance more than manual decisions.",
          scores: { adaptive_explorer: 3, precision_builder: 1 }
        }
      ]
    },
    {
      id: "premium_fit",
      prompt: "Which premium benefit sounds most valuable to you?",
      helper: "",
      options: [
        {
          id: "upload_books",
          label: "Upload my own books and keep a personal library",
          copy: "I want the app to fit my real reading life.",
          scores: { adaptive_explorer: 2, precision_builder: 1, reflective_deep_reader: 1 }
        },
        {
          id: "train_speed",
          label: "Structured speed training",
          copy: "I want measurable performance growth.",
          scores: { pattern_sprinter: 2, precision_builder: 2 }
        },
        {
          id: "retain_better",
          label: "Retention and vocabulary support",
          copy: "I care about understanding more than raw pace.",
          scores: { reflective_deep_reader: 3, visual_mapper: 1 }
        },
        {
          id: "personal_display",
          label: "A display tuned to how I process text",
          copy: "Good typography and settings matter most to me.",
          scores: { visual_mapper: 3, adaptive_explorer: 1 }
        }
      ]
    }
  ];

  const state = {
    options: { ...DEFAULTS },
    root: null,
    mounted: false,
    currentIndex: 0,
    answers: {},
    result: null,
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
      .mv-rbtq-section {
        padding: 56px 0;
      }

      .mv-rbtq-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
        gap: 22px;
        align-items: start;
      }

      .mv-rbtq-card,
      .mv-rbtq-sidecard,
      .mv-rbtq-result,
      .mv-rbtq-chipbox {
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 18px;
        background: color-mix(in srgb, var(--card, #1f1a12) 96%, transparent);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
      }

      .mv-rbtq-card,
      .mv-rbtq-sidecard {
        padding: 28px;
      }

      .mv-rbtq-kicker {
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

      .mv-rbtq-title {
        margin: 0 0 10px;
        color: var(--text, #f5eadb);
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.05;
      }

      .mv-rbtq-copy,
      .mv-rbtq-meta,
      .mv-rbtq-note,
      .mv-rbtq-sidecopy,
      .mv-rbtq-status {
        color: var(--muted, #a89b85);
        font-size: 14px;
        line-height: 1.6;
      }

      .mv-rbtq-copy {
        margin: 0 0 20px;
      }

      .mv-rbtq-progress {
        margin-bottom: 20px;
      }

      .mv-rbtq-progress-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .mv-rbtq-progress-bar {
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .mv-rbtq-progress-fill {
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent, #f5b041), #ffd37f);
        transition: width 0.25s ease;
      }

      .mv-rbtq-question {
        margin-bottom: 18px;
      }

      .mv-rbtq-question h4,
      .mv-rbtq-sidecard h4,
      .mv-rbtq-result h4 {
        margin: 0 0 8px;
        color: var(--text, #f5eadb);
        font-size: 24px;
      }

      .mv-rbtq-option-list {
        display: grid;
        gap: 12px;
      }

      .mv-rbtq-option {
        display: grid;
        gap: 6px;
        padding: 16px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.03);
        text-align: left;
        cursor: pointer;
        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      }

      .mv-rbtq-option:hover {
        transform: translateY(-1px);
      }

      .mv-rbtq-option.is-selected {
        border-color: var(--accent, #f5b041);
        box-shadow: 0 10px 28px rgba(245, 176, 65, 0.14);
        background: rgba(245, 176, 65, 0.06);
      }

      .mv-rbtq-option-title {
        color: var(--text, #f5eadb);
        font-size: 16px;
        font-weight: 700;
      }

      .mv-rbtq-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .mv-rbtq-btn {
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

      .mv-rbtq-btn:hover {
        transform: translateY(-1px);
      }

      .mv-rbtq-btn-primary {
        background: var(--accent, #f5b041);
        color: var(--accent-contrast, #120f0a);
        box-shadow: 0 8px 24px rgba(245, 176, 65, 0.22);
      }

      .mv-rbtq-btn-secondary {
        border-color: var(--border, rgba(245,176,65,0.15));
        background: transparent;
        color: var(--text, #f5eadb);
      }

      .mv-rbtq-btn[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
      }

      .mv-rbtq-status {
        min-height: 20px;
        margin-top: 12px;
      }

      .mv-rbtq-chipbox {
        padding: 16px;
        margin-top: 14px;
      }

      .mv-rbtq-chip-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }

      .mv-rbtq-chip {
        padding: 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
      }

      .mv-rbtq-chip span {
        display: block;
        margin-bottom: 4px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-rbtq-chip strong {
        color: var(--text, #f5eadb);
        font-size: 15px;
      }

      .mv-rbtq-result {
        padding: 18px;
        margin-top: 18px;
      }

      .mv-rbtq-result-list {
        margin: 12px 0 0;
        padding-left: 18px;
        color: var(--text, #f5eadb);
      }

      .mv-rbtq-result-list li + li {
        margin-top: 8px;
      }

      .mv-rbtq-score-grid {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }

      .mv-rbtq-score-row {
        display: grid;
        gap: 6px;
      }

      .mv-rbtq-score-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .mv-rbtq-score-bar {
        height: 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .mv-rbtq-score-bar > div {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(245,176,65,0.6), rgba(245,176,65,1));
      }

      @media (max-width: 860px) {
        .mv-rbtq-shell,
        .mv-rbtq-chip-grid {
          grid-template-columns: 1fr;
        }

        .mv-rbtq-section {
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
        currentIndex: state.currentIndex,
        answers: state.answers,
        result: state.result
      })
    );
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

  function getSelectedOption(questionId) {
    return state.answers[questionId] || "";
  }

  function getQuestionByIndex(index) {
    return QUESTIONS[index] || null;
  }

  function createMarkup() {
    return `
      <section class="mv-rbtq-section" id="${ROOT_ID}">
        <div class="mv-rbtq-shell">
          <div class="mv-rbtq-card">
            <div class="mv-rbtq-kicker">Brain profile</div>
            <h3 class="mv-rbtq-title">${escapeHtml(state.options.sectionTitle)}</h3>
            <p class="mv-rbtq-copy">${escapeHtml(state.options.sectionSubtitle)}</p>

            <div class="mv-rbtq-progress">
              <div class="mv-rbtq-progress-top">
                <strong id="mvRbtqProgressLabel" class="mv-rbtq-option-title">Question 1 of ${QUESTIONS.length}</strong>
                <span class="mv-rbtq-meta" id="mvRbtqProgressMeta">0% complete</span>
              </div>
              <div class="mv-rbtq-progress-bar">
                <div class="mv-rbtq-progress-fill" id="mvRbtqProgressFill"></div>
              </div>
            </div>

            <div id="mvRbtqQuestionShell"></div>

            <div class="mv-rbtq-actions">
              <button class="mv-rbtq-btn mv-rbtq-btn-secondary" id="mvRbtqPrevBtn" type="button">Previous</button>
              <button class="mv-rbtq-btn mv-rbtq-btn-primary" id="mvRbtqNextBtn" type="button">Next</button>
              <button class="mv-rbtq-btn mv-rbtq-btn-secondary" id="mvRbtqResetBtn" type="button">Restart quiz</button>
            </div>

            <div class="mv-rbtq-status" id="mvRbtqStatus" aria-live="polite"></div>
          </div>

          <aside class="mv-rbtq-sidecard">
            <div class="mv-rbtq-kicker">Reader fit</div>
            <h4 id="mvRbtqSideTitle">Your result will appear here</h4>
            <p class="mv-rbtq-sidecopy" id="mvRbtqSideCopy">
              Your result creates a practical reader preset for speed, theme, accessibility, and comprehension settings.
            </p>

            <div class="mv-rbtq-chipbox">
              <div class="mv-rbtq-meta">Suggested reader preset</div>
              <div class="mv-rbtq-chip-grid" id="mvRbtqPresetGrid"></div>
            </div>

            <div class="mv-rbtq-result" id="mvRbtqResultPanel" hidden>
              <div class="mv-rbtq-kicker" id="mvRbtqBadge">Profile</div>
              <h4 id="mvRbtqResultTitle"></h4>
              <p class="mv-rbtq-note" id="mvRbtqResultSummary"></p>

              <div class="mv-rbtq-chipbox">
                <div class="mv-rbtq-meta">Strengths</div>
                <ul class="mv-rbtq-result-list" id="mvRbtqStrengths"></ul>
              </div>

              <div class="mv-rbtq-chipbox">
                <div class="mv-rbtq-meta">Watchouts</div>
                <ul class="mv-rbtq-result-list" id="mvRbtqWatchouts"></ul>
              </div>
            </div>

            <div class="mv-rbtq-chipbox">
              <div class="mv-rbtq-meta">Score pattern</div>
              <div class="mv-rbtq-score-grid" id="mvRbtqScoreGrid"></div>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function captureElements(root) {
    state.els = {
      questionShell: root.querySelector("#mvRbtqQuestionShell"),
      progressLabel: root.querySelector("#mvRbtqProgressLabel"),
      progressMeta: root.querySelector("#mvRbtqProgressMeta"),
      progressFill: root.querySelector("#mvRbtqProgressFill"),
      prevBtn: root.querySelector("#mvRbtqPrevBtn"),
      nextBtn: root.querySelector("#mvRbtqNextBtn"),
      resetBtn: root.querySelector("#mvRbtqResetBtn"),
      status: root.querySelector("#mvRbtqStatus"),
      sideTitle: root.querySelector("#mvRbtqSideTitle"),
      sideCopy: root.querySelector("#mvRbtqSideCopy"),
      presetGrid: root.querySelector("#mvRbtqPresetGrid"),
      resultPanel: root.querySelector("#mvRbtqResultPanel"),
      badge: root.querySelector("#mvRbtqBadge"),
      resultTitle: root.querySelector("#mvRbtqResultTitle"),
      resultSummary: root.querySelector("#mvRbtqResultSummary"),
      strengths: root.querySelector("#mvRbtqStrengths"),
      watchouts: root.querySelector("#mvRbtqWatchouts"),
      scoreGrid: root.querySelector("#mvRbtqScoreGrid")
    };
  }

  function calculateScores() {
    const totals = Object.keys(PROFILE_LIBRARY).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    QUESTIONS.forEach((question) => {
      const answerId = state.answers[question.id];
      const option = question.options.find((item) => item.id === answerId);
      if (!option) return;
      Object.entries(option.scores).forEach(([profileId, points]) => {
        totals[profileId] += Number(points) || 0;
      });
    });

    return totals;
  }

  function buildResult() {
    const scores = calculateScores();
    const ranking = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([profileId, score]) => ({
        profileId,
        score,
        profile: PROFILE_LIBRARY[profileId]
      }));

    const top = ranking[0];
    const second = ranking[1] || top;
    const total = ranking.reduce((sum, item) => sum + item.score, 0) || 1;
    const confidence = Math.max(0.18, (top.score - second.score + top.score) / total);

    return {
      profileId: top.profileId,
      profileName: top.profile.name,
      badge: top.profile.badge,
      summary: top.profile.summary,
      strengths: top.profile.strengths,
      watchouts: top.profile.watchouts,
      readerPreset: { ...top.profile.readerPreset },
      scoreMap: scores,
      ranking: ranking.map((item) => ({
        profileId: item.profileId,
        profileName: item.profile.name,
        score: item.score
      })),
      confidence: Number(confidence.toFixed(2))
    };
  }

  function renderQuestion() {
    const question = getQuestionByIndex(state.currentIndex);
    if (!question) return;

    const selected = getSelectedOption(question.id);
    const completeCount = Object.keys(state.answers).length;
    const completion = Math.round((completeCount / QUESTIONS.length) * 100);
    const isLast = state.currentIndex === QUESTIONS.length - 1;

    state.els.progressLabel.textContent = `Question ${state.currentIndex + 1} of ${QUESTIONS.length}`;
    state.els.progressMeta.textContent = `${completion}% complete`;
    state.els.progressFill.style.width = `${completion}%`;

    state.els.questionShell.innerHTML = `
      <div class="mv-rbtq-question">
        <h4>${escapeHtml(question.prompt)}</h4>
        <p class="mv-rbtq-note">${escapeHtml(question.helper || "Choose the answer that matches your natural behaviour.")}</p>
      </div>
      <div class="mv-rbtq-option-list">
        ${question.options.map((option) => `
          <button
            class="mv-rbtq-option ${selected === option.id ? "is-selected" : ""}"
            type="button"
            data-question-id="${escapeHtml(question.id)}"
            data-option-id="${escapeHtml(option.id)}"
          >
            <span class="mv-rbtq-option-title">${escapeHtml(option.label)}</span>
            <span class="mv-rbtq-meta">${escapeHtml(option.copy)}</span>
          </button>
        `).join("")}
      </div>
    `;

    state.els.prevBtn.disabled = state.currentIndex === 0;
    state.els.nextBtn.textContent = isLast ? "Finish quiz" : "Next";
    state.els.nextBtn.disabled = !selected;
  }

  function renderPresetGrid(result) {
    const preset = result?.readerPreset || null;
    const grid = state.els.presetGrid;
    grid.innerHTML = "";

    const items = preset
      ? [
          { label: "Start speed", value: `${preset.startWpm} WPM` },
          { label: "Word focus", value: `${preset.wordsPerStep} word${preset.wordsPerStep > 1 ? "s" : ""}` },
          { label: "Training path", value: `${preset.trainingPlanId} / ${preset.trainingModeId}` },
          { label: "Font profile", value: preset.fontProfile }
        ]
      : [
          { label: "Start speed", value: "-" },
          { label: "Word focus", value: "-" },
          { label: "Training path", value: "-" },
          { label: "Font profile", value: "-" }
        ];

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "mv-rbtq-chip";
      card.innerHTML = `
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      `;
      grid.appendChild(card);
    });
  }

  function renderScoreGrid(scoreMap) {
    const entries = Object.entries(scoreMap || {})
      .sort((a, b) => b[1] - a[1]);

    const max = Math.max(...entries.map((item) => item[1]), 1);
    state.els.scoreGrid.innerHTML = "";

    entries.forEach(([profileId, score]) => {
      const row = document.createElement("div");
      row.className = "mv-rbtq-score-row";
      row.innerHTML = `
        <div class="mv-rbtq-score-top">
          <span class="mv-rbtq-meta">${escapeHtml(PROFILE_LIBRARY[profileId].name)}</span>
          <strong class="mv-rbtq-option-title">${escapeHtml(String(score))}</strong>
        </div>
        <div class="mv-rbtq-score-bar">
          <div style="width:${(score / max) * 100}%"></div>
        </div>
      `;
      state.els.scoreGrid.appendChild(row);
    });
  }

  function renderResult() {
    const result = state.result;
    if (!result) {
      state.els.resultPanel.hidden = true;
      state.els.sideTitle.textContent = "Your result will appear here";
      state.els.sideCopy.textContent =
        "Your result creates a practical reader preset for speed, theme, accessibility, and comprehension settings.";
      renderPresetGrid(null);
      renderScoreGrid(calculateScores());
      return;
    }

    state.els.resultPanel.hidden = false;
    state.els.badge.textContent = result.badge;
    state.els.resultTitle.textContent = result.profileName;
    state.els.resultSummary.textContent = result.summary;
    state.els.sideTitle.textContent = result.profileName;
    state.els.sideCopy.textContent =
      `Confidence ${Math.round(result.confidence * 100)}%. This result is designed to become a ready-to-apply app preset, not just an onboarding label.`;

    state.els.strengths.innerHTML = result.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    state.els.watchouts.innerHTML = result.watchouts.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    renderPresetGrid(result);
    renderScoreGrid(result.scoreMap);
  }

  function emitChange() {
    if (typeof state.options.onChange === "function") {
      state.options.onChange(getState());
    }
  }

  function emitComplete() {
    if (typeof state.options.onComplete === "function" && state.result) {
      state.options.onComplete(JSON.parse(JSON.stringify(state.result)));
    }
  }

  function answerQuestion(questionId, optionId) {
    const question = QUESTIONS.find((item) => item.id === questionId);
    if (!question) return getState();

    const valid = question.options.some((item) => item.id === optionId);
    if (!valid) return getState();

    state.answers[questionId] = optionId;
    state.result = null;
    saveState();
    renderQuestion();
    renderResult();
    setStatus("");
    emitChange();
    return getState();
  }

  function completeQuiz() {
    if (Object.keys(state.answers).length !== QUESTIONS.length) {
      setStatus("Answer every question before finishing the quiz.", "error");
      return null;
    }

    state.result = buildResult();
    saveState();
    renderResult();
    setStatus(`Result saved: ${state.result.profileName}.`, "success");
    emitChange();
    emitComplete();
    return state.result;
  }

  function nextStep() {
    const question = getQuestionByIndex(state.currentIndex);
    if (!question) return;
    if (!state.answers[question.id]) {
      setStatus("Choose one option to continue.", "error");
      return;
    }

    if (state.currentIndex === QUESTIONS.length - 1) {
      completeQuiz();
      return;
    }

    state.currentIndex += 1;
    saveState();
    renderQuestion();
    setStatus("");
    emitChange();
  }

  function previousStep() {
    if (state.currentIndex === 0) return;
    state.currentIndex -= 1;
    saveState();
    renderQuestion();
    setStatus("");
    emitChange();
  }

  function resetQuiz() {
    state.currentIndex = 0;
    state.answers = {};
    state.result = null;
    saveState();
    renderQuestion();
    renderResult();
    setStatus("Quiz restarted.");
    emitChange();
    return getState();
  }

  function getResult() {
    return state.result ? JSON.parse(JSON.stringify(state.result)) : null;
  }

  function getState() {
    return {
      currentIndex: state.currentIndex,
      answers: { ...state.answers },
      answeredCount: Object.keys(state.answers).length,
      totalQuestions: QUESTIONS.length,
      result: getResult()
    };
  }

  function bindEvents() {
    state.root.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-question-id][data-option-id]") : null;
      if (!target) return;
      answerQuestion(
        target.getAttribute("data-question-id") || "",
        target.getAttribute("data-option-id") || ""
      );
    });

    state.els.nextBtn.addEventListener("click", nextStep);
    state.els.prevBtn.addEventListener("click", previousStep);
    state.els.resetBtn.addEventListener("click", resetQuiz);
  }

  function mount(options = {}) {
    state.options = { ...DEFAULTS, ...options };
    ensureStyles();

    const mountTarget = resolveMountTarget(state.options.mount);
    if (!mountTarget) {
      throw new Error("Brain type quiz mount target was not found.");
    }

    const saved = loadSavedState();
    state.currentIndex = Number.isFinite(Number(saved?.currentIndex)) ? Math.max(0, Math.min(QUESTIONS.length - 1, Number(saved.currentIndex))) : 0;
    state.answers = saved?.answers && typeof saved.answers === "object" ? saved.answers : {};
    state.result = saved?.result || null;

    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = createMarkup();
    const root = wrapper.firstElementChild;
    mountTarget.appendChild(root);

    state.root = root;
    state.mounted = true;
    captureElements(root);
    bindEvents();
    renderQuestion();
    renderResult();
    setStatus(
      state.result
        ? `Loaded saved result: ${state.result.profileName}.`
        : "Ready. Complete the quiz to generate a reader preset.",
      state.result ? "success" : "info"
    );

    return api;
  }

  const api = {
    mount,
    answerQuestion,
    nextStep,
    previousStep,
    resetQuiz,
    completeQuiz,
    getResult,
    getState
  };

  window.ManovexFeature09ReadingBrainTypeQuiz = api;
})();
