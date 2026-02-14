export type StepStatus = 'passed' | 'failed' | 'skipped';
export type ScenarioStatus = 'passed' | 'failed' | 'skipped';

export interface Step {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
  status: StepStatus;
  duration: number; // ms
  error?: string;
}

export interface Scenario {
  id: string;
  name: string;
  status: ScenarioStatus;
  steps: Step[];
  tags: string[];
  duration: number;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  scenarios: Scenario[];
}

export interface TestRun {
  id: string;
  projectId: string;
  timestamp: string;
  environment: string;
  branch: string;
  duration: number;
  features: Feature[];
  summary: { passed: number; failed: number; skipped: number; total: number };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  runs: TestRun[];
}

function makeStep(keyword: Step['keyword'], text: string, status: StepStatus, duration: number, error?: string): Step {
  return { keyword, text, status, duration, ...(error ? { error } : {}) };
}

function makeScenario(id: string, name: string, steps: Step[], tags: string[] = []): Scenario {
  const status: ScenarioStatus = steps.some(s => s.status === 'failed') ? 'failed' : steps.some(s => s.status === 'skipped') ? 'skipped' : 'passed';
  return { id, name, status, steps, tags, duration: steps.reduce((a, s) => a + s.duration, 0) };
}

const now = Date.now();
const day = 86400000;

// Helper to generate dates going back
function daysAgo(n: number): string {
  return new Date(now - n * day).toISOString();
}

// ─── DOCMIND ────────────────────────────────────────────
const docmindRuns: TestRun[] = Array.from({ length: 14 }, (_, i) => {
  const d = 13 - i;
  const passRate = 0.82 + Math.random() * 0.15;
  const features: Feature[] = [
    {
      id: `dm-f1-${i}`, name: 'Document Upload', description: 'Upload and process documents',
      scenarios: [
        makeScenario(`dm-s1-${i}`, 'Upload PDF document', [
          makeStep('Given', 'I am logged in as an admin user', 'passed', 120),
          makeStep('When', 'I upload a PDF file "report.pdf"', 'passed', 340),
          makeStep('Then', 'the document should appear in my library', 'passed', 85),
          makeStep('And', 'the document status should be "Processing"', 'passed', 45),
        ], ['@smoke', '@upload']),
        makeScenario(`dm-s2-${i}`, 'Upload invalid file type', [
          makeStep('Given', 'I am logged in as a standard user', 'passed', 110),
          makeStep('When', 'I upload an executable file "malware.exe"', 'passed', 200),
          makeStep('Then', 'the system should reject the file', Math.random() > 0.3 ? 'passed' : 'failed', 90,
            Math.random() > 0.3 ? undefined : 'AssertionError: Expected status 400 but got 200'),
        ], ['@upload', '@security']),
        makeScenario(`dm-s3-${i}`, 'Bulk upload documents', [
          makeStep('Given', 'I have 10 documents ready to upload', 'passed', 50),
          makeStep('When', 'I select all documents and click "Upload All"', 'passed', 1200),
          makeStep('Then', 'all 10 documents should be queued for processing', Math.random() > 0.2 ? 'passed' : 'failed', 300,
            Math.random() > 0.2 ? undefined : 'TimeoutError: Upload queue did not process within 30s'),
        ], ['@upload', '@bulk']),
      ]
    },
    {
      id: `dm-f2-${i}`, name: 'AI Document Analysis', description: 'AI-powered document parsing and extraction',
      scenarios: [
        makeScenario(`dm-s4-${i}`, 'Extract text from scanned document', [
          makeStep('Given', 'a scanned invoice is uploaded', 'passed', 80),
          makeStep('When', 'the AI analysis completes', 'passed', 2500),
          makeStep('Then', 'the extracted text should match the original content', 'passed', 150),
          makeStep('And', 'confidence score should be above 95%', Math.random() > 0.15 ? 'passed' : 'failed', 30,
            Math.random() > 0.15 ? undefined : 'AssertionError: Confidence 87% < 95%'),
        ], ['@ai', '@ocr']),
        makeScenario(`dm-s5-${i}`, 'Classify document type automatically', [
          makeStep('Given', 'an unclassified document is in the queue', 'passed', 60),
          makeStep('When', 'the classification engine processes it', 'passed', 1800),
          makeStep('Then', 'the document should be tagged with the correct type', 'passed', 100),
        ], ['@ai', '@classification']),
      ]
    },
    {
      id: `dm-f3-${i}`, name: 'Search & Retrieval', description: 'Full-text search across documents',
      scenarios: [
        makeScenario(`dm-s6-${i}`, 'Search by keyword', [
          makeStep('Given', 'there are 100 documents in the library', 'passed', 40),
          makeStep('When', 'I search for "quarterly revenue"', 'passed', 350),
          makeStep('Then', 'I should see relevant results ranked by relevance', 'passed', 80),
        ], ['@search']),
        makeScenario(`dm-s7-${i}`, 'Filter search by date range', [
          makeStep('Given', 'I am on the search page', 'passed', 30),
          makeStep('When', 'I set the date range to "Last 30 days"', 'passed', 60),
          makeStep('And', 'I search for "contract"', 'passed', 280),
          makeStep('Then', 'only documents from the last 30 days should appear', d % 5 === 0 ? 'skipped' : 'passed', 90),
        ], ['@search', '@filter']),
      ]
    },
  ];
  const allScenarios = features.flatMap(f => f.scenarios);
  const passed = allScenarios.filter(s => s.status === 'passed').length;
  const failed = allScenarios.filter(s => s.status === 'failed').length;
  const skipped = allScenarios.filter(s => s.status === 'skipped').length;
  return {
    id: `dm-run-${i}`, projectId: 'docmind', timestamp: daysAgo(d),
    environment: i % 3 === 0 ? 'staging' : 'production', branch: 'main',
    duration: allScenarios.reduce((a, s) => a + s.duration, 0),
    features, summary: { passed, failed, skipped, total: allScenarios.length }
  };
});

// ─── FLIPPER AI ────────────────────────────────────────
const flipperRuns: TestRun[] = Array.from({ length: 14 }, (_, i) => {
  const d = 13 - i;
  const features: Feature[] = [
    {
      id: `fl-f1-${i}`, name: 'Card Flip Animation', description: 'Core card flip interactions',
      scenarios: [
        makeScenario(`fl-s1-${i}`, 'Flip card on click', [
          makeStep('Given', 'I am viewing a flashcard deck', 'passed', 80),
          makeStep('When', 'I click on a card', 'passed', 30),
          makeStep('Then', 'the card should flip with a smooth animation', 'passed', 200),
          makeStep('And', 'the back content should be visible', 'passed', 50),
        ], ['@animation', '@core']),
        makeScenario(`fl-s2-${i}`, 'Swipe to next card', [
          makeStep('Given', 'I am viewing the front of a card', 'passed', 60),
          makeStep('When', 'I swipe left', 'passed', 150),
          makeStep('Then', 'the next card should slide in', Math.random() > 0.25 ? 'passed' : 'failed', 180,
            Math.random() > 0.25 ? undefined : 'AnimationError: Swipe gesture not detected on touch device'),
        ], ['@animation', '@mobile']),
      ]
    },
    {
      id: `fl-f2-${i}`, name: 'AI Study Recommendations', description: 'AI-powered spaced repetition',
      scenarios: [
        makeScenario(`fl-s3-${i}`, 'Generate study schedule', [
          makeStep('Given', 'I have completed 50 flashcards', 'passed', 100),
          makeStep('When', 'I request a study plan', 'passed', 800),
          makeStep('Then', 'the AI should create a personalized schedule', 'passed', 200),
          makeStep('And', 'weak areas should be prioritized', 'passed', 50),
        ], ['@ai', '@scheduling']),
        makeScenario(`fl-s4-${i}`, 'Difficulty auto-adjustment', [
          makeStep('Given', 'I consistently answer "Photosynthesis" correctly', 'passed', 40),
          makeStep('When', 'the AI reviews my performance', 'passed', 600),
          makeStep('Then', 'the card should be moved to a longer review interval', Math.random() > 0.1 ? 'passed' : 'skipped', 80),
        ], ['@ai', '@adaptive']),
      ]
    },
    {
      id: `fl-f3-${i}`, name: 'Deck Management', description: 'Create and manage flashcard decks',
      scenarios: [
        makeScenario(`fl-s5-${i}`, 'Create new deck', [
          makeStep('Given', 'I am on the deck management page', 'passed', 50),
          makeStep('When', 'I click "New Deck" and enter "Biology 101"', 'passed', 120),
          makeStep('Then', 'a new empty deck should be created', 'passed', 80),
        ], ['@crud']),
        makeScenario(`fl-s6-${i}`, 'Import deck from CSV', [
          makeStep('Given', 'I have a CSV file with 200 cards', 'passed', 30),
          makeStep('When', 'I import the CSV file', 'passed', 500),
          makeStep('Then', 'all 200 cards should be added to the deck', Math.random() > 0.2 ? 'passed' : 'failed', 200,
            Math.random() > 0.2 ? undefined : 'ParseError: Invalid UTF-8 character at row 157'),
          makeStep('And', 'duplicate cards should be flagged', 'passed', 100),
        ], ['@import', '@csv']),
      ]
    },
  ];
  const allScenarios = features.flatMap(f => f.scenarios);
  const passed = allScenarios.filter(s => s.status === 'passed').length;
  const failed = allScenarios.filter(s => s.status === 'failed').length;
  const skipped = allScenarios.filter(s => s.status === 'skipped').length;
  return {
    id: `fl-run-${i}`, projectId: 'flipper-ai', timestamp: daysAgo(d),
    environment: i % 2 === 0 ? 'staging' : 'production', branch: i % 4 === 0 ? 'feature/ai-v2' : 'main',
    duration: allScenarios.reduce((a, s) => a + s.duration, 0),
    features, summary: { passed, failed, skipped, total: allScenarios.length }
  };
});

// ─── REAL RANDOM PORTAL ────────────────────────────────
const portalRuns: TestRun[] = Array.from({ length: 14 }, (_, i) => {
  const d = 13 - i;
  const features: Feature[] = [
    {
      id: `rr-f1-${i}`, name: 'Random Number Generation', description: 'True random number API',
      scenarios: [
        makeScenario(`rr-s1-${i}`, 'Generate random integer in range', [
          makeStep('Given', 'the API is available', 'passed', 50),
          makeStep('When', 'I request a random integer between 1 and 100', 'passed', 200),
          makeStep('Then', 'the response should contain a number in range [1, 100]', 'passed', 30),
          makeStep('And', 'the entropy source should be "quantum"', 'passed', 20),
        ], ['@api', '@core']),
        makeScenario(`rr-s2-${i}`, 'Generate random UUID', [
          makeStep('Given', 'the API is available', 'passed', 40),
          makeStep('When', 'I request a random UUID v4', 'passed', 150),
          makeStep('Then', 'the response should be a valid UUID v4 format', 'passed', 25),
        ], ['@api']),
        makeScenario(`rr-s3-${i}`, 'Rate limiting enforcement', [
          makeStep('Given', 'I have a free-tier API key', 'passed', 30),
          makeStep('When', 'I make 101 requests in one minute', 'passed', 3000),
          makeStep('Then', 'the 101st request should return 429 Too Many Requests', Math.random() > 0.15 ? 'passed' : 'failed', 50,
            Math.random() > 0.15 ? undefined : 'AssertionError: Expected 429 but received 200 - rate limiter not enforcing'),
        ], ['@api', '@security', '@ratelimit']),
      ]
    },
    {
      id: `rr-f2-${i}`, name: 'Developer Portal', description: 'API key management and docs',
      scenarios: [
        makeScenario(`rr-s4-${i}`, 'Register new developer account', [
          makeStep('Given', 'I am on the registration page', 'passed', 60),
          makeStep('When', 'I fill in valid details and submit', 'passed', 300),
          makeStep('Then', 'my account should be created', 'passed', 100),
          makeStep('And', 'I should receive a confirmation email', Math.random() > 0.3 ? 'passed' : 'failed', 2000,
            Math.random() > 0.3 ? undefined : 'TimeoutError: Email not received within 30s'),
        ], ['@portal', '@registration']),
        makeScenario(`rr-s5-${i}`, 'Generate API key', [
          makeStep('Given', 'I am logged into the developer portal', 'passed', 80),
          makeStep('When', 'I click "Generate New Key"', 'passed', 200),
          makeStep('Then', 'a new API key should be displayed', 'passed', 50),
          makeStep('And', 'the key should be masked after first view', 'passed', 30),
        ], ['@portal', '@apikey']),
      ]
    },
    {
      id: `rr-f3-${i}`, name: 'Usage Analytics', description: 'API usage tracking and reporting',
      scenarios: [
        makeScenario(`rr-s6-${i}`, 'View usage dashboard', [
          makeStep('Given', 'I have made 500 API calls this month', 'passed', 40),
          makeStep('When', 'I navigate to the usage dashboard', 'passed', 250),
          makeStep('Then', 'I should see a chart of my daily usage', 'passed', 150),
          makeStep('And', 'the total should show 500 calls', d % 7 === 0 ? 'skipped' : 'passed', 30),
        ], ['@analytics']),
      ]
    },
  ];
  const allScenarios = features.flatMap(f => f.scenarios);
  const passed = allScenarios.filter(s => s.status === 'passed').length;
  const failed = allScenarios.filter(s => s.status === 'failed').length;
  const skipped = allScenarios.filter(s => s.status === 'skipped').length;
  return {
    id: `rr-run-${i}`, projectId: 'real-random-portal', timestamp: daysAgo(d),
    environment: 'production', branch: 'main',
    duration: allScenarios.reduce((a, s) => a + s.duration, 0),
    features, summary: { passed, failed, skipped, total: allScenarios.length }
  };
});

export const projects: Project[] = [
  {
    id: 'docmind', name: 'Docmind', color: '#3b82f6',
    description: 'AI-powered document management and analysis platform',
    runs: docmindRuns,
  },
  {
    id: 'flipper-ai', name: 'Flipper AI', color: '#8b5cf6',
    description: 'Intelligent flashcard learning with AI-driven spaced repetition',
    runs: flipperRuns,
  },
  {
    id: 'real-random-portal', name: 'Real Random Portal', color: '#10b981',
    description: 'True random number generation API and developer portal',
    runs: portalRuns,
  },
];
