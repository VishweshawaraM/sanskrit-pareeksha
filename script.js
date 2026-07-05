/* ============================================================
   VISHWESHWARA SANSKRIT — ONLINE EXAMINATION LOGIC
   Pure vanilla JS — no frameworks
   ============================================================ */
(function(){
  "use strict";

  const STORAGE_KEY = "vsExam_v1";
  const EXAM_MINUTES = 45;

  /* ---------------------------------------------------------
     EXAM CONTENT — edit here to change questions
  --------------------------------------------------------- */
  const SECTIONS = [
    {
      id: "intro",
      eyebrow: "Section 1",
      title: "Introduction",
      dev: "परिचयः",
      marks: "5 × 5 = 25",
      instructions: "Write a short introduction about yourself in Sanskrit, in 4–5 lines. Include your name, place, and one sentence about your family or interests.",
      render: renderIntro
    },
    {
      id: "bodyparts",
      eyebrow: "Section 2",
      title: "Body Parts",
      dev: "शरीरावयवाः",
      marks: "10 × 1 = 10",
      instructions: "Look at each picture carefully and write its name in Sanskrit.",
      render: renderPicGrid,
      items: [
        { emoji: "👁️", caption: "Picture 1" },
        { emoji: "👂", caption: "Picture 2" },
        { emoji: "👃", caption: "Picture 3" },
        { emoji: "👄", caption: "Picture 4" },
        { emoji: "✋", caption: "Picture 5" },
        { emoji: "🦵", caption: "Picture 6" },
        { emoji: "☝️", caption: "Picture 7" },
        { emoji: "🦷", caption: "Picture 8" },
        { emoji: "👅", caption: "Picture 9" },
        { emoji: "😀", caption: "Picture 10" }
      ]
    },
    {
      id: "food",
      eyebrow: "Section 3",
      title: "Food Vocabulary",
      dev: "खाद्यपदार्थाः",
      marks: "10 × 1 = 10",
      instructions: "Look at each food item and write its Sanskrit name.",
      render: renderPicGrid,
      items: [
        { emoji: "🍎", caption: "Picture 1" },
        { emoji: "🍌", caption: "Picture 2" },
        { emoji: "🍚", caption: "Picture 3" },
        { emoji: "🥛", caption: "Picture 4" },
        { emoji: "💧", caption: "Picture 5" },
        { emoji: "🫓", caption: "Picture 6" },
        { emoji: "🥦", caption: "Picture 7" },
        { emoji: "🥭", caption: "Picture 8" },
        { emoji: "🥣", caption: "Picture 9" },
        { emoji: "🫙", caption: "Picture 10" }
      ]
    },
    {
      id: "numbers",
      eyebrow: "Section 4",
      title: "Numbers",
      dev: "संख्याः",
      marks: "10 × 1 = 10",
      instructions: "Count the objects in each picture and write the number in Sanskrit (either the numeral, e.g. ३, or the word, e.g. त्रीणि).",
      render: renderNumbers,
      items: [
        { emoji: "⭐", count: 3 },
        { emoji: "🌸", count: 5 },
        { emoji: "🍎", count: 7 },
        { emoji: "📚", count: 9 },
        { emoji: "🪔", count: 11 },
        { emoji: "🐦", count: 13 },
        { emoji: "🍃", count: 15 },
        { emoji: "🔔", count: 16 },
        { emoji: "🕯️", count: 18 },
        { emoji: "🪙", count: 20 }
      ]
    },
    {
      id: "gender",
      eyebrow: "Section 5",
      title: "Gender",
      dev: "लिङ्गम्",
      marks: "6 × 1 = 6",
      instructions: "Identify whether each word is Pullinga (पुल्लिङ्ग — masculine), Strilinga (स्त्रीलिङ्ग — feminine), or Napumsakalinga (नपुंसकलिङ्ग — neuter).",
      render: renderGender,
      items: [
        { emoji: "👦", word: "बालकः" },
        { emoji: "👧", word: "बालिका" },
        { emoji: "🌸", word: "पुष्पम्" },
        { emoji: "🌳", word: "वृक्षः" },
        { emoji: "🌿", word: "लता" },
        { emoji: "🍎", word: "फलम्" }
      ]
    },
    {
      id: "meaning",
      eyebrow: "Section 6",
      title: "Meaning in English",
      dev: "अर्थः",
      marks: "6 × 1 = 6",
      instructions: "Write the English meaning of each Sanskrit word, then write one example sentence in Sanskrit using that word.",
      render: renderMeaning,
      items: [
        { word: "पत्रम्" },
        { word: "पादः" },
        { word: "सरः" },
        { word: "प्रज्ञा" },
        { word: "वृक्षः" },
        { word: "गृहम्" }
      ]
    }
  ];

  /* ---------------------------------------------------------
     STATE
  --------------------------------------------------------- */
  let state = {
    student: null,
    answers: {},        // { sectionId: { qKey: value } }
    currentSection: 0,
    startedAt: null,
    secondsLeft: EXAM_MINUTES * 60
  };

  let timerInterval = null;

  /* ---------------------------------------------------------
     DOM REFS
  --------------------------------------------------------- */
  const screenHome = document.getElementById("screen-home");
  const screenExam = document.getElementById("screen-exam");
  const screenFinish = document.getElementById("screen-finish");
  const studentForm = document.getElementById("studentForm");
  const formError = document.getElementById("formError");

  const timerPill = document.getElementById("timerPill");
  const timerText = document.getElementById("timerText");
  const progressTrack = document.getElementById("progressTrack");
  const progressFill = document.getElementById("progressFill");

  const sectionNav = document.getElementById("sectionNav");
  const examCard = document.getElementById("examCard");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");
  const saveBtn = document.getElementById("saveBtn");
  const autosaveNote = document.getElementById("autosaveNote");

  const confirmModal = document.getElementById("confirmModal");
  const unansweredWarning = document.getElementById("unansweredWarning");
  const cancelSubmit = document.getElementById("cancelSubmit");
  const confirmSubmit = document.getElementById("confirmSubmit");

  const downloadBtn = document.getElementById("downloadBtn");

  /* ---------------------------------------------------------
     INIT — restore any saved progress
  --------------------------------------------------------- */
  function init(){
    const saved = loadState();
    if(saved && saved.student && !saved.submitted){
      state = Object.assign(state, saved);
      beginExamUI(false);
    }
    studentForm.addEventListener("submit", onStartExam);
    prevBtn.addEventListener("click", goPrev);
    nextBtn.addEventListener("click", goNext);
    saveBtn.addEventListener("click", ()=>{ persist(); flashAutosave(); });
    cancelSubmit.addEventListener("click", ()=> confirmModal.hidden = true);
    confirmSubmit.addEventListener("click", finalizeSubmit);
    submitBtn.addEventListener("click", openConfirm);
    downloadBtn.addEventListener("click", downloadSummary);
  }

  /* ---------------------------------------------------------
     HOMEPAGE → START EXAM
  --------------------------------------------------------- */
  function onStartExam(e){
    e.preventDefault();
    const fd = new FormData(studentForm);
    const student = {
      fullName: (fd.get("fullName")||"").trim(),
      age: (fd.get("age")||"").trim(),
      studentClass: (fd.get("studentClass")||"").trim(),
      parentName: (fd.get("parentName")||"").trim(),
      email: (fd.get("email")||"").trim(),
      phone: (fd.get("phone")||"").trim(),
      country: (fd.get("country")||"").trim()
    };
    const missing = Object.values(student).some(v => v === "");
    if(missing){
      formError.hidden = false;
      return;
    }
    formError.hidden = true;
    state.student = student;
    state.startedAt = Date.now();
    state.secondsLeft = EXAM_MINUTES * 60;
    state.currentSection = 0;
    state.answers = {};
    persist();
    beginExamUI(true);
  }

  function beginExamUI(fresh){
    screenHome.hidden = true;
    screenExam.hidden = false;
    timerPill.hidden = false;
    progressTrack.hidden = false;
    buildSectionNav();
    renderSection(state.currentSection);
    startTimer();
  }

  /* ---------------------------------------------------------
     TIMER
  --------------------------------------------------------- */
  function startTimer(){
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(()=>{
      state.secondsLeft--;
      if(state.secondsLeft <= 0){
        state.secondsLeft = 0;
        updateTimerDisplay();
        clearInterval(timerInterval);
        finalizeSubmit(true);
        return;
      }
      updateTimerDisplay();
      if(state.secondsLeft % 20 === 0) persist();
    }, 1000);
  }

  function updateTimerDisplay(){
    const m = Math.floor(state.secondsLeft/60).toString().padStart(2,"0");
    const s = (state.secondsLeft%60).toString().padStart(2,"0");
    timerText.textContent = `${m}:${s}`;
    timerPill.classList.toggle("warn", state.secondsLeft <= 300);
  }

  /* ---------------------------------------------------------
     SECTION NAV
  --------------------------------------------------------- */
  function buildSectionNav(){
    sectionNav.innerHTML = "";
    SECTIONS.forEach((sec, i)=>{
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "section-dot";
      dot.textContent = `${i+1}. ${sec.title}`;
      dot.addEventListener("click", ()=>{ persistCurrentAnswers(); state.currentSection = i; renderSection(i); });
      sectionNav.appendChild(dot);
    });
  }

  function refreshNavState(){
    [...sectionNav.children].forEach((dot, i)=>{
      dot.classList.toggle("active", i === state.currentSection);
      const answered = sectionAnsweredCount(i) > 0;
      dot.classList.toggle("done", answered && i !== state.currentSection);
    });
    const pct = ((state.currentSection) / (SECTIONS.length-1)) * 100;
    progressFill.style.width = pct + "%";
  }

  /* ---------------------------------------------------------
     RENDER SECTION
  --------------------------------------------------------- */
  function renderSection(index){
    const sec = SECTIONS[index];
    examCard.innerHTML = `
      <p class="section-eyebrow">${sec.eyebrow} &nbsp;·&nbsp; ${sec.marks}</p>
      <h2 class="section-title">${sec.title}<span class="dev">${sec.dev}</span></h2>
      <p class="section-instructions">${sec.instructions}</p>
      <div class="section-body" id="sectionBody"></div>
    `;
    const body = document.getElementById("sectionBody");
    body.innerHTML = sec.render(sec, getAnswers(sec.id));
    body.addEventListener("input", onAnswerInput);
    body.addEventListener("change", onAnswerInput);

    prevBtn.disabled = index === 0;
    const isLast = index === SECTIONS.length - 1;
    nextBtn.hidden = isLast;
    submitBtn.hidden = !isLast;
    refreshNavState();
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function onAnswerInput(e){
    const target = e.target.closest("[data-qkey]");
    if(!target) return;
    const sec = SECTIONS[state.currentSection];
    const qkey = target.dataset.qkey;
    if(!state.answers[sec.id]) state.answers[sec.id] = {};
    state.answers[sec.id][qkey] = target.value;
  }

  function getAnswers(sectionId){
    return state.answers[sectionId] || {};
  }

  function persistCurrentAnswers(){
    // inputs already live-bound via onAnswerInput; just persist to storage
    persist();
  }

  function sectionAnsweredCount(index){
    const sec = SECTIONS[index];
    const ans = state.answers[sec.id] || {};
    return Object.values(ans).filter(v => (v||"").trim() !== "").length;
  }

  /* ---------------------------------------------------------
     SECTION RENDERERS
  --------------------------------------------------------- */
  function renderIntro(sec, answers){
    const val = answers["line1"] || "";
    return `
      <div class="question-block">
        <div class="q-label"><span class="q-num">✎</span> Write your introduction in Sanskrit (4–5 lines)</div>
        <textarea data-qkey="line1" rows="7" placeholder="मम नाम ... अस्ति। अहं ... वसामि। ...">${escapeHtml(val)}</textarea>
      </div>
    `;
  }

  function renderPicGrid(sec, answers){
    return sec.items.map((item, i)=>{
      const key = "q"+i;
      const val = answers[key] || "";
      return `
        <div class="question-block">
          <div class="q-label"><span class="q-num">${i+1}</span> Write the Sanskrit name for this picture</div>
          <div class="illustration-card">
            <div class="illustration-visual" aria-hidden="true">${item.emoji}</div>
            <div class="illustration-answer">
              <input type="text" data-qkey="${key}" placeholder="संस्कृत नाम लिखत" value="${escapeAttr(val)}" aria-label="Sanskrit name for ${item.caption}">
              <span class="illustration-caption">${item.caption}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderNumbers(sec, answers){
    return sec.items.map((item, i)=>{
      const key = "q"+i;
      const val = answers[key] || "";
      const glyphs = item.emoji.repeat(item.count);
      return `
        <div class="question-block">
          <div class="q-label"><span class="q-num">${i+1}</span> How many are there? Write the number in Sanskrit</div>
          <div class="illustration-card">
            <div class="illustration-answer" style="flex:2">
              <div class="count-visual" aria-hidden="true">${glyphs}</div>
            </div>
            <div class="illustration-answer">
              <input type="text" data-qkey="${key}" placeholder="e.g. ३ or त्रीणि" value="${escapeAttr(val)}" aria-label="Sanskrit number">
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderGender(sec, answers){
    return sec.items.map((item, i)=>{
      const key = "q"+i;
      const val = answers[key] || "";
      const opts = [
        {v:"pullinga", label:"Pullinga", dev:"पुल्लिङ्ग"},
        {v:"strilinga", label:"Strilinga", dev:"स्त्रीलिङ्ग"},
        {v:"napumsaka", label:"Napumsaka", dev:"नपुंसकलिङ्ग"}
      ];
      return `
        <div class="question-block">
          <div class="q-label"><span class="q-num">${i+1}</span> Identify the gender</div>
          <div class="illustration-card">
            <div class="illustration-visual" aria-hidden="true">${item.emoji}</div>
            <div class="illustration-answer">
              <span class="illustration-caption" style="font-family:var(--font-dev);font-size:18px;color:var(--blue-deep)">${item.word}</span>
              <div class="gender-options" role="radiogroup" aria-label="Gender for ${item.word}">
                ${opts.map(o=>`
                  <div class="gender-opt">
                    <input type="radio" id="${sec.id}-${i}-${o.v}" name="${sec.id}-${i}" data-qkey="${key}" value="${o.v}" ${val===o.v?"checked":""}>
                    <label for="${sec.id}-${i}-${o.v}">${o.label} <span class="dev-tag">${o.dev}</span></label>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderMeaning(sec, answers){
    return sec.items.map((item, i)=>{
      const meaningKey = "meaning"+i;
      const exampleKey = "example"+i;
      const meaningVal = answers[meaningKey] || "";
      const exampleVal = answers[exampleKey] || "";
      return `
        <div class="question-block">
          <div class="q-label"><span class="q-num">${i+1}</span> Give the English meaning, then use the word in a Sanskrit sentence</div>
          <div class="meaning-row">
            <span class="meaning-word">${item.word}</span>
            <input type="text" data-qkey="${meaningKey}" placeholder="English meaning" value="${escapeAttr(meaningVal)}" aria-label="English meaning of ${item.word}">
          </div>
          <div class="example-block">
            <textarea data-qkey="${exampleKey}" rows="2" placeholder="Write one example sentence in Sanskrit using this word">${escapeHtml(exampleVal)}</textarea>
          </div>
        </div>
      `;
    }).join("");
  }

  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */
  function goPrev(){
    if(state.currentSection === 0) return;
    persist();
    state.currentSection--;
    renderSection(state.currentSection);
  }
  function goNext(){
    persist();
    if(state.currentSection < SECTIONS.length - 1){
      state.currentSection++;
      renderSection(state.currentSection);
    }
  }

  function flashAutosave(){
    autosaveNote.classList.add("show");
    setTimeout(()=> autosaveNote.classList.remove("show"), 1500);
  }

  /* ---------------------------------------------------------
     SUBMIT FLOW
  --------------------------------------------------------- */
  function totalUnanswered(){
    let total = 0, answered = 0;
    SECTIONS.forEach((sec, i)=>{
      const count = sec.items ? sec.items.length : 1;
      // meaning section has 2 fields per item
      const perItem = sec.id === "meaning" ? 2 : 1;
      total += count * perItem;
      answered += sectionAnsweredCount(i);
    });
    return { total, answered, unanswered: total - answered };
  }

  function openConfirm(){
    persist();
    const { unanswered } = totalUnanswered();
    if(unanswered > 0){
      unansweredWarning.hidden = false;
      unansweredWarning.textContent = `You have ${unanswered} unanswered question${unanswered===1?"":"s"}.`;
    } else {
      unansweredWarning.hidden = true;
    }
    confirmModal.hidden = false;
  }

  function finalizeSubmit(auto){
    confirmModal.hidden = true;
    clearInterval(timerInterval);
    persist();

    const ref = generateReference();
    const now = new Date();

    const record = {
      reference: ref,
      submittedAt: now.toISOString(),
      autoSubmitted: auto === true,
      student: state.student,
      answers: state.answers
    };
    saveSubmissionRecord(record);
    clearProgress();

    document.getElementById("finalName").textContent = state.student.fullName;
    document.getElementById("finalDate").textContent = now.toLocaleDateString();
    document.getElementById("finalTime").textContent = now.toLocaleTimeString();
    document.getElementById("finalRef").textContent = ref;

    screenExam.hidden = true;
    timerPill.hidden = true;
    progressTrack.hidden = true;
    screenFinish.hidden = false;
    window._vsLastRecord = record;
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function generateReference(){
    const d = new Date();
    const datePart = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
    const rand = Math.floor(1000 + Math.random()*9000);
    return `VS-${datePart}-${rand}`;
  }

  function downloadSummary(){
    const record = window._vsLastRecord;
    if(!record) return;
    let text = `VISHWESHWARA SANSKRIT — EXAMINATION SUMMARY\n`;
    text += `Reference Number: ${record.reference}\n`;
    text += `Submitted: ${new Date(record.submittedAt).toLocaleString()}\n\n`;
    text += `STUDENT DETAILS\n`;
    Object.entries(record.student).forEach(([k,v])=>{ text += `${k}: ${v}\n`; });
    text += `\nANSWERS\n`;
    SECTIONS.forEach(sec=>{
      text += `\n-- ${sec.title} (${sec.dev}) --\n`;
      const ans = record.answers[sec.id] || {};
      Object.entries(ans).forEach(([k,v])=>{ text += `${k}: ${v}\n`; });
    });
    const blob = new Blob([text], {type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------------------------------------------------------
     PERSISTENCE
  --------------------------------------------------------- */
  function persist(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(err){ /* storage unavailable — fail silently */ }
  }
  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(err){ return null; }
  }
  function clearProgress(){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(err){}
  }
  function saveSubmissionRecord(record){
    try{
      const key = "vsExam_submissions";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push(record);
      localStorage.setItem(key, JSON.stringify(list));
    }catch(err){}
  }

  /* ---------------------------------------------------------
     UTIL
  --------------------------------------------------------- */
  function escapeHtml(str){
    return (str||"").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  }
  function escapeAttr(str){
    return (str||"").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
