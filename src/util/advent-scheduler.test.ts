import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import test from 'node:test';
import { config } from '../env.js';

// Import after setting env var
const { loadTracker, saveTracker } = await import('./advent-scheduler.js');

async function cleanupTestTracker() {
  try {
    await fs.unlink(config.adventOfCodeTrackerPath);
  } catch (_error) {
    // File might not exist, that's fine
  }
}

test('advent scheduler: tracker file operations', async (t) => {
  await t.test('should create empty tracker if file does not exist', async () => {
    await cleanupTestTracker();
    const tracker = await loadTracker();
    assert.deepEqual(tracker, {});
  });

  await t.test('should save and load tracker data correctly', async () => {
    const testData = {
      '2025': [1, 2, 3],
      '2026': [1],
    };
    await saveTracker(testData);
    const loaded = await loadTracker();
    assert.deepEqual(loaded, testData);
  });

  await t.test('should track multiple days per year', async () => {
    const tracker = {
      '2025': [1, 5, 10, 15, 20, 25],
    };
    await saveTracker(tracker);
    const loaded = await loadTracker();
    assert.equal(loaded['2025'].length, 6);
    assert.ok(loaded['2025'].includes(1));
    assert.ok(loaded['2025'].includes(25));
  });

  // Cleanup
  await cleanupTestTracker();
});
