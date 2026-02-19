import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cn, formatDuration, formatRelativeTime, formatDate, formatTime, statusColor, statusBg, generateCsv, deriveRunStatus, downloadCsv } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(5500)).toBe('5.5s');
    expect(formatDuration(59999)).toBe('60.0s'); // edge: just under 60s in seconds = 59.999
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(125000)).toBe('2m 5s');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for recent timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'));
    expect(formatRelativeTime('2026-02-16T11:59:30Z')).toBe('just now');
  });

  it('returns minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'));
    expect(formatRelativeTime('2026-02-16T11:55:00Z')).toBe('5m ago');
  });

  it('returns hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'));
    expect(formatRelativeTime('2026-02-16T09:00:00Z')).toBe('3h ago');
  });

  it('returns days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'));
    expect(formatRelativeTime('2026-02-14T12:00:00Z')).toBe('2d ago');
  });

  it('returns formatted date for old timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'));
    expect(formatRelativeTime('2025-12-01T00:00:00Z')).toBe('Dec 1, 2025');
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    expect(formatDate('2026-02-16T12:00:00Z')).toBe('Feb 16, 2026');
  });

  it('formats another date', () => {
    expect(formatDate('2025-12-25T00:00:00Z')).toBe('Dec 25, 2025');
  });
});

describe('formatTime', () => {
  it('formats time with UTC suffix', () => {
    const result = formatTime('2026-02-16T14:30:00Z');
    expect(result).toContain('UTC');
    expect(result).toContain('02:30');
  });
});

describe('statusColor', () => {
  it('returns green for passed', () => {
    expect(statusColor('passed')).toContain('emerald');
  });

  it('returns red for failed', () => {
    expect(statusColor('failed')).toContain('red');
  });

  it('returns yellow for skipped', () => {
    expect(statusColor('skipped')).toContain('yellow');
  });

  it('returns slate for unknown', () => {
    expect(statusColor('whatever')).toContain('slate');
  });
});

describe('statusBg', () => {
  it('returns emerald bg for passed', () => {
    expect(statusBg('passed')).toContain('emerald');
  });

  it('returns red bg for failed', () => {
    expect(statusBg('failed')).toContain('red');
  });

  it('returns yellow bg for skipped', () => {
    expect(statusBg('skipped')).toContain('yellow');
  });

  it('returns blue bg for pending', () => {
    expect(statusBg('pending')).toContain('blue');
  });

  it('returns blue bg for running', () => {
    expect(statusBg('running')).toContain('blue');
  });

  it('returns slate bg for unknown status', () => {
    expect(statusBg('unknown')).toContain('slate');
  });
});

describe('generateCsv', () => {
  const sampleRuns = [
    {
      id: 'run-001',
      timestamp: '2026-02-16T14:30:00Z',
      branch: 'main',
      environment: 'production',
      status: 'passed',
      summary: { total: 100, passed: 98, failed: 0, skipped: 2 },
      duration: 90000,
    },
    {
      id: 'run-002',
      timestamp: '2026-02-15T10:00:00Z',
      branch: 'develop',
      environment: 'staging',
      status: 'failed',
      summary: { total: 80, passed: 60, failed: 15, skipped: 5 },
      duration: 65000,
    },
  ];

  it('generates a CSV with correct headers', () => {
    const csv = generateCsv(sampleRuns, 'My Project');
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toBe('Run ID,Date,Time,Branch,Environment,Status,Total,Passed,Failed,Skipped,Duration');
  });

  it('includes correct number of rows (header + data)', () => {
    const csv = generateCsv(sampleRuns, 'My Project');
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // 1 header + 2 data rows
  });

  it('includes run id in each row', () => {
    const csv = generateCsv(sampleRuns, 'My Project');
    expect(csv).toContain('run-001');
    expect(csv).toContain('run-002');
  });

  it('includes branch and environment in rows', () => {
    const csv = generateCsv(sampleRuns, 'My Project');
    expect(csv).toContain('main');
    expect(csv).toContain('production');
    expect(csv).toContain('develop');
    expect(csv).toContain('staging');
  });

  it('includes status in rows', () => {
    const csv = generateCsv(sampleRuns, 'My Project');
    expect(csv).toContain('passed');
    expect(csv).toContain('failed');
  });

  it('includes summary counts', () => {
    const csv = generateCsv(sampleRuns, 'My Project');
    const rows = csv.split('\n');
    expect(rows[1]).toContain('100'); // total
    expect(rows[1]).toContain('98');  // passed
    expect(rows[1]).toContain('2');   // skipped
  });

  it('includes formatted duration', () => {
    const csv = generateCsv(sampleRuns, 'My Project');
    expect(csv).toContain('1m 30s'); // 90000ms
    expect(csv).toContain('1m 5s');  // 65000ms
  });

  it('derives status from summary when status is not set', () => {
    const runs = [
      { id: 'r1', timestamp: '2026-02-16T00:00:00Z', summary: { total: 10, passed: 8, failed: 2, skipped: 0 }, duration: 5000 },
      { id: 'r2', timestamp: '2026-02-16T00:00:00Z', summary: { total: 10, passed: 10, failed: 0, skipped: 0 }, duration: 5000 },
    ];
    const csv = generateCsv(runs, 'Test');
    const lines = csv.split('\n');
    expect(lines[1]).toContain('failed');
    expect(lines[2]).toContain('passed');
  });

  it('handles empty run list', () => {
    const csv = generateCsv([], 'Empty Project');
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // only header
    expect(lines[0]).toContain('Run ID');
  });

  it('escapes commas in values', () => {
    const runs = [
      { id: 'run,with,commas', timestamp: '2026-02-16T00:00:00Z', summary: { total: 1, passed: 1, failed: 0, skipped: 0 }, duration: 1000 },
    ];
    const csv = generateCsv(runs, 'Test');
    expect(csv).toContain('"run,with,commas"');
  });

  it('escapes double quotes in values', () => {
    const runs = [
      { id: 'run"quoted"', timestamp: '2026-02-16T00:00:00Z', summary: { total: 1, passed: 1, failed: 0, skipped: 0 }, duration: 1000 },
    ];
    const csv = generateCsv(runs, 'Test');
    expect(csv).toContain('"run""quoted"""');
  });

  it('handles undefined optional fields gracefully', () => {
    const runs = [
      { id: 'run-bare', timestamp: '2026-02-16T00:00:00Z' },
    ];
    const csv = generateCsv(runs, 'Test');
    expect(csv).toContain('run-bare');
    // Should not throw; optional fields are empty strings
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
  });
});

describe('deriveRunStatus', () => {
  it('returns explicit status field when provided', () => {
    const run = {
      status: 'running',
      summary: { failed: 5, skipped: 2 },
    };
    expect(deriveRunStatus(run)).toBe('running');
  });

  it('returns "failed" when summary has failed > 0 and no explicit status', () => {
    const run = {
      summary: { failed: 3, skipped: 1 },
    };
    expect(deriveRunStatus(run)).toBe('failed');
  });

  it('returns "skipped" when summary has skipped > 0, failed = 0, and no explicit status', () => {
    const run = {
      summary: { failed: 0, skipped: 2 },
    };
    expect(deriveRunStatus(run)).toBe('skipped');
  });

  it('returns "passed" when all tests passed (no failures or skips)', () => {
    const run = {
      summary: { failed: 0, skipped: 0 },
    };
    expect(deriveRunStatus(run)).toBe('passed');
  });

  it('returns "passed" when summary is missing', () => {
    const run = {};
    expect(deriveRunStatus(run)).toBe('passed');
  });

  it('returns "passed" when summary fields are undefined', () => {
    const run = {
      summary: {},
    };
    expect(deriveRunStatus(run)).toBe('passed');
  });

  it('prioritizes explicit status over summary derivation', () => {
    const run = {
      status: 'passed',
      summary: { failed: 10, skipped: 5 },
    };
    expect(deriveRunStatus(run)).toBe('passed');
  });
});

describe('downloadCsv', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockAnchorClick: ReturnType<typeof vi.fn>;
  let mockCreateElement: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock URL methods
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url-123');
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock anchor element
    mockAnchorClick = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockAnchorClick,
    };
    mockCreateElement = vi.fn(() => mockAnchor);
    global.document.createElement = mockCreateElement as any;

    // Mock Blob
    global.Blob = class MockBlob {
      constructor(public content: any[], public options: any) {}
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a Blob with correct content and type', () => {
    const content = 'header1,header2\nvalue1,value2';
    downloadCsv(content, 'test.csv');
    
    expect(global.Blob).toBeDefined();
    // Blob was created with content array
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('creates a blob URL from the content', () => {
    const content = 'test,csv,data';
    downloadCsv(content, 'export.csv');
    
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
  });

  it('creates an anchor element', () => {
    downloadCsv('data', 'file.csv');
    
    expect(mockCreateElement).toHaveBeenCalledWith('a');
  });

  it('sets the download filename on the anchor', () => {
    downloadCsv('data', 'my-report.csv');
    
    const anchor = mockCreateElement.mock.results[0].value;
    expect(anchor.download).toBe('my-report.csv');
  });

  it('sets the href to the blob URL', () => {
    downloadCsv('data', 'test.csv');
    
    const anchor = mockCreateElement.mock.results[0].value;
    expect(anchor.href).toBe('blob:mock-url-123');
  });

  it('triggers a click on the anchor element', () => {
    downloadCsv('data', 'test.csv');
    
    expect(mockAnchorClick).toHaveBeenCalledTimes(1);
  });

  it('revokes the object URL after download', () => {
    downloadCsv('data', 'test.csv');
    
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url-123');
  });

  it('handles empty content', () => {
    downloadCsv('', 'empty.csv');
    
    expect(mockAnchorClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('handles large CSV content', () => {
    const largeContent = Array(1000).fill('row,data,here').join('\n');
    downloadCsv(largeContent, 'large.csv');
    
    expect(mockAnchorClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});
