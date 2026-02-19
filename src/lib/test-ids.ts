/**
 * Test ID Constants for E2E Testing
 * 
 * Naming Convention:
 * - Use kebab-case for all test IDs
 * - Be descriptive: include component context and element purpose
 * - For dynamic IDs, use template format: `element-type-{id}`
 * 
 * Examples:
 * - Static: 'refresh-btn', 'theme-toggle-btn'
 * - Dynamic: 'project-card-{projectId}', 'run-row-{runId}'
 * - Contextual: 'scenario-filter-failed', 'feature-toggle-{index}'
 * 
 * Usage:
 * <button data-testid="refresh-btn">Refresh</button>
 * <div data-testid={`project-card-${project.id}`}>...</div>
 */

export const TEST_IDS = {
  // Header
  HEADER: {
    HOME_LINK: 'home-link',
    REFRESH_BTN: 'refresh-btn',
    THEME_TOGGLE_BTN: 'theme-toggle-btn',
  },
  
  // Project Cards
  PROJECT_CARD: (id: string) => `project-card-${id}`,
  
  // Recent Runs
  RECENT_RUNS: {
    RUN_ROW: (id: string) => `run-row-${id}`,
    SHOW_MORE_BTN: 'show-more-btn',
    FILTER_PILL: (status: string) => `filter-pill-${status}`,
  },
  
  // Summary Cards
  SUMMARY_CARD: (key: string) => `summary-card-${key}`,
  
  // Run Detail
  RUN_DETAIL: {
    RETRY_BTN: 'retry-btn',
    SCENARIO_FILTER: (status: string) => `scenario-filter-${status}`,
    FEATURE_TOGGLE: (index: number) => `feature-toggle-${index}`,
  },
  
  // Error States
  ERROR: {
    RETRY_BTN: 'error-retry-btn',
    TRY_AGAIN_BTN: 'error-try-again-btn',
    RELOAD_BTN: 'error-reload-btn',
  },
} as const;
