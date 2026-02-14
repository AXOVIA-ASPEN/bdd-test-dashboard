const db = require('./db');

const projects = [
  {
    id: 'docmind',
    name: 'Docmind',
    repo: 'Axovia-AI/docmind-ai',
    makeTarget: 'test-acceptance',
    color: '#3b82f6',
    description: 'AI-powered document management and analysis platform',
    tags: JSON.stringify(['smoke', 'upload', 'security', 'ai', 'ocr', 'classification', 'search', 'filter', 'bulk']),
  },
  {
    id: 'flipper-ai',
    name: 'Flipper AI',
    repo: 'AXOVIA-ASPEN/flipper-ai',
    makeTarget: 'test-acceptance',
    color: '#8b5cf6',
    description: 'Intelligent flashcard learning with AI-driven spaced repetition',
    tags: JSON.stringify(['smoke', 'animation', 'core', 'mobile', 'ai', 'scheduling', 'adaptive', 'crud', 'import', 'csv']),
  },
  {
    id: 'real-random-portal',
    name: 'Real Random Portal',
    repo: 'Silverline-Software/real-random-portal',
    makeTarget: 'test-acceptance',
    color: '#10b981',
    description: 'True random number generation API and developer portal',
    tags: JSON.stringify(['smoke', 'api', 'core', 'security', 'ratelimit', 'portal', 'registration', 'apikey', 'analytics']),
  },
];

const upsert = db.prepare(`
  INSERT OR REPLACE INTO projects (id, name, description, color, repo, makeTarget, tags)
  VALUES (@id, @name, @description, @color, @repo, @makeTarget, @tags)
`);

const tx = db.transaction(() => {
  for (const p of projects) upsert.run(p);
});

tx();
console.log(`Seeded ${projects.length} projects`);
