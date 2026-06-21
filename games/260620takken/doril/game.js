const QUESTION_SET_ID = "takken_v03";
const SAVE_VERSION = 1;
const MAX_ATTEMPTS = 3;

const state = {
  questions: [],
  questionMap: new Map(),
  categoryConfig: null,
  mode: "all",
  progress: {},
  currentQuestionId: null,
  pendingQuestionId: null,
  manualStartQuestionId: 1,
  currentFeedback: null,
  dataReady: false
};

const screens = {
  home: document.getElementById("homeScreen"),
  study: document.getElementById("studyScreen"),
  analysis: document.getElementById("analysisScreen"),
  list: document.getElementById("listScreen")
};

const homeMessage = document.getElementById("homeMessage");
const saveInput = document.getElementById("saveInput");
const saveOutput = document.getElementById("saveOutput");
const manualStartNumber = document.getElementById("manualStartNumber");
const startNewButton = document.getElementById("startNewButton");
const resumeButton = document.getElementById("resumeButton");
const sampleLoadButton = document.getElementById("sampleLoadButton");
const openAnalysisButton = document.getElementById("openAnalysisButton");
const openListButton = document.getElementById("openListButton");
const showListButton = document.getElementById("showListButton");
const showAnalysisButton = document.getElementById("showAnalysisButton");
const backHomeButton = document.getElementById("backHomeButton");
const exportSaveButton = document.getElementById("exportSaveButton");
const analysisOpenListButton = document.getElementById("analysisOpenListButton");
const analysisBackStudyButton = document.getElementById("analysisBackStudyButton");
const analysisBackHomeButton = document.getElementById("analysisBackHomeButton");
const listBackStudyButton = document.getElementById("listBackStudyButton");
const listOpenAnalysisButton = document.getElementById("listOpenAnalysisButton");
const listBackHomeButton = document.getElementById("listBackHomeButton");
const prevQuestionButton = document.getElementById("prevQuestionButton");
const nextQuestionButtonTop = document.getElementById("nextQuestionButtonTop");
const jumpQuestionButton = document.getElementById("jumpQuestionButton");
const questionSelect = document.getElementById("questionSelect");
const manualControls = document.getElementById("manualControls");

const modeBadge = document.getElementById("modeBadge");
const questionTitle = document.getElementById("questionTitle");
const questionMeta = document.getElementById("questionMeta");
const questionCategory = document.getElementById("questionCategory");
const questionText = document.getElementById("questionText");
const choicesBox = document.getElementById("choicesBox");
const answerFeedback = document.getElementById("answerFeedback");
const attemptHistory = document.getElementById("attemptHistory");
const progressValue = document.getElementById("progressValue");
const accuracyValue = document.getElementById("accuracyValue");
const wrongValue = document.getElementById("wrongValue");
const remainingValue = document.getElementById("remainingValue");
const categoryTable = document.getElementById("categoryTable");
const wrongList = document.getElementById("wrongList");
const radarChart = document.getElementById("radarChart");
const problemListTable = document.getElementById("problemListTable");
const listSolvedCount = document.getElementById("listSolvedCount");
const listWrongCount = document.getElementById("listWrongCount");
const listUntouchedCount = document.getElementById("listUntouchedCount");

function bindEvents() {
  startNewButton.addEventListener("click", () => {
    if (!state.dataReady) {
      return;
    }

    state.progress = {};
    state.pendingQuestionId = null;
    state.manualStartQuestionId = getManualStartInputValue();
    startStudy(getSelectedMode());
  });

  resumeButton.addEventListener("click", () => {
    if (!state.dataReady) {
      return;
    }

    const raw = saveInput.value.trim();

    if (!raw) {
      homeMessage.textContent = "保存文字列を貼り付けてください。";
      return;
    }

    try {
      const payload = parseSaveString(raw);
      state.progress = normalizeProgress(payload.progress || {});
      state.pendingQuestionId = payload.currentQuestionId || null;
      state.manualStartQuestionId = payload.manualStartQuestionId || 1;
      manualStartNumber.value = String(state.manualStartQuestionId);
      startStudy(payload.mode || getSelectedMode());
      homeMessage.textContent = "保存文字列を読み込みました。";
    } catch (error) {
      homeMessage.textContent = error.message;
    }
  });

  sampleLoadButton.addEventListener("click", () => {
    saveInput.value = "";
    homeMessage.textContent = state.dataReady
      ? "保存文字列を貼り付けると、つづきから再開できます。"
      : "問題データを読み込み中です。";
  });

  openAnalysisButton.addEventListener("click", () => {
    renderAnalysis();
    showScreen("analysis");
  });

  openListButton.addEventListener("click", () => {
    renderProblemList();
    showScreen("list");
  });

  showListButton.addEventListener("click", () => {
    renderProblemList();
    showScreen("list");
  });

  showAnalysisButton.addEventListener("click", () => {
    renderAnalysis();
    showScreen("analysis");
  });

  backHomeButton.addEventListener("click", () => {
    renderAnalysis();
    showScreen("home");
  });

  exportSaveButton.addEventListener("click", () => {
    updateSaveOutput();
    saveOutput.focus();
    saveOutput.select();
  });

  prevQuestionButton.addEventListener("click", () => moveManualQuestion(-1));
  nextQuestionButtonTop.addEventListener("click", () => moveManualQuestion(1));
  jumpQuestionButton.addEventListener("click", () => {
    jumpToQuestion(Number(questionSelect.value));
  });

  questionSelect.addEventListener("change", () => {
    if (state.mode === "manual") {
      jumpToQuestion(Number(questionSelect.value));
    }
  });

  analysisOpenListButton.addEventListener("click", () => {
    renderProblemList();
    showScreen("list");
  });

  analysisBackStudyButton.addEventListener("click", () => {
    if (state.currentQuestionId) {
      renderStudy();
      showScreen("study");
      return;
    }

    showScreen("home");
  });

  analysisBackHomeButton.addEventListener("click", () => {
    showScreen("home");
  });

  listBackStudyButton.addEventListener("click", () => {
    if (state.currentQuestionId) {
      renderStudy();
      showScreen("study");
      return;
    }

    showScreen("home");
  });

  listOpenAnalysisButton.addEventListener("click", () => {
    renderAnalysis();
    showScreen("analysis");
  });

  listBackHomeButton.addEventListener("click", () => {
    showScreen("home");
  });
}

async function init() {
  bindEvents();
  setLoadingState(true);

  try {
    const [questionsRes, categoryRes] = await Promise.all([
      fetch("./takken_v03_questions.json"),
      fetch("./question_categories.json")
    ]);

    if (!questionsRes.ok || !categoryRes.ok) {
      throw new Error("JSON の読み込みに失敗しました。");
    }

    const questions = await questionsRes.json();
    const categoryConfig = await categoryRes.json();

    state.questions = [...questions].sort((left, right) => left.id - right.id);
    state.questionMap = new Map(state.questions.map(question => [question.id, question]));
    state.categoryConfig = categoryConfig;
    state.dataReady = true;
    manualStartNumber.max = String(state.questions.length);

    populateQuestionSelect();

    homeMessage.textContent = "準備完了です。最初からか、保存文字列を読み込んで開始してください。";
    renderStudySummary();
    renderAnalysis();
    renderProblemList();
  } catch (error) {
    homeMessage.textContent = "読み込み失敗: " + error.message;
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  startNewButton.disabled = isLoading;
  resumeButton.disabled = isLoading;
  openAnalysisButton.disabled = isLoading;
  openListButton.disabled = isLoading;
}

function getSelectedMode() {
  const selected = document.querySelector("input[name='studyMode']:checked");
  return selected ? selected.value : "all";
}

function startStudy(mode) {
  state.mode = mode;
  state.currentFeedback = null;

  if (mode === "manual") {
    state.currentQuestionId = resolveManualQuestionId(
      state.pendingQuestionId || state.manualStartQuestionId || getManualStartInputValue()
    );
    state.pendingQuestionId = null;
    updateSaveOutput();
    renderStudy();
    renderAnalysis();
    renderProblemList();
    showScreen("study");
    return;
  }

  const eligibleIds = getEligibleQuestionIds(mode);

  if (eligibleIds.length === 0) {
    state.currentQuestionId = null;
    updateSaveOutput();
    renderStudy();
    renderAnalysis();
    renderProblemList();
    showScreen("study");
    return;
  }

  const pendingId = state.pendingQuestionId;
  state.pendingQuestionId = null;

  if (pendingId && eligibleIds.includes(pendingId)) {
    state.currentQuestionId = pendingId;
  } else {
    state.currentQuestionId = pickNextQuestionId(null);
  }

  updateSaveOutput();
  renderStudy();
  renderAnalysis();
  renderProblemList();
  showScreen("study");
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => {
    element.classList.toggle("active", key === name);
  });
}

function getEligibleQuestionIds(mode = state.mode) {
  if (mode === "manual") {
    return state.questions.map(question => question.id);
  }

  return state.questions
    .filter(question => isEligibleQuestion(question.id, mode))
    .map(question => question.id);
}

function isEligibleQuestion(questionId, mode) {
  if (mode !== "retryOnly") {
    return true;
  }

  const record = state.progress[questionId];

  if (!record || record.attempts.length === 0) {
    return true;
  }

  const latest = record.attempts[record.attempts.length - 1];
  return latest.result === "×";
}

function pickNextQuestionId(previousId) {
  const eligibleIds = getEligibleQuestionIds();

  if (eligibleIds.length === 0) {
    return null;
  }

  const filteredIds =
    previousId && eligibleIds.length > 1
      ? eligibleIds.filter(questionId => questionId !== previousId)
      : eligibleIds;

  return filteredIds[Math.floor(Math.random() * filteredIds.length)];
}

function handleAnswer(choiceIndex) {
  if (!state.currentQuestionId || state.currentFeedback) {
    return;
  }

  const question = state.questionMap.get(state.currentQuestionId);
  const isCorrect = question.answer === choiceIndex;

  updateProgress(question.id, isCorrect);

  state.currentFeedback = {
    chosen: choiceIndex,
    correct: question.answer,
    isCorrect
  };

  updateSaveOutput();
  renderStudy();
  renderAnalysis();
}

function updateProgress(questionId, isCorrect) {
  const today = formatDate(new Date());
  const current = state.progress[questionId] || {
    attempts: [],
    correctHistory: [],
    wrongHistory: [],
    totalAnswers: 0,
    totalCorrect: 0
  };

  current.attempts.push({
    date: today,
    result: isCorrect ? "○" : "×"
  });

  current.attempts = current.attempts.slice(-MAX_ATTEMPTS);

  if (isCorrect) {
    current.correctHistory = [...(current.correctHistory || []), today].slice(-MAX_ATTEMPTS);
  } else {
    current.wrongHistory = [...(current.wrongHistory || []), today].slice(-MAX_ATTEMPTS);
  }

  current.totalAnswers += 1;

  if (isCorrect) {
    current.totalCorrect += 1;
  }

  current.updatedAt = today;
  state.progress[questionId] = current;
}

function goToNextQuestion() {
  const previousId = state.currentQuestionId;
  state.currentFeedback = null;

  if (state.mode === "manual") {
    state.currentQuestionId = getAdjacentQuestionId(previousId, 1);
  } else {
    state.currentQuestionId = pickNextQuestionId(previousId);
  }

  updateSaveOutput();
  renderStudy();
  renderAnalysis();
  renderProblemList();
}

function renderStudy() {
  renderStudySummary();

  modeBadge.textContent = getModeLabel(state.mode);
  renderManualControls();

  if (!state.currentQuestionId) {
    questionTitle.textContent = "出題できる問題がありません";
    questionMeta.textContent = state.mode === "retryOnly"
      ? "直近で不正解または未着手の問題がなくなりました。"
      : "問題データを読み込むか、開始方法を選んでください。";
    questionCategory.textContent = "学習状況";
    questionText.textContent = state.mode === "retryOnly"
      ? "復習対象が一時的に空です。通常ランダムで回すか、新しい誤答が出たら再びここに入ります。"
      : "ホームから最初から始めるか、保存文字列を読み込んでください。";
    choicesBox.innerHTML = "";
    answerFeedback.className = "feedbackBox";
    answerFeedback.innerHTML = "<p>保存文字列はこの画面でも出力できます。</p>";
    attemptHistory.innerHTML = "<p class='historyLine'>問題履歴は、解答するとここに表示されます。</p>";
    return;
  }

  const question = state.questionMap.get(state.currentQuestionId);
  const record = state.progress[question.id];
  const category = getCategoryLabel(question.id);

  questionTitle.textContent = `問題 ${question.id}`;
  questionMeta.textContent = `問題セット: ${QUESTION_SET_ID} / 番号: ${question.id}`;
  questionCategory.textContent = category;
  questionText.textContent = `${question.id}. ${question.question}`;

  choicesBox.innerHTML = "";

  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    const answerIndex = index + 1;
    button.className = "choiceButton";
    button.textContent = `${answerIndex}. ${choice}`;

    if (state.currentFeedback) {
      button.disabled = true;

      if (answerIndex === state.currentFeedback.correct) {
        button.classList.add("correct");
      }

      if (
        answerIndex === state.currentFeedback.chosen &&
        state.currentFeedback.chosen !== state.currentFeedback.correct
      ) {
        button.classList.add("wrong");
      }
    }

    button.addEventListener("click", () => handleAnswer(answerIndex));
    choicesBox.appendChild(button);
  });

  renderFeedback(question, record);
  renderAttemptHistory(record);
}

function renderFeedback(question, record) {
  if (!state.currentFeedback) {
    answerFeedback.className = "feedbackBox";
    answerFeedback.innerHTML = "<p>選択肢を押すと正誤が記録されます。</p>";
    return;
  }

  const latestAttempts = record ? record.attempts : [];
  const latest = latestAttempts[latestAttempts.length - 1];
  const title = state.currentFeedback.isCorrect ? "○ 正解" : "× 不正解";
  const detail = state.currentFeedback.isCorrect
    ? "この問題は今回正解として記録しました。"
    : `正解は ${question.answer}. ${question.choices[question.answer - 1]} です。`;

  answerFeedback.className = state.currentFeedback.isCorrect ? "feedbackBox ok" : "feedbackBox ng";
  answerFeedback.innerHTML = `
    <p><strong>${title}</strong></p>
    <p>${detail}</p>
    <p>記録日: ${latest ? latest.date : "-"}</p>
    <div class="actionRow">
      <button id="nextQuestionButton" class="primaryButton">次の問題へ</button>
    </div>
  `;

  document
    .getElementById("nextQuestionButton")
    .addEventListener("click", goToNextQuestion);
}

function renderAttemptHistory(record) {
  if (!record || record.attempts.length === 0) {
    attemptHistory.innerHTML = "<p class='historyLine'>まだ解いていません。</p>";
    return;
  }

  const lines = record.attempts
    .map((attempt, index) => `${index + 1}. ${attempt.date} ${attempt.result}`)
    .join("<br>");

  attemptHistory.innerHTML = `
    <p class="historyLine"><strong>直近${record.attempts.length}回の履歴</strong></p>
    <p class="historyLine">${lines}</p>
    <p class="historyLine">累計: ${record.totalCorrect} / ${record.totalAnswers} 正解</p>
  `;
}

function renderStudySummary() {
  const totalCount = state.questions.length;
  const attemptedCount = Object.values(state.progress).filter(record => record.totalAnswers > 0).length;
  const totals = getOverallTotals();
  const eligibleCount = getEligibleQuestionIds().length;
  const wrongCount = getLatestWrongIds().length;

  progressValue.textContent = `${attemptedCount} / ${totalCount || 0}`;
  accuracyValue.textContent = totals.totalAnswers === 0
    ? "0%"
    : `${Math.round((totals.totalCorrect / totals.totalAnswers) * 1000) / 10}%`;
  wrongValue.textContent = String(wrongCount);
  remainingValue.textContent = String(eligibleCount);
}

function renderManualControls() {
  const isManual = state.mode === "manual";
  manualControls.classList.toggle("active", isManual);

  if (!isManual) {
    return;
  }

  populateQuestionSelect();
  questionSelect.value = String(state.currentQuestionId || state.manualStartQuestionId || 1);
  prevQuestionButton.disabled = !getAdjacentQuestionId(state.currentQuestionId, -1);
  nextQuestionButtonTop.disabled = !getAdjacentQuestionId(state.currentQuestionId, 1);
}

function populateQuestionSelect() {
  questionSelect.innerHTML = "";

  state.questions.forEach(question => {
    const option = document.createElement("option");
    option.value = String(question.id);
    option.textContent = `${question.id}. ${trimText(question.question, 34)}`;
    questionSelect.appendChild(option);
  });
}

function jumpToQuestion(questionId) {
  const resolvedId = resolveManualQuestionId(questionId);

  if (!resolvedId) {
    return;
  }

  state.currentFeedback = null;
  state.currentQuestionId = resolvedId;
  state.manualStartQuestionId = resolvedId;
  manualStartNumber.value = String(resolvedId);
  updateSaveOutput();
  renderStudy();
}

function moveManualQuestion(step) {
  const nextId = getAdjacentQuestionId(state.currentQuestionId, step);

  if (!nextId) {
    return;
  }

  jumpToQuestion(nextId);
}

function getAdjacentQuestionId(questionId, step) {
  const questionIds = state.questions.map(question => question.id);
  const currentIndex = questionIds.indexOf(questionId);

  if (currentIndex === -1) {
    return null;
  }

  return questionIds[currentIndex + step] || null;
}

function resolveManualQuestionId(questionId) {
  const numericId = Number(questionId);

  if (state.questionMap.has(numericId)) {
    return numericId;
  }

  return state.questions.length > 0 ? state.questions[0].id : null;
}

function getManualStartInputValue() {
  const numericId = Number(manualStartNumber.value);
  return resolveManualQuestionId(numericId);
}

function getModeLabel(mode) {
  if (mode === "retryOnly") {
    return "復習ランダム";
  }

  if (mode === "manual") {
    return "番号で選ぶ";
  }

  return "通常ランダム";
}

function getOverallTotals() {
  return Object.values(state.progress).reduce(
    (totals, record) => {
      totals.totalAnswers += record.totalAnswers || 0;
      totals.totalCorrect += record.totalCorrect || 0;
      return totals;
    },
    { totalAnswers: 0, totalCorrect: 0 }
  );
}

function getLatestWrongIds() {
  return state.questions
    .map(question => question.id)
    .filter(questionId => {
      const record = state.progress[questionId];
      if (!record || record.attempts.length === 0) {
        return false;
      }

      return record.attempts[record.attempts.length - 1].result === "×";
    });
}

function renderAnalysis() {
  if (!state.categoryConfig) {
    return;
  }

  const stats = buildCategoryStats();
  renderRadar(stats);
  renderCategoryTable(stats);
  renderWrongList();
}

function renderProblemList() {
  if (!problemListTable) {
    return;
  }

  const rows = state.questions.map(question => {
    const record = state.progress[question.id];
    const latest = getLatestAttempt(record);

    return {
      id: question.id,
      category: getCategoryLabel(question.id),
      latest,
      correctHistory: getResultHistory(record, "○"),
      wrongHistory: getResultHistory(record, "×")
    };
  });

  const solvedCount = rows.filter(row => row.latest && row.latest.result === "○").length;
  const wrongCount = rows.filter(row => row.latest && row.latest.result === "×").length;
  const untouchedCount = rows.filter(row => !row.latest).length;

  listSolvedCount.textContent = String(solvedCount);
  listWrongCount.textContent = String(wrongCount);
  listUntouchedCount.textContent = String(untouchedCount);

  if (rows.length === 0) {
    problemListTable.innerHTML = "<div class='emptyListState'>問題データがありません。</div>";
    return;
  }

  problemListTable.innerHTML = rows.map(row => renderProblemListRow(row)).join("");
}

function renderProblemListRow(row) {
  const latestLabel = row.latest
    ? `${row.latest.date} ${row.latest.result}`
    : "未着手";
  const latestClass = !row.latest
    ? "noneTag"
    : row.latest.result === "○"
      ? "okTag"
      : "ngTag";
  const solvedClass = row.latest && row.latest.result === "○" ? " isSolved" : "";

  return `
    <div class="problemListRow${solvedClass}">
      <div class="numberCell">
        <span class="numberChip">${row.id}</span>
      </div>
      <div class="genreCell">
        <strong>${row.category}</strong>
        <span class="genreSub">問題 ${row.id}</span>
      </div>
      <div class="datesCell">
        <span class="datesMeta">正解日 直近${row.correctHistory.length || 0}件</span>
        ${renderDateChips(row.correctHistory, "ok")}
      </div>
      <div class="datesCell">
        <span class="datesMeta">不正解日 直近${row.wrongHistory.length || 0}件</span>
        ${renderDateChips(row.wrongHistory, "ng")}
      </div>
      <div class="statusCell">
        <span class="statusTag ${latestClass}">${latestLabel}</span>
      </div>
    </div>
  `;
}

function renderDateChips(dates, type) {
  if (!dates || dates.length === 0) {
    return "<span class='datesEmpty'>記録なし</span>";
  }

  const className = type === "ok" ? "okChip" : "ngChip";
  return `
    <div class="dateChips">
      ${dates
        .slice()
        .reverse()
        .map(date => `<span class="dateChip ${className}">${date}</span>`)
        .join("")}
    </div>
  `;
}

function buildCategoryStats() {
  return state.categoryConfig.categories.map(category => {
    const questionIds = state.questions
      .filter(question => getCategoryLabel(question.id) === category)
      .map(question => question.id);

    const base = {
      category,
      totalQuestions: questionIds.length,
      attemptedQuestions: 0,
      totalAnswers: 0,
      totalCorrect: 0,
      latestWrong: 0
    };

    questionIds.forEach(questionId => {
      const record = state.progress[questionId];
      if (!record) {
        return;
      }

      if (record.totalAnswers > 0) {
        base.attemptedQuestions += 1;
      }

      base.totalAnswers += record.totalAnswers || 0;
      base.totalCorrect += record.totalCorrect || 0;

      if (record.attempts.length > 0 && record.attempts[record.attempts.length - 1].result === "×") {
        base.latestWrong += 1;
      }
    });

    return base;
  });
}

function renderCategoryTable(stats) {
  categoryTable.innerHTML = "";

  stats.forEach(item => {
    const row = document.createElement("div");
    const accuracy = item.totalAnswers === 0
      ? 0
      : Math.round((item.totalCorrect / item.totalAnswers) * 1000) / 10;

    row.className = "tableRow";
    row.innerHTML = `
      <strong>${item.category}</strong>
      <span>解いた問題数: ${item.attemptedQuestions} / ${item.totalQuestions}</span>
      <span>累計正解率: ${accuracy}% (${item.totalCorrect} / ${item.totalAnswers})</span>
      <span>直近不正解: ${item.latestWrong}問</span>
    `;

    categoryTable.appendChild(row);
  });
}

function renderWrongList() {
  const wrongIds = getLatestWrongIds();
  wrongList.innerHTML = "";

  if (wrongIds.length === 0) {
    wrongList.innerHTML = "<div class='emptyState'>直近不正解の問題はありません。</div>";
    return;
  }

  wrongIds.forEach(questionId => {
    const question = state.questionMap.get(questionId);
    const record = state.progress[questionId];
    const latest = record.attempts[record.attempts.length - 1];
    const item = document.createElement("div");

    item.className = "wrongItem";
    item.innerHTML = `
      <strong>問題 ${questionId} / ${getCategoryLabel(questionId)}</strong>
      <span>${question.question}</span>
      <span>直近記録: ${latest.date} ${latest.result}</span>
    `;

    wrongList.appendChild(item);
  });
}

function renderRadar(stats) {
  const width = 360;
  const height = 360;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 108;
  const levels = 4;

  const axes = stats.map((item, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / stats.length;
    return {
      item,
      angle,
      outerX: centerX + Math.cos(angle) * radius,
      outerY: centerY + Math.sin(angle) * radius
    };
  });

  const ringLines = Array.from({ length: levels }, (_, ringIndex) => {
    const ringRadius = radius * ((ringIndex + 1) / levels);
    return polygonPoints(
      axes.map(axis => ({
        x: centerX + Math.cos(axis.angle) * ringRadius,
        y: centerY + Math.sin(axis.angle) * ringRadius
      }))
    );
  }).map(points => `<polygon points="${points}" fill="none" stroke="rgba(111,101,87,0.22)" stroke-width="1"></polygon>`).join("");

  const axisLines = axes
    .map(axis => `<line x1="${centerX}" y1="${centerY}" x2="${axis.outerX}" y2="${axis.outerY}" stroke="rgba(111,101,87,0.28)" stroke-width="1"></line>`)
    .join("");

  const solvedPolygon = polygonPoints(
    axes.map(axis => {
      const ratio = axis.item.totalQuestions === 0 ? 0 : axis.item.attemptedQuestions / axis.item.totalQuestions;
      return {
        x: centerX + Math.cos(axis.angle) * radius * ratio,
        y: centerY + Math.sin(axis.angle) * radius * ratio
      };
    })
  );

  const accuracyPolygon = polygonPoints(
    axes.map(axis => {
      const ratio = axis.item.totalAnswers === 0 ? 0 : axis.item.totalCorrect / axis.item.totalAnswers;
      return {
        x: centerX + Math.cos(axis.angle) * radius * ratio,
        y: centerY + Math.sin(axis.angle) * radius * ratio
      };
    })
  );

  const labels = axes.map(axis => {
    const labelX = centerX + Math.cos(axis.angle) * (radius + 34);
    const labelY = centerY + Math.sin(axis.angle) * (radius + 34);
    const lines = splitCategoryLabel(axis.item.category);
    return `
      <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#6f6557">
        ${lines.map((line, index) => `<tspan x="${labelX}" dy="${index === 0 ? 0 : 14}">${line}</tspan>`).join("")}
      </text>
    `;
  }).join("");

  radarChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="22" fill="#fffaf2"></rect>
    ${ringLines}
    ${axisLines}
    <polygon points="${solvedPolygon}" fill="rgba(180,79,43,0.24)" stroke="rgba(180,79,43,0.9)" stroke-width="2"></polygon>
    <polygon points="${accuracyPolygon}" fill="rgba(51,107,92,0.18)" stroke="rgba(51,107,92,0.95)" stroke-width="2"></polygon>
    ${labels}
    <text x="20" y="26" font-size="11" fill="#6f6557">解答数比率は分類内で何問触ったか、正答率は累計正解率です。</text>
  `;
}

function polygonPoints(points) {
  return points.map(point => `${point.x},${point.y}`).join(" ");
}

function getCategoryLabel(questionId) {
  if (!state.categoryConfig) {
    return "未分類";
  }

  const found = state.categoryConfig.ranges.find(range => {
    return range.start <= questionId && questionId <= range.end;
  });

  return found ? found.category : "未分類";
}

function splitCategoryLabel(label) {
  if (label === "法令上の制限") {
    return ["法令上の", "制限"];
  }

  if (label === "税・価格") {
    return ["税・", "価格"];
  }

  return [label];
}

function updateSaveOutput() {
  const payload = {
    version: SAVE_VERSION,
    setId: QUESTION_SET_ID,
    mode: state.mode,
    currentQuestionId: state.currentQuestionId,
    manualStartQuestionId: state.manualStartQuestionId,
    updatedAt: formatDate(new Date()),
    progress: state.progress
  };

  const json = JSON.stringify(payload);
  saveOutput.value = encodeText(json);
}

function parseSaveString(raw) {
  let payload;

  try {
    payload = JSON.parse(decodeText(raw));
  } catch (error) {
    throw new Error("保存文字列を読み込めませんでした。形式を確認してください。");
  }

  if (payload.version !== SAVE_VERSION) {
    throw new Error("保存文字列のバージョンが違います。最新版で作成した文字列を使ってください。");
  }

  if (payload.setId !== QUESTION_SET_ID) {
    throw new Error("別の問題セット用の保存文字列です。");
  }

  return payload;
}

function normalizeProgress(progress) {
  const normalized = {};

  Object.entries(progress).forEach(([questionId, record]) => {
    const numericId = Number(questionId);

    if (!state.questionMap.has(numericId)) {
      return;
    }

    const attempts = Array.isArray(record.attempts)
      ? record.attempts
          .slice(-MAX_ATTEMPTS)
          .map(attempt => ({
            date: typeof attempt.date === "string" ? attempt.date : formatDate(new Date()),
            result: attempt.result === "○" ? "○" : "×"
          }))
      : [];

    const totalAnswers = Number(record.totalAnswers) || attempts.length;
    const totalCorrect = Number(record.totalCorrect) || attempts.filter(attempt => attempt.result === "○").length;
    const correctHistory = Array.isArray(record.correctHistory)
      ? record.correctHistory.slice(-MAX_ATTEMPTS)
      : attempts.filter(attempt => attempt.result === "○").map(attempt => attempt.date).slice(-MAX_ATTEMPTS);
    const wrongHistory = Array.isArray(record.wrongHistory)
      ? record.wrongHistory.slice(-MAX_ATTEMPTS)
      : attempts.filter(attempt => attempt.result === "×").map(attempt => attempt.date).slice(-MAX_ATTEMPTS);

    normalized[numericId] = {
      attempts,
      correctHistory,
      wrongHistory,
      totalAnswers,
      totalCorrect,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : ""
    };
  });

  return normalized;
}

function encodeText(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeText(text) {
  return decodeURIComponent(escape(atob(text)));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getLatestAttempt(record) {
  if (!record || !Array.isArray(record.attempts) || record.attempts.length === 0) {
    return null;
  }

  return record.attempts[record.attempts.length - 1];
}

function getResultHistory(record, result) {
  if (!record) {
    return [];
  }

  if (result === "○") {
    return Array.isArray(record.correctHistory) ? record.correctHistory : [];
  }

  return Array.isArray(record.wrongHistory) ? record.wrongHistory : [];
}

function trimText(text, maxLength) {
  return text.length > maxLength
    ? `${text.slice(0, maxLength)}...`
    : text;
}

init();
