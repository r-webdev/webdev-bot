import { Events } from 'discord.js';
import { MINUTE } from '../constants/time.js';
import { createEvent } from '../util/events.js';
import { loadMarkdownOptions, resolveAssetPath } from '../util/markdown.js';
import { rateLimit } from '../util/rate-limit.js';

// Subject patterns (who)
const reSubject = `(?:(?:any|some|no|every)(?:one|body)|people|folks|peeps|who)`;

// Verb patterns (has/knows/can help/etc)
const reVerb = `(?:ha[sv]e?|got|knows?|can(?: help)?|tried|used|worked(?: with)?|familiar(?: with)?|experience[ds]?(?: with)?|heard(?: of)?|seen)`;

// Quantifiers (optional intensity)
const reQuantifier = `(?:any|some|much|good|prior|past|previous)`;

// Question patterns
const reQuestion = `(?:experience|knowledge|info(?:rmation)?|ideas?|clues?|tips?|advice|help|thoughts?|insights?|suggestions?)`;

// Common connectors
const reConnector = `(?:with|about|on|regarding|for|of)`;

const askToAskPattern = new RegExp(
  String.raw`\b${reSubject}\s+${reVerb}\s+(?:${reQuantifier}\s+)?(?:${reQuestion}\s+)?(?:${reConnector}\s+)?.+\??`,
  'i'
);

const isAskingToAsk = (text: string) => askToAskPattern.test(text);

const justAskDir = resolveAssetPath(
  '../commands/tips/subjects/',
  './commands/tips/subjects/',
  import.meta.url
);
const [response] = await loadMarkdownOptions<{ name: string }>(justAskDir, 'justask.md');

const { canRun, reset } = rateLimit(10 * MINUTE);

export const justAskEvent = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (message) => {
    if (!canRun() || message.author.bot) {
      return;
    }

    // Ignore long messages, likely user provided more context
    if (message.content.split(' ').length > 10) {
      return;
    }

    if (isAskingToAsk(message.content)) {
      await message.reply({
        content: response.content,
      });
      reset();
    }
  }
);
