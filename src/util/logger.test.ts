import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { createLogger } from './logger.js';

const buildPrefixRegex = (feature: string, level: string) =>
  new RegExp(
    String.raw`^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[${feature}\] \[${level}\]$`
  );

void describe('createLogger', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  void it('prefixes info output with timestamp, feature name, and level', () => {
    const consoleInfo = mock.method(console, 'info', () => {});

    createLogger('showcase').info('created post', 42);

    const [prefix, ...messages] = consoleInfo.mock.calls[0]!.arguments;

    assert.match(prefix as string, buildPrefixRegex('showcase', 'INFO'));
    assert.deepEqual(messages, ['created post', 42]);
  });

  void it('prefixes warnings with timestamp, feature name, and level', () => {
    const consoleWarn = mock.method(console, 'warn', () => {});

    createLogger('guides').warn('missing access');

    const [prefix, ...messages] = consoleWarn.mock.calls[0]!.arguments;

    assert.match(prefix as string, buildPrefixRegex('guides', 'WARN'));
    assert.deepEqual(messages, ['missing access']);
  });

  void it('prefixes errors and preserves the error object as an argument', () => {
    const consoleError = mock.method(console, 'error', () => {});
    const error = new Error('boom');

    createLogger('tags').error('Error deleting tag:', error);

    const [prefix, ...messages] = consoleError.mock.calls[0]!.arguments;

    assert.match(prefix as string, buildPrefixRegex('tags', 'ERROR'));
    assert.deepEqual(messages, ['Error deleting tag:', error]);
  });
});
