import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { createLogger } from './logger.js';

void describe('createLogger', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  void it('prefixes log output with the feature name', () => {
    const consoleLog = mock.method(console, 'log', () => {});

    createLogger('showcase').log('created post', 42);

    assert.deepEqual(consoleLog.mock.calls[0]?.arguments, [
      '[showcase]',
      'created post',
      42,
    ]);
  });

  void it('prefixes warnings with the feature name', () => {
    const consoleWarn = mock.method(console, 'warn', () => {});

    createLogger('guides').warn('missing access');

    assert.deepEqual(consoleWarn.mock.calls[0]?.arguments, [
      '[guides]',
      'missing access',
    ]);
  });

  void it('prefixes errors and keeps the error object as an argument', () => {
    const consoleError = mock.method(console, 'error', () => {});
    const error = new Error('boom');

    createLogger('tags').error('Error deleting tag:', error);

    assert.deepEqual(consoleError.mock.calls[0]?.arguments, [
      '[tags]',
      'Error deleting tag:',
      error,
    ]);
  });
});
