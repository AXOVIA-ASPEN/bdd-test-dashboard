import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase modules
const mockGetApps = vi.fn();
const mockInitializeApp = vi.fn();
const mockGetFirestore = vi.fn();

vi.mock('firebase/app', () => ({
  getApps: mockGetApps,
  initializeApp: mockInitializeApp,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
}));

describe('firebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('initializes a new app when no apps exist', async () => {
    const mockApp = { name: 'test-app' };
    const mockDb = { type: 'firestore' };
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetFirestore.mockReturnValue(mockDb);

    const { getDb } = await import('./firebase');
    const db = getDb();

    expect(mockInitializeApp).toHaveBeenCalledOnce();
    expect(mockGetFirestore).toHaveBeenCalledWith(mockApp);
    expect(db).toBe(mockDb);
  });

  it('reuses existing app when one already exists', async () => {
    const mockApp = { name: 'existing-app' };
    const mockDb = { type: 'firestore' };
    mockGetApps.mockReturnValue([mockApp]);
    mockGetFirestore.mockReturnValue(mockDb);

    const { getDb } = await import('./firebase');
    const db = getDb();

    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetFirestore).toHaveBeenCalledWith(mockApp);
    expect(db).toBe(mockDb);
  });

  it('exports firebaseConfig with correct projectId', async () => {
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({});
    mockGetFirestore.mockReturnValue({});

    const { firebaseConfig } = await import('./firebase');
    expect(firebaseConfig.projectId).toBe('silverline-bdd-test-dashboard');
    expect(firebaseConfig.authDomain).toBe('silverline-bdd-test-dashboard.firebaseapp.com');
  });
});
