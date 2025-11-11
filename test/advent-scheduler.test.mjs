import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import test from 'node:test';

const TEST_TRACKER_FILE = 'test-advent-tracker.json';

/**
 * Helper function to load tracker data
 */
async function loadTracker(filename) {
  try {
    const data = await fs.readFile(filename, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

/**
 * Helper function to save tracker data
 */
async function saveTracker(filename, data) {
  await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Helper function to clean up test tracker file
 */
async function cleanupTestTracker() {
  try {
    await fs.unlink(TEST_TRACKER_FILE);
  } catch (error) {
    // File might not exist, that's fine
  }
}

test('advent scheduler: tracker file operations', async (t) => {
  await t.test('should create empty tracker if file does not exist', async () => {
    await cleanupTestTracker();
    const tracker = await loadTracker(TEST_TRACKER_FILE);
    assert.deepEqual(tracker, {});
  });

  await t.test('should save and load tracker data correctly', async () => {
    const testData = {
      '2025': [1, 2, 3],
      '2026': [1],
    };
    await saveTracker(TEST_TRACKER_FILE, testData);
    const loaded = await loadTracker(TEST_TRACKER_FILE);
    assert.deepEqual(loaded, testData);
  });

  await t.test('should track multiple days per year', async () => {
    const tracker = {
      '2025': [1, 5, 10, 15, 20, 25],
    };
    await saveTracker(TEST_TRACKER_FILE, tracker);
    const loaded = await loadTracker(TEST_TRACKER_FILE);
    assert.equal(loaded['2025'].length, 6);
    assert.ok(loaded['2025'].includes(1));
    assert.ok(loaded['2025'].includes(25));
  });

  // Cleanup
  await cleanupTestTracker();
});
