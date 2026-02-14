const { XMLParser } = require('fast-xml-parser');

/**
 * Parse Cucumber JSON format into our features/summary structure
 */
function parseCucumberJson(data) {
  const features = [];
  let passed = 0, failed = 0, skipped = 0, total = 0;

  for (const f of data) {
    const scenarios = [];
    for (const element of (f.elements || [])) {
      if (element.type !== 'scenario') continue;
      
      const steps = (element.steps || []).map(s => ({
        keyword: (s.keyword || '').trim(),
        text: s.name || '',
        status: s.result?.status || 'skipped',
        duration: Math.round((s.result?.duration || 0) / 1e6), // nanoseconds to ms
        error: s.result?.error_message || undefined,
      }));

      const scenarioStatus = steps.some(s => s.status === 'failed') ? 'failed'
        : steps.some(s => s.status === 'skipped' || s.status === 'undefined') ? 'skipped'
        : 'passed';

      total++;
      if (scenarioStatus === 'passed') passed++;
      else if (scenarioStatus === 'failed') failed++;
      else skipped++;

      scenarios.push({
        name: element.name || 'Unnamed Scenario',
        status: scenarioStatus,
        steps,
        tags: (element.tags || []).map(t => t.name),
        duration: steps.reduce((a, s) => a + s.duration, 0),
      });
    }

    features.push({
      name: f.name || 'Unnamed Feature',
      description: f.description || '',
      scenarios,
    });
  }

  return { features, summary: { passed, failed, skipped, total } };
}

/**
 * Parse JUnit XML format into our features/summary structure
 */
function parseJunitXml(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const parsed = parser.parse(xmlContent);
  
  const features = [];
  let passed = 0, failed = 0, skipped = 0, total = 0;

  // Handle both <testsuites> wrapper and single <testsuite>
  let suites = [];
  if (parsed.testsuites?.testsuite) {
    suites = Array.isArray(parsed.testsuites.testsuite) 
      ? parsed.testsuites.testsuite 
      : [parsed.testsuites.testsuite];
  } else if (parsed.testsuite) {
    suites = Array.isArray(parsed.testsuite) ? parsed.testsuite : [parsed.testsuite];
  }

  for (const suite of suites) {
    const scenarios = [];
    let testcases = suite.testcase || [];
    if (!Array.isArray(testcases)) testcases = [testcases];

    for (const tc of testcases) {
      total++;
      let status = 'passed';
      let error = undefined;

      if (tc.failure) {
        status = 'failed';
        failed++;
        error = typeof tc.failure === 'string' ? tc.failure : (tc.failure['@_message'] || tc.failure['#text'] || 'Test failed');
      } else if (tc.skipped !== undefined) {
        status = 'skipped';
        skipped++;
      } else {
        passed++;
      }

      scenarios.push({
        name: tc['@_name'] || 'Unnamed Test',
        status,
        steps: error ? [{ keyword: 'Then', text: tc['@_name'] || '', status, duration: 0, error }] : [],
        tags: [],
        duration: Math.round(parseFloat(tc['@_time'] || '0') * 1000),
      });
    }

    features.push({
      name: suite['@_name'] || 'Test Suite',
      description: '',
      scenarios,
    });
  }

  return { features, summary: { passed, failed, skipped, total } };
}

module.exports = { parseCucumberJson, parseJunitXml };
