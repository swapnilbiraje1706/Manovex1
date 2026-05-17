(() => {
  "use strict";

  const STYLE_ID = "mv-aq-feature-styles";
  const ROOT_ID = "mv-aq-root";

  const DEFAULTS = {
    mount: null,
    endpoint: "",
    storageKey: "mv_feature_07_quiz_state",
    sectionTitle: "Comprehension Quizzes",
    sectionSubtitle:
      "Generate post-reading questions, check whether the reader really understood the text, and capture vocabulary for spaced review.",
    onQuizGenerated: null,
    onQuizGraded: null
  };

  const state = {
    options: { ...DEFAULTS },
    root: null,
    mounted: false,
    busy: false,
    readingContext: {
      title: "",
      text: "",
      sourceId: ""
    },
    quiz: null,
    grading: null,
    vocabQueue: [],
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
      .mv-aq-section {
        padding: 56px 0;
      }

      .mv-aq-shell {
        display: grid;
        grid-template-columns: minmax(0, 980px);
        justify-content: center;
        align-items: start;
      }

      .mv-aq-card {
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 18px;
        background: color-mix(in srgb, var(--card, #1f1a12) 96%, transparent);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
        padding: clamp(22px, 4vw, 34px);
      }

      .mv-aq-panel,
      .mv-aq-result,
      .mv-aq-vocab-card {
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 18px;
        background: color-mix(in srgb, var(--bg2, #1a1610) 78%, transparent);
        box-shadow: none;
      }

      .mv-aq-kicker {
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

      .mv-aq-title {
        margin: 0 0 10px;
        color: var(--text, #f5eadb);
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.05;
      }

      .mv-aq-copy,
      .mv-aq-meta,
      .mv-aq-note,
      .mv-aq-status,
      .mv-aq-sidecopy,
      .mv-aq-labelcopy {
        color: var(--muted, #a89b85);
        font-size: 14px;
        line-height: 1.6;
      }

      .mv-aq-copy {
        margin: 0 0 20px;
      }

      .mv-aq-grid {
        display: grid;
        gap: 18px;
      }

      .mv-aq-field label {
        display: block;
        margin-bottom: 6px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-aq-input,
      .mv-aq-textarea {
        width: 100%;
        min-height: 44px;
        padding: 12px 14px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 12px;
        outline: none;
        background: var(--bg2, #1a1610);
        color: var(--text, #f5eadb);
        font-family: Georgia, serif;
        font-size: 15px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .mv-aq-input:focus,
      .mv-aq-textarea:focus {
        border-color: var(--accent, #f5b041);
        box-shadow: 0 0 0 3px rgba(245, 176, 65, 0.12);
      }

      .mv-aq-textarea {
        min-height: 180px;
        resize: vertical;
      }

      .mv-aq-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .mv-aq-btn {
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

      .mv-aq-btn:hover {
        transform: translateY(-1px);
      }

      .mv-aq-btn-primary {
        background: var(--accent, #f5b041);
        color: var(--accent-contrast, #120f0a);
        box-shadow: 0 8px 24px rgba(245, 176, 65, 0.22);
      }

      .mv-aq-btn-secondary {
        border-color: var(--border, rgba(245,176,65,0.15));
        background: transparent;
        color: var(--text, #f5eadb);
      }

      .mv-aq-btn[disabled] {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .mv-aq-status {
        min-height: 20px;
      }

      .mv-aq-panel {
        padding: 20px;
      }

      .mv-aq-panel h4,
      .mv-aq-info-panel h4 {
        margin: 0 0 8px;
        color: var(--text, #f5eadb);
        font-size: 22px;
      }

      .mv-aq-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }

      .mv-aq-metrics div,
      .mv-aq-result {
        padding: 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
      }

      .mv-aq-metrics span,
      .mv-aq-result span {
        display: block;
        margin-bottom: 4px;
        color: var(--accent, #f5b041);
        font-family: Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mv-aq-metrics strong,
      .mv-aq-result strong {
        color: var(--text, #f5eadb);
        font-size: 18px;
      }

      .mv-aq-question-list,
      .mv-aq-results-list,
      .mv-aq-vocab-list {
        display: grid;
        gap: 14px;
      }

      .mv-aq-question,
      .mv-aq-vocab-card {
        padding: 18px;
      }

      .mv-aq-question-title,
      .mv-aq-vocab-term {
        margin: 0 0 8px;
        color: var(--text, #f5eadb);
        font-size: 17px;
      }

      .mv-aq-option-list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .mv-aq-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        cursor: pointer;
      }

      .mv-aq-option input {
        margin-top: 4px;
      }

      .mv-aq-answer {
        margin-top: 12px;
      }

      .mv-aq-short-input {
        width: 100%;
        min-height: 92px;
        padding: 12px 14px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 12px;
        outline: none;
        background: var(--bg2, #1a1610);
        color: var(--text, #f5eadb);
        font-family: Georgia, serif;
        font-size: 15px;
        resize: vertical;
      }

      .mv-aq-results-shell {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .mv-aq-result {
        border: 1px solid rgba(245, 176, 65, 0.12);
      }

      .mv-aq-results-list .mv-aq-result-item {
        padding: 16px;
        border-radius: 14px;
        border: 1px solid rgba(245, 176, 65, 0.14);
        background: rgba(245, 176, 65, 0.05);
      }

      .mv-aq-results-list .mv-aq-result-item h5 {
        margin: 0 0 6px;
        color: var(--text, #f5eadb);
        font-size: 16px;
      }

      .mv-aq-vocab-meta {
        margin-top: 8px;
        color: var(--muted, #a89b85);
        font-size: 13px;
        line-height: 1.5;
      }

      .mv-aq-vocab-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .mv-aq-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 8px 12px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 999px;
        background: transparent;
        color: var(--text, #f5eadb);
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 700;
      }

      .mv-aq-info-panel {
        margin-top: 22px;
        padding: 20px;
        border: 1px solid var(--border, rgba(245,176,65,0.15));
        border-radius: 14px;
        background: color-mix(in srgb, var(--bg2, #1a1610) 76%, transparent);
      }

      .mv-aq-info-panel ul {
        display: grid;
        gap: 14px;
        padding: 0;
        margin: 18px 0 0;
        list-style: none;
      }

      .mv-aq-info-panel li {
        position: relative;
        padding-left: 18px;
        color: var(--text, #f5eadb);
        font-size: 14px;
        line-height: 1.55;
      }

      .mv-aq-info-panel li::before {
        content: "";
        position: absolute;
        top: 9px;
        left: 0;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--accent, #f5b041);
      }

      @media (max-width: 860px) {
        .mv-aq-metrics,
        .mv-aq-results-shell {
          grid-template-columns: 1fr;
        }

        .mv-aq-section {
          padding: 44px 0;
        }

        .mv-aq-card {
          border-radius: 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(state.options.storageKey);
      if (!raw) return { vocabQueue: [] };
      const parsed = JSON.parse(raw);
      return {
        vocabQueue: Array.isArray(parsed.vocabQueue) ? parsed.vocabQueue : []
      };
    } catch (_error) {
      return { vocabQueue: [] };
    }
  }

  function saveState() {
    localStorage.setItem(
      state.options.storageKey,
      JSON.stringify({
        vocabQueue: state.vocabQueue
      })
    );
  }

  function createMarkup() {
    return `
      <section class="mv-aq-section" id="${ROOT_ID}">
        <div class="mv-aq-shell">
          <div class="mv-aq-card">
            <div class="mv-aq-kicker">Comprehension check</div>
            <h3 class="mv-aq-title">${escapeHtml(state.options.sectionTitle)}</h3>
            <p class="mv-aq-copy">${escapeHtml(state.options.sectionSubtitle)}</p>

            <div class="mv-aq-grid">
              <div class="mv-aq-field">
                <label for="mvAqTitle">Reading title</label>
                <input id="mvAqTitle" class="mv-aq-input" type="text" placeholder="Chapter or article title">
              </div>

              <div class="mv-aq-field">
                <label for="mvAqText">Reading text</label>
                <textarea id="mvAqText" class="mv-aq-textarea" placeholder="Paste the text you just read."></textarea>
              </div>

              <div class="mv-aq-actions">
                <button class="mv-aq-btn mv-aq-btn-primary" id="mvAqGenerateBtn" type="button">Generate quiz</button>
                <button class="mv-aq-btn mv-aq-btn-secondary" id="mvAqClearBtn" type="button">Clear</button>
              </div>

              <div class="mv-aq-status" id="mvAqStatus" aria-live="polite"></div>

              <div class="mv-aq-panel" id="mvAqSummaryPanel" hidden>
                <h4 id="mvAqSummaryTitle"></h4>
                <p class="mv-aq-note" id="mvAqSummaryText"></p>
                <div class="mv-aq-metrics">
                  <div>
                    <span>Questions</span>
                    <strong id="mvAqMetricQuestions">0</strong>
                  </div>
                  <div>
                    <span>Vocabulary</span>
                    <strong id="mvAqMetricVocab">0</strong>
                  </div>
                  <div>
                    <span>Word count</span>
                    <strong id="mvAqMetricWords">0</strong>
                  </div>
                </div>
              </div>

              <div class="mv-aq-panel" id="mvAqQuestionsPanel" hidden>
                <h4>Quiz</h4>
                <div class="mv-aq-question-list" id="mvAqQuestionList"></div>
                <div class="mv-aq-actions" style="margin-top:16px">
                  <button class="mv-aq-btn mv-aq-btn-primary" id="mvAqSubmitBtn" type="button">Grade my answers</button>
                </div>
              </div>

              <div class="mv-aq-panel" id="mvAqResultsPanel" hidden>
                <h4>Results</h4>
                <div class="mv-aq-results-shell">
                  <div class="mv-aq-result">
                    <span>Overall score</span>
                    <strong id="mvAqOverallScore">0%</strong>
                  </div>
                  <div class="mv-aq-result">
                    <span>Comprehension band</span>
                    <strong id="mvAqBand">-</strong>
                  </div>
                  <div class="mv-aq-result">
                    <span>Vocabulary captured</span>
                    <strong id="mvAqSavedVocabCount">0</strong>
                  </div>
                </div>
                <div class="mv-aq-results-list" id="mvAqResultsList" style="margin-top:16px"></div>
              </div>

              <div class="mv-aq-info-panel">
                <div class="mv-aq-kicker">Vocabulary review</div>
                <h4>Words to revisit</h4>
                <p class="mv-aq-sidecopy">
                  Each quiz can extract vocabulary in context. Save those words and review them with a simple spaced schedule.
                </p>
                <div class="mv-aq-vocab-list" id="mvAqVocabList"></div>
                <ul>
                  <li>Generates comprehension questions after a reading session.</li>
                  <li>Keeps multiple-choice and short-answer questions in one flow.</li>
                  <li>Grades answers and returns feedback you can review later.</li>
                  <li>Extracts vocabulary with meaning and context sentence.</li>
                  <li>Supports spaced review actions: again, good, and easy.</li>
                </ul>
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

  function setBusy(busy, message = "") {
    state.busy = busy;
    if (state.els.generateBtn) state.els.generateBtn.disabled = busy;
    if (state.els.submitBtn) state.els.submitBtn.disabled = busy;
    if (message) setStatus(message);
  }

  function captureElements(root) {
    state.els = {
      title: root.querySelector("#mvAqTitle"),
      text: root.querySelector("#mvAqText"),
      generateBtn: root.querySelector("#mvAqGenerateBtn"),
      clearBtn: root.querySelector("#mvAqClearBtn"),
      submitBtn: root.querySelector("#mvAqSubmitBtn"),
      status: root.querySelector("#mvAqStatus"),
      summaryPanel: root.querySelector("#mvAqSummaryPanel"),
      summaryTitle: root.querySelector("#mvAqSummaryTitle"),
      summaryText: root.querySelector("#mvAqSummaryText"),
      metricQuestions: root.querySelector("#mvAqMetricQuestions"),
      metricVocab: root.querySelector("#mvAqMetricVocab"),
      metricWords: root.querySelector("#mvAqMetricWords"),
      questionsPanel: root.querySelector("#mvAqQuestionsPanel"),
      questionList: root.querySelector("#mvAqQuestionList"),
      resultsPanel: root.querySelector("#mvAqResultsPanel"),
      overallScore: root.querySelector("#mvAqOverallScore"),
      band: root.querySelector("#mvAqBand"),
      savedVocabCount: root.querySelector("#mvAqSavedVocabCount"),
      resultsList: root.querySelector("#mvAqResultsList"),
      vocabList: root.querySelector("#mvAqVocabList")
    };
  }

  function syncContextInputs() {
    state.els.title.value = state.readingContext.title || "";
    state.els.text.value = state.readingContext.text || "";
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getReadingContextFromInputs() {
    return {
      title: String(state.els.title.value || "").trim() || "Untitled reading",
      text: normalizeText(state.els.text.value),
      sourceId: state.readingContext.sourceId || ""
    };
  }

  function readQuizAnswers() {
    if (!state.quiz) return [];
    return state.quiz.questions.map((question) => {
      if (question.type === "multiple_choice") {
        const checked = state.root.querySelector(`input[name="mvAq_${question.id}"]:checked`);
        return {
          questionId: question.id,
          answer: checked ? checked.value : ""
        };
      }
      const input = state.root.querySelector(`[data-short-answer="${question.id}"]`);
      return {
        questionId: question.id,
        answer: String(input?.value || "").trim()
      };
    });
  }

  function isPlaceholderEndpoint() {
    const endpoint = String(state.options.endpoint || "");
    return !endpoint || endpoint.includes("__SUPABASE_URL__") || endpoint.includes("/__/") || endpoint.startsWith("file:");
  }

  function getSentences(text) {
    return normalizeText(text)
      .split(/(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .filter((item) => item.split(/\s+/).length >= 8)
      .slice(0, 12);
  }

  function summarizeSentence(sentence, limit = 16) {
    const words = normalizeText(sentence).split(/\s+/).filter(Boolean);
    return words.slice(0, limit).join(" ") + (words.length > limit ? "..." : "");
  }

  function buildLocalQuiz(context) {
    const words = context.text.split(/\s+/).filter(Boolean);
    const sentences = getSentences(context.text);
    const sourceSentences = sentences.length >= 3 ? sentences : [
      "The passage explains that consistent reading practice improves focus and comprehension over time.",
      "The main idea is that structured reading can reduce friction and make attention more stable.",
      "The reader should preserve understanding while increasing speed gradually."
    ];

    const distractors = sourceSentences.map((sentence) => summarizeSentence(sentence, 12));
    const questions = sourceSentences.slice(0, 3).map((sentence, index) => {
      const correct = summarizeSentence(sentence, 14);
      const optionPool = distractors.filter((item) => item !== correct);
      const options = [
        correct,
        optionPool[(index + 1) % Math.max(optionPool.length, 1)] || "A detail unrelated to the passage's central idea.",
        optionPool[(index + 2) % Math.max(optionPool.length, 1)] || "A claim that the passage does not support.",
        "The passage says the topic cannot be improved through practice."
      ];
      return {
        id: "local_q_" + (index + 1),
        type: "multiple_choice",
        prompt: index === 0
          ? "Which statement best captures an important idea from this passage?"
          : "Which detail is directly supported by the passage?",
        intent: "Generated in the browser from the passage you provided.",
        options,
        answerIndex: 0
      };
    });

    return {
      title: context.title || "Local comprehension quiz",
      summary: "Generated from the passage you provided.",
      wordCount: words.length,
      questions,
      vocabulary: words
        .filter((word) => word.length >= 8)
        .slice(0, 4)
        .map((term) => ({
          term,
          meaning: "Review this word in the context of the passage.",
          contextSentence: sourceSentences.find((sentence) => sentence.includes(term)) || sourceSentences[0],
          difficulty: "medium"
        }))
    };
  }

  function gradeLocalQuiz(answers) {
    const results = (state.quiz?.questions || []).map((question) => {
      const answer = answers.find((item) => item.questionId === question.id);
      const selected = Number(answer?.answer);
      const isCorrect = question.type === "multiple_choice" && selected === Number(question.answerIndex || 0);
      return {
        questionId: question.id,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect
          ? "Correct. Your answer matches the passage-supported option."
          : "Review this part again. The expected answer is the option most directly supported by the text."
      };
    });
    const overallScore = results.length
      ? results.reduce((sum, item) => sum + item.score, 0) / results.length
      : 0;
    return {
      overallScore,
      comprehensionBand: overallScore >= 80 ? "Strong comprehension" : overallScore >= 50 ? "Partial comprehension" : "Needs review",
      questionResults: results,
      vocabulary: state.quiz?.vocabulary || []
    };
  }

  function renderQuiz() {
    if (!state.quiz) {
      state.els.summaryPanel.hidden = true;
      state.els.questionsPanel.hidden = true;
      state.els.resultsPanel.hidden = true;
      return;
    }

    state.els.summaryPanel.hidden = false;
    state.els.questionsPanel.hidden = false;
    state.els.summaryTitle.textContent = state.quiz.title || "Quiz ready";
    state.els.summaryText.textContent = state.quiz.summary || "";
    state.els.metricQuestions.textContent = String(state.quiz.questions.length);
    state.els.metricVocab.textContent = String(state.quiz.vocabulary.length);
    state.els.metricWords.textContent = String(state.quiz.wordCount || 0);

    state.els.questionList.innerHTML = "";
    state.quiz.questions.forEach((question, index) => {
      const wrapper = document.createElement("article");
      wrapper.className = "mv-aq-question";
      wrapper.innerHTML = `
        <div class="mv-aq-kicker">Question ${index + 1}</div>
        <h5 class="mv-aq-question-title">${escapeHtml(question.prompt)}</h5>
        <p class="mv-aq-labelcopy">${escapeHtml(question.intent || "")}</p>
      `;

      if (question.type === "multiple_choice") {
        const list = document.createElement("div");
        list.className = "mv-aq-option-list";
        question.options.forEach((option, optionIndex) => {
          const label = document.createElement("label");
          label.className = "mv-aq-option";
          label.innerHTML = `
            <input type="radio" name="mvAq_${escapeHtml(question.id)}" value="${optionIndex}">
            <span>${escapeHtml(option)}</span>
          `;
          list.appendChild(label);
        });
        wrapper.appendChild(list);
      } else {
        const answer = document.createElement("div");
        answer.className = "mv-aq-answer";
        answer.innerHTML = `
          <textarea
            class="mv-aq-short-input"
            data-short-answer="${escapeHtml(question.id)}"
            placeholder="Write your answer in your own words."
          ></textarea>
        `;
        wrapper.appendChild(answer);
      }

      state.els.questionList.appendChild(wrapper);
    });
  }

  function renderResults() {
    if (!state.grading) {
      state.els.resultsPanel.hidden = true;
      return;
    }

    state.els.resultsPanel.hidden = false;
    state.els.overallScore.textContent = Math.round(state.grading.overallScore) + "%";
    state.els.band.textContent = state.grading.comprehensionBand || "-";
    state.els.savedVocabCount.textContent = String(state.vocabQueue.length);
    state.els.resultsList.innerHTML = "";

    state.grading.questionResults.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "mv-aq-result-item";
      card.innerHTML = `
        <h5>Question ${index + 1}</h5>
        <p class="mv-aq-note">${escapeHtml(item.feedback || "")}</p>
        <p class="mv-aq-meta">Score: ${Math.round(item.score)}%</p>
      `;
      state.els.resultsList.appendChild(card);
    });
  }

  function getDueVocabulary() {
    const now = Date.now();
    return state.vocabQueue.filter((item) => !item.nextReviewAt || new Date(item.nextReviewAt).getTime() <= now);
  }

  function formatNextReview(dateValue) {
    if (!dateValue) return "Review now";
    try {
      return new Intl.DateTimeFormat(navigator.language || undefined, {
        month: "short",
        day: "numeric"
      }).format(new Date(dateValue));
    } catch (_error) {
      return dateValue;
    }
  }

  function renderVocabulary() {
    state.els.vocabList.innerHTML = "";
    const due = getDueVocabulary();

    if (!due.length) {
      const empty = document.createElement("div");
      empty.className = "mv-aq-vocab-card";
      empty.innerHTML = `
        <h5 class="mv-aq-vocab-term">No vocabulary due</h5>
        <p class="mv-aq-note">Generate a quiz first or wait until saved words are due for review.</p>
      `;
      state.els.vocabList.appendChild(empty);
      return;
    }

    due.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "mv-aq-vocab-card";
      card.innerHTML = `
        <h5 class="mv-aq-vocab-term">${escapeHtml(entry.term)}</h5>
        <p class="mv-aq-note">${escapeHtml(entry.meaning)}</p>
        <div class="mv-aq-vocab-meta">${escapeHtml(entry.contextSentence || "")}</div>
        <div class="mv-aq-vocab-meta">Next review: ${escapeHtml(formatNextReview(entry.nextReviewAt))}</div>
        <div class="mv-aq-vocab-actions">
          <button class="mv-aq-chip" data-vocab-action="again" data-vocab-id="${escapeHtml(entry.id)}">Again</button>
          <button class="mv-aq-chip" data-vocab-action="good" data-vocab-id="${escapeHtml(entry.id)}">Good</button>
          <button class="mv-aq-chip" data-vocab-action="easy" data-vocab-id="${escapeHtml(entry.id)}">Easy</button>
        </div>
      `;
      state.els.vocabList.appendChild(card);
    });
  }

  function upsertVocabulary(items) {
    const existing = new Map(state.vocabQueue.map((item) => [item.term.toLowerCase(), item]));
    items.forEach((item) => {
      const key = String(item.term || "").trim().toLowerCase();
      if (!key) return;
      const current = existing.get(key);
      if (current) {
        current.meaning = item.meaning || current.meaning;
        current.contextSentence = item.contextSentence || current.contextSentence;
        current.difficulty = item.difficulty || current.difficulty;
      } else {
        state.vocabQueue.push({
          id: "vocab_" + Math.random().toString(36).slice(2, 10),
          term: item.term,
          meaning: item.meaning,
          contextSentence: item.contextSentence,
          difficulty: item.difficulty || "medium",
          nextReviewAt: new Date().toISOString(),
          streak: 0
        });
      }
    });
    saveState();
    renderVocabulary();
  }

  function setVocabularyReview(id, action) {
    const entry = state.vocabQueue.find((item) => item.id === id);
    if (!entry) return;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (action === "again") {
      entry.streak = 0;
      entry.nextReviewAt = new Date(now + 10 * 60 * 1000).toISOString();
    } else if (action === "good") {
      entry.streak = (entry.streak || 0) + 1;
      entry.nextReviewAt = new Date(now + Math.max(1, entry.streak) * day).toISOString();
    } else {
      entry.streak = (entry.streak || 0) + 2;
      entry.nextReviewAt = new Date(now + Math.max(3, entry.streak * 2) * day).toISOString();
    }
    saveState();
    renderVocabulary();
  }

  async function callEndpoint(payload) {
    if (isPlaceholderEndpoint()) {
      throw new Error("Quiz generation is not available right now.");
    }

    if (!state.options.endpoint) {
      throw new Error("Quiz generation is not available right now.");
    }

    const response = await fetch(state.options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || "Quiz request failed.");
    }
    return data;
  }

  async function generateQuiz() {
    const context = getReadingContextFromInputs();
    if (!context.text || context.text.split(/\s+/).filter(Boolean).length < 120) {
      setStatus("Paste enough reading text before generating a quiz.", "error");
      return;
    }

    state.readingContext = context;
    setBusy(true, "Generating quiz...");
    state.grading = null;

    try {
      let payload;
      try {
        payload = await callEndpoint({
          action: "generate_quiz",
          title: context.title,
          text: context.text
        });
      } catch (endpointError) {
        payload = buildLocalQuiz(context);
        setStatus("Quiz generated in your browser from the provided passage.", "info");
      }

      state.quiz = {
        title: payload.title || context.title,
        summary: payload.summary || "",
        wordCount: payload.wordCount || context.text.split(/\s+/).filter(Boolean).length,
        questions: Array.isArray(payload.questions) ? payload.questions : [],
        vocabulary: Array.isArray(payload.vocabulary) ? payload.vocabulary : []
      };

      renderQuiz();
      renderResults();
      if (typeof state.options.onQuizGenerated === "function") {
        state.options.onQuizGenerated({
          readingContext: { ...state.readingContext },
          quiz: JSON.parse(JSON.stringify(state.quiz))
        });
      }
      setStatus("Quiz ready. Answer the questions and grade the session.", "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to generate quiz.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function gradeQuiz() {
    if (!state.quiz) {
      setStatus("Generate a quiz first.", "error");
      return;
    }

    const answers = readQuizAnswers();
    const unanswered = answers.some((answer) => !String(answer.answer || "").trim());
    if (unanswered) {
      setStatus("Answer every question before grading the quiz.", "error");
      return;
    }

    setBusy(true, "Grading answers...");
    try {
      let payload;
      try {
        payload = await callEndpoint({
          action: "grade_quiz",
          title: state.readingContext.title,
          text: state.readingContext.text,
          quiz: state.quiz,
          answers
        });
      } catch (_endpointError) {
        payload = gradeLocalQuiz(answers);
      }

      state.grading = {
        overallScore: payload.overallScore || 0,
        comprehensionBand: payload.comprehensionBand || "Needs review",
        questionResults: Array.isArray(payload.questionResults) ? payload.questionResults : []
      };

      upsertVocabulary(Array.isArray(payload.vocabulary) ? payload.vocabulary : state.quiz.vocabulary);
      renderResults();
      if (typeof state.options.onQuizGraded === "function") {
        state.options.onQuizGraded({
          readingContext: { ...state.readingContext },
          quiz: JSON.parse(JSON.stringify(state.quiz)),
          grading: JSON.parse(JSON.stringify(state.grading)),
          vocabQueue: JSON.parse(JSON.stringify(state.vocabQueue))
        });
      }
      setStatus("Quiz graded and vocabulary saved.", "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to grade the quiz.", "error");
    } finally {
      setBusy(false);
    }
  }

  function setReadingContext(context) {
    state.readingContext = {
      title: String(context?.title || "").trim(),
      text: normalizeText(context?.text || ""),
      sourceId: String(context?.sourceId || "").trim()
    };
    if (state.mounted) syncContextInputs();
    return state.readingContext;
  }

  function clearModule() {
    state.readingContext = { title: "", text: "", sourceId: "" };
    state.quiz = null;
    state.grading = null;
    syncContextInputs();
    renderQuiz();
    renderResults();
    setStatus("");
  }

  function bindEvents() {
    state.els.generateBtn.addEventListener("click", generateQuiz);
    state.els.submitBtn.addEventListener("click", gradeQuiz);
    state.els.clearBtn.addEventListener("click", clearModule);
    state.root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-vocab-action");
      const id = target.getAttribute("data-vocab-id");
      if (action && id) {
        setVocabularyReview(id, action);
      }
    });
  }

  function mount(options = {}) {
    const mergedOptions = { ...DEFAULTS, ...options };
    const target = resolveMountTarget(mergedOptions.mount);
    if (!target) {
      throw new Error("Comprehension quiz mount target was not found.");
    }

    state.options = mergedOptions;
    state.vocabQueue = loadSavedState().vocabQueue;
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
    syncContextInputs();
    bindEvents();
    renderQuiz();
    renderResults();
    renderVocabulary();

    return api;
  }

  function getState() {
    return {
      readingContext: { ...state.readingContext },
      quiz: state.quiz ? JSON.parse(JSON.stringify(state.quiz)) : null,
      grading: state.grading ? JSON.parse(JSON.stringify(state.grading)) : null,
      vocabQueue: JSON.parse(JSON.stringify(state.vocabQueue))
    };
  }

  const api = {
    mount,
    setReadingContext,
    generateQuiz,
    gradeQuiz,
    clearModule,
    getState
  };

  window.ManovexFeature07ComprehensionQuizzes = api;
})();
