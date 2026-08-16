// @ts-nocheck
// WARN: Await on describe??
import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Message } from 'discord.js';
import { HOUR } from '../../constants/time.js';
import { createLogTextContent, type LogFunctionOptions } from './logs.js';
import type { ContentBasedRule } from './rules-config.js';

void describe('spam-detection/logs -> createLogTextContent', () => {
  void it('should create log content for a content-based rule', () => {
    // Mock options for a content-based rule
    const options = {
      rule: {
        type: 'contentBased',
        isBrokenBy: () => true,
        action: async () => {},
      },
      messages: [
        {
          content: 'This message contains a banned tag',
          channelId: '123',
          author: { id: '1' },
        },
      ] as Message[],
      deletedMessagesCount: 1,
      reason: 'Contains banned tag',
      muteDuration: 1 * HOUR,
    } satisfies LogFunctionOptions<ContentBasedRule>;

    const logContent = createLogTextContent(options);
    // console.log(logContent);

    // Basic assertions to check if the log content includes expected information
    assert(logContent.includes('**Rule Broken:** Contains banned tag'));
    assert(logContent.includes('**User:** <@1>'));
    assert(logContent.includes('**Flagged Message:**'));
    assert(logContent.includes('This message contains a banned tag'));
    assert(logContent.includes('**Channel:** <#123>'));
  });
});
