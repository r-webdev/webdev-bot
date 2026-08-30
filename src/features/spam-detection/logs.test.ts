import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Message } from 'discord.js';
import { HOUR } from '../../constants/time.js';
import { createLogTextContent, type LogFunctionOptions } from './logs.js';
import type { ContentBasedRule, CrossChannelRule } from './rules-config.js';

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

const crossChannelOptions = {
  rule: {
    type: 'crossChannel',
    isBrokenBy: () => true,
    logType: 'crossPost',
    timeframe: 15_000,
    channelCount: 3,
    action: async () => {},
  },
  messages: [
    {
      content: 'Repeated message',
      channelId: '123',
      author: { id: '1' },
      attachments: { size: 0 },
    },
    {
      content: 'Repeated message',
      channelId: '456',
      author: { id: '1' },
      attachments: { size: 0 },
    },
    {
      content: 'Repeated message',
      channelId: '789',
      author: { id: '1' },
      attachments: { size: 0 },
    },
  ] as Message[],
  deletedMessagesCount: 3,
  reason: 'Cross-posting',
} satisfies LogFunctionOptions<CrossChannelRule>;

void describe('spam-detection/logs -> createLogTextContent', () => {
  void it('should create log content for a content-based rule', () => {
    const logContent = createLogTextContent(options);

    assert(logContent.includes('**Rule Broken:** Contains banned tag'));
    assert(logContent.includes('**User:** <@1>'));
    assert(logContent.includes('**Flagged Message:**'));
    assert(logContent.includes('This message contains a banned tag'));
    assert(logContent.includes('**Channel:** <#123>'));
  });

  void it('should create log content for a cross-channel rule', () => {
    const logContent = createLogTextContent(crossChannelOptions);

    assert(logContent.includes('Posted in **3** channels within'));
    assert(logContent.includes('15 seconds'));
    assert(logContent.includes('**Flagged Message:**'));
    assert(logContent.includes('Repeated message'));
    assert(
      logContent.includes('**Channels Involved:** <#123>, <#456>, <#789>')
    );
  });
});
