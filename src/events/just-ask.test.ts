import assert from 'node:assert';
import { describe, it } from 'node:test';
import { isAskingToAsk } from './just-ask.js';

describe('justAsk Regex', () => {
  it("should detect 'just ask' variations", () => {
    const testCases = [
      { input: 'Anyone knows js?', expected: true },
      { input: 'Somebody can help with Python?', expected: true },
      { input: 'No one has experience with js?', expected: true },
      { input: 'Everybody tried React?', expected: true },
      { input: 'People familiar with Kubernetes?', expected: true },

      { input: 'I know js well.', expected: false },
      { input: 'This is a question without the pattern.', expected: false },
    ];

    for (const { input, expected } of testCases) {
      const result = isAskingToAsk(input);
      assert.strictEqual(result, expected, `Failed for input: "${input}"`);
    }
  });
});
