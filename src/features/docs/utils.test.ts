import assert from 'node:assert';
import { describe, it } from 'node:test';
import { features } from 'web-features';
import { getBaselineFeatures, NON_BASELINE_FEATURES } from './utils.js';

describe('getBaselineFeatures', () => {
  it('should return the correct baseline features when provided with non-features key array', () => {
    const originalFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Description 1',
        status: { support: {}, baseline: 'full' },
      },
      'feature-2': {
        name: 'Feature 2',
        description: 'Description 2',
        status: { support: {}, baseline: 'partial' },
      },
      'numeric-seperators': {
        name: 'Numeric Separators',
        description: 'Description NS',
        status: { support: {}, baseline: 'none' },
      },
      'single-color-gradient': {
        name: 'Single Color Gradient',
        description: 'Description SCG',
        status: { support: {}, baseline: 'none' },
      },
    };

    const expectedFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Description 1',
        status: { support: {}, baseline: 'full' },
      },
      'feature-2': {
        name: 'Feature 2',
        description: 'Description 2',
        status: { support: {}, baseline: 'partial' },
      },
    };

    const result = getBaselineFeatures(originalFeatures, [
      'numeric-seperators',
      'single-color-gradient',
    ]);

    assert.deepStrictEqual(result, expectedFeatures);
  });

  it('NON_BASELINE_FEATURES should contain the correct features to exclude', () => {
    const expectedNonBaselineFeatures = Object.entries(features)
      .filter(([, feature]) => feature.kind !== 'feature')
      .map(([key]) => key);

    assert.deepStrictEqual(NON_BASELINE_FEATURES, expectedNonBaselineFeatures);
  });
});
