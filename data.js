// ---- Brain Dominance Test content & config ----
// Quadrant meta
const QUADRANTS = {
  A: { name: "Analyst",   color: "#2E5FA3", tag: "Logical / Analytical",
       blurb: "Fact-based, quantitative, and precise. You like to analyze, measure, and reason your way to the bottom line.",
       strengths: "Problem-solving, critical analysis, technical & financial reasoning, clear logic." },
  B: { name: "Builder",   color: "#4C8C2B", tag: "Organized / Sequential",
       blurb: "Structured, detailed, and dependable. You like clear plans, proven procedures, and getting things done step by step.",
       strengths: "Planning, execution, reliability, follow-through, attention to detail." },
  C: { name: "Connector", color: "#C0392B", tag: "Interpersonal / Feeling",
       blurb: "People-oriented, empathetic, and expressive. You tune into how others feel and build strong relationships.",
       strengths: "Teamwork, empathy, communication, teaching, building consensus." },
  D: { name: "Dreamer",   color: "#E1A200", tag: "Holistic / Creative",
       blurb: "Imaginative, big-picture, and intuitive. You explore possibilities, connect ideas, and look to the future.",
       strengths: "Vision, innovation, synthesis, intuition, tolerating ambiguity." }
};

// 36 Likert items, 9 per quadrant
const LIKERT = {
  A: ["Do you like gathering information and researching various topics?",
      "Do you like classifying and categorizing information to make sense of it?",
      "Do you like building frameworks and models to analyze problems?",
      "Do you like to analyze, dissect, and solve problems?",
      "Do you like researching in a methodical and systematic manner?",
      "Do you like finding out the root causes of problems or situations?",
      "Do you like evaluating situations and making judgments based on facts, criteria, and logic?",
      "Do you like doing technical studies, feasibility studies, and similar work?",
      "Do you like studying how systems, organizations, or processes work?"],
  B: ["Do you like keeping detailed, organized notes?",
      "Do you like doing lab, office, or household work in a step-by-step manner?",
      "Do you like following manuals, instructions, and guidelines faithfully?",
      "Do you like coming up with action plans to implement things well?",
      "Do you like making schedules and following them as closely as possible?",
      "Do you like writing instructions, procedures, or to-do lists for getting things done?",
      "Do you like planning, organizing, and carrying out projects or assignments?",
      "Do you like building or assembling things by following precise steps (e.g., model kits, furniture, code)?",
      "Do you like keeping regular daily routines that you stick to?"],
  C: ["Do you enjoy sharing ideas and connecting with people?",
      "Do you like experiencing life through your senses (moving, feeling, touching, smelling, tasting)?",
      "Do you enjoy trips and outings with family and friends?",
      "Do you like attending parties, social events, or group gatherings?",
      "Do you quickly pick up on how other people are feeling?",
      "Do you enjoy teaching, tutoring, or mentoring other people?",
      "Do you tend to base decisions on people and values rather than only logic?",
      "Do you like joining drama, singing, or dance activities?",
      "Do you like traveling and meeting different kinds of people?"],
  D: ["Do you like grasping the whole picture before getting into the finer details?",
      "Do you usually take the initiative to start new projects or adventures?",
      "Do you enjoy exploring new possibilities and finding fresh ways to solve things?",
      "Do you like tackling complex issues and exploring the many ways to address them?",
      "Do you enjoy brainstorming and coming up with bold, unconventional ideas?",
      "Do you like expressing yourself creatively through art, design, or music?",
      "Do you like synthesizing different ideas into new frameworks or models?",
      "Do you rely on your intuition or gut feel when making decisions?",
      "Do you like imagining future possibilities and what could be?"]
};

// 24 forced-choice pairs (balanced: 4 per quadrant-pairing)
const FORCED = [
  ["Analyze the theory behind how something works","A","Follow a proven, step-by-step procedure","B"],
  ["Figure out why it works","A","Make sure it gets done on time and in order","B"],
  ["Understand the underlying principle","A","Have a clear, ordered checklist","B"],
  ["Question whether the data is sound","A","Make sure the steps are followed correctly","B"],
  ["Decide based on facts and logic","A","Decide based on people and feelings","C"],
  ["Analytical and objective","A","Warm and empathetic","C"],
  ["Solve it with logic","A","Solve it by talking it through with people","C"],
  ["Precise and matter-of-fact","A","Expressive and supportive","C"],
  ["Logical and factual","A","Imaginative and big-picture","D"],
  ["Focus on the details of the data","A","Focus on the overall vision","D"],
  ["Break the problem into parts","A","See how everything connects","D"],
  ["Rely on proven facts","A","Rely on hunches and possibilities","D"],
  ["Well-organized and detailed","B","People-focused and supportive","C"],
  ["Stick to the plan","B","Keep everyone comfortable and included","C"],
  ["Get the details right","B","Get everyone on board","C"],
  ["Value order and structure","B","Value harmony and relationships","C"],
  ["Prefer things planned and predictable","B","Prefer things open and full of possibility","D"],
  ["Follow the established method","B","Invent a new approach","D"],
  ["One step at a time","B","Many ideas at once","D"],
  ["Keep things safe and predictable","B","Try something bold and new","D"],
  ["Connect with people emotionally","C","Explore new ideas and concepts","D"],
  ["Warm and people-oriented","C","Visionary and idea-driven","D"],
  ["Tune into how people feel","C","Tune into new concepts and patterns","D"],
  ["Build relationships","C","Generate big ideas","D"]
];

// Scoring weights (must sum to 1). Tune to taste.
const WEIGHTS = { likert: 0.5, forced: 0.5 };

const PARTICIPANT_FIELDS = ["Name","Position","Branch / Department","Age","Gender","Tenure in the company"];

// Minimal geometric icons for each quadrant (inherit currentColor)
const QICON = {
  A: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20V13M22 20H2"/></svg>`,
  B: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  C: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8.5" cy="9" r="4.5"/><circle cx="15.5" cy="15" r="4.5"/></svg>`,
  D: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/></svg>`
};


// Paste your Google Apps Script Web App URL here to save each submission to a Google Sheet.
// Leave as "" to keep everything local (nothing leaves the browser). See google-apps-script.gs + README.
const SHEET_ENDPOINT = "";

// Companies for the "Company / Organization" dropdown. Add each client here so entries
// stay consistent (prevents "Bootleg" vs "CIA Bootleg" splits). You can also send a
// company-specific link that locks the value, e.g.  yoursite.vercel.app/?org=CIA%20Bootleg
const COMPANIES = [];  // empty = free-text company box (people type anything)
