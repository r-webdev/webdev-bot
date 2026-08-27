import assert from 'node:assert';
import { describe, it } from 'node:test';
import { jaccardSimilarity } from './text.js';
import { replaceSpoilerHack } from './text.js';
import { stripEmoji } from './text.js';
import { stripCode } from './text.js';

void describe('util/messages.ts', () => {
  void describe('stripCode', () => {
    void it('should remove inline code blocks', () => {
      const input = 'This is a `code` block.';
      const expected = 'This is a  block.';
      const actual = stripCode(input);

      assert.strictEqual(actual, expected);
    });

    void it('should remove multiple inline code blocks', () => {
      const input = 'Here is `code1` and here is `code2`.';
      const expected = 'Here is  and here is .';
      const actual = stripCode(input);

      assert.strictEqual(actual, expected);
    });

    void it('should handle strings without code blocks', () => {
      const input = 'This string has no code blocks.';
      const expected = 'This string has no code blocks.';
      const actual = stripCode(input);

      assert.strictEqual(actual, expected);
    });

    void it('should remove code blocks', () => {
      const input = '```function test() { return true; }```';
      const expected = '';
      const actual = stripCode(input);

      assert.strictEqual(actual, expected);
    });
  });

  void describe('stripEmoji', () => {
    void it('should remove emojis', () => {
      const input = 'Hello :smile: world :custom_emoji:';
      const expected = 'Hello  world ';
      const actual = stripEmoji(input);

      assert.strictEqual(actual, expected);
    });

    void it('should handle strings without emojis', () => {
      const input = 'This string has no emojis.';
      const expected = 'This string has no emojis.';
      const actual = stripEmoji(input);

      assert.strictEqual(actual, expected);
    });
  });

  void describe('replaceSpoilerHack', () => {
    void it('should replace spoiler hack sequences with the default replacement', () => {
      const input = 'This is a spoiler ||\u200b|| and another ||\u200b||.';
      const expected = 'This is a spoiler [...] and another [...].';
      const actual = replaceSpoilerHack(input);

      assert.strictEqual(actual, expected);
    });

    void it('should replace spoiler hack sequences with a custom replacement', () => {
      const input = 'Spoiler here ||\u200b||!';
      const expected = 'Spoiler here <SPOILER>!';
      const actual = replaceSpoilerHack(input, '<SPOILER>');

      assert.strictEqual(actual, expected);
    });
  });

  void describe('jaccardSimilarity', () => {
    void it('catches identical self-promotion spam', () => {
      const msg1 =
        'Check out my new portfolio website! Built with React and Tailwind';
      const msg2 =
        'Check out my new portfolio website! Built with React and Tailwind';
      const actual = jaccardSimilarity(msg1, msg2);

      assert.strictEqual(actual, 1);
    });

    void it('catches copy-paste spam with minor punctuation differences', () => {
      const msg1 = 'hey guys check out my new website!';
      const msg2 = 'hey guys, check out my new website';
      const actual = jaccardSimilarity(msg1, msg2);

      assert.strictEqual(actual, 1);
    });

    void it('catches reordered messages', () => {
      const msg1 =
        'I just launched my SaaS app! Check it out and let me know what you think';
      const msg2 =
        'Check it out and let me know what you think! I just launched my SaaS app';
      const actual = jaccardSimilarity(msg1, msg2);
      assert.strictEqual(actual, 1);
    });

    void it('does not flag similar but different questions', () => {
      const msg1 = 'How do I center a div in CSS?';
      const msg2 = 'How do I align a div to the right in CSS?';
      const actual = jaccardSimilarity(msg1, msg2); // 0.5833333333333334

      assert.ok(actual > 0.5 && actual < 0.8);
    });
  });
});
