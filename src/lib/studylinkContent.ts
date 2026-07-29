export type CatalogResourceType =
  | 'Note'
  | 'PDF'
  | 'Podcast'
  | 'Video'
  | 'MCQ'
  | 'Past Paper'
  | 'Guide';

export type CatalogResource = {
  id: string;
  courseCode: string;
  title: string;
  type: CatalogResourceType;
  description: string;
  audience: string;
  usageNotes: string;
  duration?: string;
  url: string;
};

export type CatalogCourse = {
  id: number;
  code: string;
  title: string;
  category: string;
  school: string;
  program: string;
  description: string;
  level: string;
  deliveryMode: string;
  image: string;
  supportFocus: string;
  topics: string[];
  objectives: string[];
  aiPrompts: string[];
  resources: CatalogResource[];
};

export type StudyLinkAiResponse = {
  headline: string;
  explanation: string;
  nextSteps: string[];
  recommendedResources: CatalogResource[];
  peerAdvice: string;
};

type CourseSeed = Omit<CatalogCourse, 'resources'> & {
  noteTopics: string[];
  pdfTitles: string[];
  podcastTopics: string[];
  videoTopics: string[];
  mcqTopics: string[];
  paperTopics: string[];
};

const ENROLLMENT_STORAGE_KEY = 'studylink_supplemental_course_enrollments_v1';

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDataUrl(title: string, sections: string[]) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #111; background: #f9fafb; margin: 0; padding: 2rem; line-height: 1.6; }
  h1, h2 { color: #111; margin: 0 0 1rem; }
  h2 { margin-top: 1.5rem; }
  p { margin: 0 0 1rem; }
  ul { margin: 0 0 1rem 1.5rem; }
  pre { background: #fff; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${sections.map((section) => `<p>${escapeHtml(section).replace(/\n/g, '<br/>')}</p>`).join('')}
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function createResources(seed: CourseSeed): CatalogResource[] {
  const noteResources = seed.noteTopics.map((topic, index) => ({
    id: `${seed.code}-note-${index + 1}`,
    courseCode: seed.code,
    title: `${seed.code} Note ${index + 1}: ${topic}`,
    type: 'Note' as const,
    description: `Structured study notes for ${topic} in ${seed.title}.`,
    audience: `${seed.program} learners`,
    usageNotes: 'Read this before your discussion group and highlight weak areas.',
    url: buildDataUrl(`${seed.code} Study Note ${index + 1}`, [
      `Course: ${seed.title}`,
      `Topic: ${topic}`,
      '',
      'Summary:',
      `This note explains ${topic.toLowerCase()} with classroom examples, revision cues, and short self-check questions.`,
      '',
      'Key points:',
      `- What ${topic.toLowerCase()} means`,
      `- Why it matters in ${seed.code}`,
      `- Common exam traps and how to avoid them`,
      '',
      'Action steps:',
      '1. Read the summary and write the main idea in your own words.',
      '2. Share one question from this note with your study group.',
      '3. Use the self-check prompt below to verify your understanding.',
      '',
      'Self-check prompt:',
      `Explain ${topic.toLowerCase()} as if you were teaching it to someone who has not studied ${seed.code}.`,
    ]),
  }));

  const pdfResources = seed.pdfTitles.map((title, index) => ({
    id: `${seed.code}-pdf-${index + 1}`,
    courseCode: seed.code,
    title: `${seed.code} PDF ${index + 1}: ${title}`,
    type: 'PDF' as const,
    description: `${title} prepared for ${seed.title}.`,
    audience: 'All enrolled students',
    usageNotes: 'Keep this in your library for revision week and assignment planning.',
    url: buildDataUrl(`${seed.code} PDF Guide ${index + 1}`, [
      `Course: ${seed.title}`,
      `Guide: ${title}`,
      '',
      'What this PDF includes:',
      '- Core definitions and formula summaries',
      '- Worked examples with exam-style reasoning',
      '- Key points to review before the next tutorial',
      '',
      'How to use this PDF:',
      '1. Read the key definitions first.',
      '2. Follow the worked examples step by step.',
      '3. Highlight two concepts to ask your group about.',
    ]),
  }));

  const podcastResources = seed.podcastTopics.map((topic, index) => ({
    id: `${seed.code}-podcast-${index + 1}`,
    courseCode: seed.code,
    title: `${seed.code} Podcast ${index + 1}: ${topic}`,
    type: 'Podcast' as const,
    description: `Audio-style revision guide covering ${topic.toLowerCase()}.`,
    audience: 'Students revising beyond class hours',
    usageNotes: 'Play this to reinforce concepts before or after study sessions.',
    duration: '12-18 min',
    url: buildDataUrl(`${seed.code} Podcast Episode ${index + 1}`, [
      `Episode focus: ${topic}`,
      '',
      'Listen for:',
      '- Why this topic matters in class and exams',
      '- A student-friendly explanation with examples',
      '- Common mistakes to avoid',
      '- A useful application for group discussion',
      '',
      'Takeaway prompts:',
      '1. Explain the main idea in one sentence.',
      '2. Identify one example that helps you remember it.',
      '3. Ask your study group one follow-up question.',
    ]),
  }));

  const videoResources = seed.videoTopics.map((topic, index) => ({
    id: `${seed.code}-video-${index + 1}`,
    courseCode: seed.code,
    title: `${seed.code} Video Guide ${index + 1}: ${topic}`,
    type: 'Video' as const,
    description: `Visual explanation pack for ${topic.toLowerCase()}.`,
    audience: 'Visual learners',
    usageNotes: 'Use this after reading notes so the diagrams make more sense.',
    duration: '8-14 min',
    url: buildDataUrl(`${seed.code} Video Companion ${index + 1}`, [
      `Topic: ${topic}`,
      '',
      'What you will see:',
      '- A concept map of the topic',
      '- One worked example with step-by-step reasoning',
      '- Common mistakes and how to avoid them',
      '- A revision checklist for quick review',
      '',
      'How to use this video companion:',
      '1. Watch the example once.',
      '2. Pause and explain each step aloud.',
      '3. Combine it with your notes for deeper understanding.',
    ]),
  }));

  const mcqResources = seed.mcqTopics.map((topic, index) => ({
    id: `${seed.code}-mcq-${index + 1}`,
    courseCode: seed.code,
    title: `${seed.code} MCQ Drill ${index + 1}: ${topic}`,
    type: 'MCQ' as const,
    description: `Practice questions for ${topic.toLowerCase()} in ${seed.title}.`,
    audience: 'Students preparing for exams',
    usageNotes: 'Attempt these alone first, then review the reasoning with peers.',
    url: buildDataUrl(`${seed.code} MCQ Drill ${index + 1}`, [
      `Topic: ${topic}`,
      '',
      'Instructions:',
      '- Answer each question as if it were in an exam.',
      '- Mark whether you felt confident, unsure, or guessed.',
      '- Review the questions you missed or found difficult.',
      '',
      'Study tip:',
      'After completing this drill, return to the related notes and videos for the concepts that were weakest.',
    ]),
  }));

  const paperResources = seed.paperTopics.map((topic, index) => ({
    id: `${seed.code}-paper-${index + 1}`,
    courseCode: seed.code,
    title: `${seed.code} Past Paper ${index + 1}: ${topic}`,
    type: 'Past Paper' as const,
    description: `Exam-style practice paper focused on ${topic.toLowerCase()}.`,
    audience: 'Revision groups and independent learners',
    usageNotes: 'Use this after notes and MCQs to simulate real exam pressure.',
    url: buildDataUrl(`${seed.code} Past Paper ${index + 1}`, [
      `Focus area: ${topic}`,
      '',
      'Practice routine:',
      '- Set a timer.',
      '- Answer each question fully.',
      '- Compare your answers against the key points below.',
      '- Identify which concepts took the longest and revisit those resources.',
    ]),
  }));

  const guideResource: CatalogResource = {
    id: `${seed.code}-guide-1`,
    courseCode: seed.code,
    title: `${seed.code} Group Support Guide`,
    type: 'Guide',
    description: `Peer-support roadmap showing how to use StudyLink for ${seed.title}.`,
    audience: 'Students who feel stuck in the course',
    usageNotes: 'Start here if you do not know which resource to open first.',
    url: buildDataUrl(`${seed.code} Support Guide`, [
      `Support focus: ${seed.supportFocus}`,
      '',
      'Recommended order:',
      '1. Read one note that explains the key topic.',
      '2. Open a PDF summary for the same concept.',
      '3. Listen to a podcast episode to reinforce the idea.',
      '4. Attempt a MCQ drill to test understanding.',
      '5. Join a study group and ask StudyLink AI for the specific concept that still feels confusing.',
    ]),
  };

  return [
    ...noteResources,
    ...pdfResources,
    ...podcastResources,
    ...videoResources,
    ...mcqResources,
    ...paperResources,
    guideResource,
  ];
}

const courseSeeds: CourseSeed[] = [
  {
    id: 1,
    code: 'APT3060',
    title: 'Mobile Programming',
    category: 'Applied Computer Technology',
    school: 'School of Science and Technology',
    program: 'Applied Computer Technology',
    description: 'Design mobile learning experiences, connect APIs, manage storage, and build polished user interfaces.',
    level: 'Year 4',
    deliveryMode: 'Blended',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping students turn difficult mobile architecture concepts into practical revision steps.',
    topics: ['Android architecture basics', 'State management', 'API integration', 'Room storage', 'Testing and debugging'],
    objectives: ['Build stable mobile flows', 'Explain architecture patterns clearly', 'Prepare for implementation exams and demos'],
    aiPrompts: ['Explain MVVM in simple terms', 'Give me notes on Retrofit and Room', 'Create a quiz on lifecycle management'],
    noteTopics: ['MVVM and state management', 'Retrofit networking flow', 'Room database revision'],
    pdfTitles: ['Course outline and weekly plan', 'Mobile UI design checklist'],
    podcastTopics: ['Understanding mobile architecture without fear', 'How to remember API and storage workflows'],
    videoTopics: ['Lifecycle walkthrough', 'Navigation and state visual guide'],
    mcqTopics: ['Activity lifecycle', 'Data persistence'],
    paperTopics: ['Architecture patterns and debugging', 'API, storage, and UI integration'],
  },
  {
    id: 2,
    code: 'APT3025',
    title: 'Machine Learning',
    category: 'Applied Computer Technology',
    school: 'School of Science and Technology',
    program: 'Applied Computer Technology',
    description: 'Study supervised learning, evaluation, features, and model interpretation through practical academic use cases.',
    level: 'Year 4',
    deliveryMode: 'Online',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Making abstract AI and model-evaluation ideas easier to discuss and practice with peers.',
    topics: ['Regression', 'Classification', 'Model evaluation', 'Feature engineering', 'Bias and variance'],
    objectives: ['Interpret core ML models', 'Evaluate model performance', 'Revise AI concepts with confidence'],
    aiPrompts: ['Explain overfitting', 'Give me notes on confusion matrix', 'Create revision questions for regression'],
    noteTopics: ['Regression fundamentals', 'Classification and confusion matrix', 'Bias, variance, and model tuning'],
    pdfTitles: ['ML formulas quick sheet', 'Evaluation metrics handbook'],
    podcastTopics: ['Machine learning for non-experts', 'Remembering metrics before exams'],
    videoTopics: ['How supervised learning works', 'Visualizing underfitting and overfitting'],
    mcqTopics: ['Model evaluation', 'Feature engineering'],
    paperTopics: ['Regression and classification', 'Metrics and model improvement'],
  },
  {
    id: 3,
    code: 'CS201',
    title: 'Data Structures and Algorithms',
    category: 'Computer Science',
    school: 'School of Science and Technology',
    program: 'Computer Science',
    description: 'Learn arrays, linked structures, recursion, searching, sorting, and algorithmic problem solving.',
    level: 'Year 2',
    deliveryMode: 'In-Person',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Breaking down problem-solving anxiety through repeated guided practice.',
    topics: ['Arrays and linked lists', 'Stacks and queues', 'Trees and graphs', 'Sorting', 'Algorithm analysis'],
    objectives: ['Choose the right data structure', 'Trace algorithms correctly', 'Improve exam speed and logic'],
    aiPrompts: ['Teach me recursion', 'Give me tree traversal notes', 'Quiz me on Big O'],
    noteTopics: ['Recursion fundamentals', 'Tree traversal strategies', 'Big O analysis'],
    pdfTitles: ['Sorting algorithms cheat sheet', 'Data structure comparison table'],
    podcastTopics: ['How to think through algorithm questions', 'Beating recursion confusion'],
    videoTopics: ['Stack and queue visual explanation', 'Binary tree traversal animation guide'],
    mcqTopics: ['Algorithm complexity', 'Trees and graphs'],
    paperTopics: ['Sorting and searching', 'Recursion and complexity'],
  },
  {
    id: 4,
    code: 'BUS101',
    title: 'Introduction to Business',
    category: 'Business',
    school: 'School of Business',
    program: 'Business Administration',
    description: 'Understand entrepreneurship, operations, strategy, value creation, and business communication.',
    level: 'Year 1',
    deliveryMode: 'Blended',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping first-year business students connect theory to real commercial examples.',
    topics: ['Business environment', 'Entrepreneurship', 'Management functions', 'Marketing basics', 'Operations'],
    objectives: ['Explain core business terms', 'Analyze simple case studies', 'Present business ideas confidently'],
    aiPrompts: ['Summarize entrepreneurship', 'Help me understand management functions', 'Create case study questions'],
    noteTopics: ['Business environment basics', 'Entrepreneurship overview', 'Management functions'],
    pdfTitles: ['Business terms handbook', 'Case study analysis template'],
    podcastTopics: ['Business concepts in everyday language', 'Preparing for business presentations'],
    videoTopics: ['Management functions explained', 'Marketing mix visual summary'],
    mcqTopics: ['Entrepreneurship and strategy', 'Marketing principles'],
    paperTopics: ['Case study interpretation', 'Business environment and management'],
  },
  {
    id: 5,
    code: 'ACC210',
    title: 'Financial Accounting',
    category: 'Accounting',
    school: 'School of Business',
    program: 'Accounting and Finance',
    description: 'Practice journal entries, ledgers, trial balances, and statement preparation with clear accounting logic.',
    level: 'Year 2',
    deliveryMode: 'Lecture + Tutorial',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Reducing accounting panic by turning calculations into repeatable steps.',
    topics: ['Double entry', 'Ledgers', 'Trial balance', 'Income statement', 'Balance sheet'],
    objectives: ['Record transactions correctly', 'Prepare financial statements', 'Spot and correct accounting errors'],
    aiPrompts: ['Explain double entry simply', 'Give me ledger notes', 'Quiz me on trial balance'],
    noteTopics: ['Double entry rules', 'Trial balance preparation', 'Financial statements overview'],
    pdfTitles: ['Accounting formula sheet', 'Ledger practice pack'],
    podcastTopics: ['Understanding debits and credits', 'How to avoid accounting mistakes'],
    videoTopics: ['Ledger posting walkthrough', 'Statement preparation visual guide'],
    mcqTopics: ['Double entry', 'Statement interpretation'],
    paperTopics: ['Ledger and trial balance', 'Statement preparation'],
  },
  {
    id: 6,
    code: 'PHR220',
    title: 'Pharmacology Fundamentals',
    category: 'Pharmacy',
    school: 'School of Pharmacy',
    program: 'Pharmacy',
    description: 'Study drug actions, classifications, dosage concepts, and safe patient-centered pharmacology review.',
    level: 'Year 2',
    deliveryMode: 'Lab + Lecture',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping learners memorize pharmacology safely through grouped concepts and recall patterns.',
    topics: ['Pharmacokinetics', 'Pharmacodynamics', 'Drug classifications', 'Dosage concepts', 'Adverse effects'],
    objectives: ['Differentiate key drug actions', 'Revise mechanism and effect relationships', 'Prepare for safe clinical discussion'],
    aiPrompts: ['Explain pharmacokinetics', 'Give me notes on drug classification', 'Help me memorize adverse effects'],
    noteTopics: ['Pharmacokinetics summary', 'Pharmacodynamics essentials', 'Adverse effects revision'],
    pdfTitles: ['Drug classification handbook', 'Dosage revision summary'],
    podcastTopics: ['Memorizing pharmacology without overload', 'How to organize drug classes for exams'],
    videoTopics: ['ADME visual breakdown', 'Drug mechanism comparison'],
    mcqTopics: ['Drug classifications', 'Adverse effects'],
    paperTopics: ['Pharmacokinetics and dynamics', 'Classification and safety'],
  },
  {
    id: 7,
    code: 'NUR230',
    title: 'Medical-Surgical Nursing',
    category: 'Nursing',
    school: 'School of Pharmacy',
    program: 'Nursing',
    description: 'Develop patient-care planning, assessment, interventions, and clinical reasoning for adult care settings.',
    level: 'Year 3',
    deliveryMode: 'Clinical + Theory',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Supporting nursing students with structured care-plan thinking and fast recall.',
    topics: ['Assessment', 'Care planning', 'Common adult conditions', 'Interventions', 'Documentation'],
    objectives: ['Build sound care plans', 'Recognize common intervention priorities', 'Connect theory to ward practice'],
    aiPrompts: ['Help me write a care plan', 'Explain nursing interventions', 'Give me revision tips for adult care'],
    noteTopics: ['Patient assessment flow', 'Care plan writing', 'Intervention priorities'],
    pdfTitles: ['Care plan template', 'Adult care revision handbook'],
    podcastTopics: ['Thinking like a nurse in exams', 'Making care plans easier to remember'],
    videoTopics: ['Assessment sequence visual guide', 'Documentation and intervention review'],
    mcqTopics: ['Patient priorities', 'Care planning'],
    paperTopics: ['Adult care scenarios', 'Assessment and documentation'],
  },
  {
    id: 8,
    code: 'ENG201',
    title: 'Academic Writing',
    category: 'Communication',
    school: 'School of Humanities and Social Sciences',
    program: 'Communication and Writing Studies',
    description: 'Strengthen argument flow, citations, paragraphing, editing, and research-based academic expression.',
    level: 'Year 2',
    deliveryMode: 'Workshop',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping learners who struggle to turn ideas into well-structured academic writing.',
    topics: ['Essay structure', 'Paragraph unity', 'Research use', 'Referencing', 'Editing'],
    objectives: ['Plan clearer essays', 'Use sources well', 'Improve academic confidence and presentation'],
    aiPrompts: ['Show me essay structure notes', 'Explain referencing simply', 'Help me improve my paragraph flow'],
    noteTopics: ['Essay structure essentials', 'Referencing basics', 'Editing checklist'],
    pdfTitles: ['Academic writing starter pack', 'Citation and referencing guide'],
    podcastTopics: ['Writing strong paragraphs', 'How to beat essay-writing stress'],
    videoTopics: ['Essay planning map', 'Editing and proofreading workflow'],
    mcqTopics: ['Referencing', 'Argument structure'],
    paperTopics: ['Essay planning and citation', 'Editing and structure'],
  },
  {
    id: 9,
    code: 'PSY210',
    title: 'Developmental Psychology',
    category: 'Psychology',
    school: 'School of Humanities and Social Sciences',
    program: 'Psychology',
    description: 'Explore human development across stages, major theories, and behavior patterns in social contexts.',
    level: 'Year 2',
    deliveryMode: 'Blended',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Making theory-heavy psychology content easier to compare and remember.',
    topics: ['Childhood development', 'Adolescence', 'Adulthood', 'Major theorists', 'Social development'],
    objectives: ['Compare developmental theories', 'Explain stage-based changes', 'Link theory to behavior examples'],
    aiPrompts: ['Compare Piaget and Erikson', 'Give me notes on adolescence', 'Quiz me on developmental stages'],
    noteTopics: ['Piaget and Erikson comparison', 'Adolescence overview', 'Adult development summary'],
    pdfTitles: ['Developmental theory comparison chart', 'Stage-by-stage revision booklet'],
    podcastTopics: ['Remembering psychology theorists', 'How to compare development stages'],
    videoTopics: ['Theory comparison visual guide', 'Human development timeline'],
    mcqTopics: ['Developmental stages', 'Theory comparison'],
    paperTopics: ['Theorists and stages', 'Behavior and development'],
  },
  {
    id: 10,
    code: 'LAW110',
    title: 'Introduction to Constitutional Law',
    category: 'Law',
    school: 'School of Humanities and Social Sciences',
    program: 'Law',
    description: 'Study constitutional structure, rights, governance, and legal interpretation in civic contexts.',
    level: 'Year 1',
    deliveryMode: 'Lecture',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping students read legal ideas in simpler language before deeper case discussion.',
    topics: ['Sources of law', 'Separation of powers', 'Bill of rights', 'Judicial review', 'Constitutional interpretation'],
    objectives: ['Understand core constitutional structure', 'Explain rights clearly', 'Prepare for case and essay questions'],
    aiPrompts: ['Explain separation of powers', 'Give me notes on bill of rights', 'Help me revise judicial review'],
    noteTopics: ['Separation of powers', 'Bill of rights overview', 'Judicial review essentials'],
    pdfTitles: ['Constitutional principles booklet', 'Rights revision guide'],
    podcastTopics: ['Understanding constitutional law simply', 'How to answer legal essay questions'],
    videoTopics: ['Government structure visual guide', 'Rights and interpretation overview'],
    mcqTopics: ['Rights and freedoms', 'Legal interpretation'],
    paperTopics: ['Constitutional principles', 'Rights and judicial review'],
  },
];

const catalogCourses: CatalogCourse[] = courseSeeds.map((seed) => ({
  ...seed,
  resources: createResources(seed),
}));

export function getAllCatalogCourses() {
  return catalogCourses;
}

export function getCatalogCourseById(id?: string | number | null) {
  return catalogCourses.find((course) => String(course.id) === String(id) || course.code.toLowerCase() === String(id || '').toLowerCase()) || null;
}

export function getCatalogCourseByCode(code?: string | null) {
  return catalogCourses.find((course) => course.code.toLowerCase() === String(code || '').toLowerCase()) || null;
}

export function getAllCatalogResources() {
  return catalogCourses.flatMap((course) => course.resources);
}

export function getResourcesForCourse(code?: string | null) {
  return getCatalogCourseByCode(code)?.resources || [];
}

export function getCatalogSchools() {
  return Array.from(
    catalogCourses.reduce((map, course) => {
      const current = map.get(course.school) || { name: course.school, programs: new Set<string>(), courseCount: 0 };
      current.programs.add(course.program);
      current.courseCount += 1;
      map.set(course.school, current);
      return map;
    }, new Map<string, { name: string; programs: Set<string>; courseCount: number }>()),
  ).map(([, value]) => ({
    name: value.name,
    programCount: value.programs.size,
    courseCount: value.courseCount,
  }));
}

export function getProgramsForSchool(school?: string | null) {
  const matchedCourses = school
    ? catalogCourses.filter((course) => course.school === school)
    : catalogCourses;

  return Array.from(
    matchedCourses.reduce((map, course) => {
      const current = map.get(course.program) || { name: course.program, school: course.school, courseCount: 0 };
      current.courseCount += 1;
      map.set(course.program, current);
      return map;
    }, new Map<string, { name: string; school: string; courseCount: number }>()),
  ).map(([, value]) => value);
}

export function getSupplementalEnrollmentCodes() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(ENROLLMENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

export function saveSupplementalEnrollmentCode(code: string) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const current = new Set(getSupplementalEnrollmentCodes());
  current.add(code);
  localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(Array.from(current)));
}

export function buildMergedCourses(apiCourses: any[] = []) {
  const apiByCode = new Map(
    apiCourses
      .filter((course) => course?.code)
      .map((course) => [String(course.code).toLowerCase(), course]),
  );
  const supplementalEnrollments = new Set(getSupplementalEnrollmentCodes().map((code) => code.toLowerCase()));

  const mergedCatalogCourses = catalogCourses.map((catalogCourse) => {
    const apiCourse = apiByCode.get(catalogCourse.code.toLowerCase());
    return {
      id: apiCourse?.id ?? catalogCourse.code,
      code: catalogCourse.code,
      category: apiCourse?.category || catalogCourse.category,
      title: apiCourse?.title || catalogCourse.title,
      description: apiCourse?.description || catalogCourse.description,
      image: apiCourse?.image || catalogCourse.image,
      level: apiCourse?.level || catalogCourse.level,
      deliveryMode: apiCourse?.deliveryMode || catalogCourse.deliveryMode,
      enrolledCount: apiCourse?.enrolledCount ?? 0,
      relatedGroupCount: apiCourse?.relatedGroupCount ?? 0,
      upcomingSessionCount: apiCourse?.upcomingSessionCount ?? 0,
      isEnrolled: Boolean(apiCourse?.isEnrolled) || supplementalEnrollments.has(catalogCourse.code.toLowerCase()),
      school: catalogCourse.school,
      program: catalogCourse.program,
      supportFocus: catalogCourse.supportFocus,
      resourceCount: catalogCourse.resources.length,
      podcastCount: catalogCourse.resources.filter((resource) => resource.type === 'Podcast').length,
      pdfCount: catalogCourse.resources.filter((resource) => resource.type === 'PDF').length,
      noteCount: catalogCourse.resources.filter((resource) => resource.type === 'Note').length,
    };
  });

  const catalogCodes = new Set(mergedCatalogCourses.map((course) => course.code.toLowerCase()));
  const extraApiCourses = apiCourses
    .filter((course) => !catalogCodes.has(String(course.code || '').toLowerCase()))
    .map((course) => ({
      ...course,
      school: 'General',
      program: course.category || 'General Studies',
      supportFocus: 'Additional academic support within StudyLink.',
      resourceCount: 0,
      podcastCount: 0,
      pdfCount: 0,
      noteCount: 0,
    }));

  return [...mergedCatalogCourses, ...extraApiCourses].sort((left, right) => String(left.code).localeCompare(String(right.code)));
}

export function buildCourseContent(courseLike: { id?: string | number; code?: string; title?: string; category?: string; description?: string; image?: string; level?: string; deliveryMode?: string; enrolledCount?: number; isEnrolled?: boolean; students?: any[]; groups?: any[]; sessions?: any[] } | null) {
  const catalogCourse = getCatalogCourseByCode(courseLike?.code || '') || getCatalogCourseById(courseLike?.id);

  if (!catalogCourse && !courseLike) {
    return null;
  }

  const baseCode = courseLike?.code || catalogCourse?.code || 'COURSE';

  return {
    id: courseLike?.id ?? catalogCourse?.id ?? 0,
    code: baseCode,
    category: courseLike?.category || catalogCourse?.category || 'General',
    school: catalogCourse?.school || 'General',
    program: catalogCourse?.program || courseLike?.category || 'General Studies',
    title: courseLike?.title || catalogCourse?.title || 'Course Support Hub',
    description: courseLike?.description || catalogCourse?.description || 'A study support hub with notes, PDFs, podcasts, and revision guidance.',
    image: courseLike?.image || catalogCourse?.image || '',
    level: courseLike?.level || catalogCourse?.level || 'Year 1',
    deliveryMode: courseLike?.deliveryMode || catalogCourse?.deliveryMode || 'Blended',
    enrolledCount: courseLike?.enrolledCount ?? 0,
    isEnrolled: Boolean(courseLike?.isEnrolled) || getSupplementalEnrollmentCodes().map((item) => item.toLowerCase()).includes(baseCode.toLowerCase()),
    students: courseLike?.students || [],
    groups: courseLike?.groups || [],
    sessions: courseLike?.sessions || [],
    supportFocus: catalogCourse?.supportFocus || 'Peer-based academic support.',
    topics: catalogCourse?.topics || [],
    objectives: catalogCourse?.objectives || [],
    aiPrompts: catalogCourse?.aiPrompts || [],
    resources: catalogCourse?.resources || [],
  };
}

export function buildStudyLinkAiResponse(question: string, selectedCourseCode?: string | null): StudyLinkAiResponse {
  const normalizedQuestion = String(question || '').trim().toLowerCase();
  const selectedCourse = getCatalogCourseByCode(selectedCourseCode || '');
  const fallbackCourse = selectedCourse || catalogCourses.find((course) =>
    normalizedQuestion.includes(course.code.toLowerCase()) || normalizedQuestion.includes(course.title.toLowerCase()),
  ) || catalogCourses[0];

  const matchedTopics = fallbackCourse.topics.filter((topic) =>
    normalizedQuestion.split(/\W+/).some((part) => part && topic.toLowerCase().includes(part)),
  );
  const focusTopic = matchedTopics[0] || fallbackCourse.topics[0];
  const recommendedResources = fallbackCourse.resources.filter((resource) =>
    resource.title.toLowerCase().includes(focusTopic.toLowerCase().split(' ')[0]),
  ).slice(0, 4);

  const noteFallback = fallbackCourse.resources.filter((resource) => resource.type === 'Note').slice(0, 2);
  const finalResources = recommendedResources.length > 0 ? recommendedResources : noteFallback;

  return {
    headline: `${fallbackCourse.code}: ${focusTopic}`,
    explanation: `StudyLink AI recommends starting with ${focusTopic.toLowerCase()} in ${fallbackCourse.title}. Focus on the core definition, one worked example, and one common mistake before moving to MCQs or past papers.`,
    nextSteps: [
      `Read 1-2 notes for ${fallbackCourse.code} and write the main idea in your own words.`,
      `Open one PDF or guide for ${fallbackCourse.title} and extract the weekly or exam checklist.`,
      `Listen to a podcast or open a video companion so you can reinforce the same concept beyond class time.`,
      'Join a study group or ask a follow-up question with the exact concept that still feels confusing.',
    ],
    recommendedResources: finalResources,
    peerAdvice: `If this course feels difficult, do not study it alone. Use the notes first, then take the same topic into your StudyLink group discussion for faster understanding.`,
  };
}
