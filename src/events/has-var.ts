import { Events } from 'discord.js';
import ts from 'typescript';
import { MINUTE } from '../constants/time.js';
import { createEvent } from '../util/events.js';
import { codeBlockRegex } from '../util/message.js';
import { rateLimit } from '../util/rate-limit.js';

const { canRun, reset } = rateLimit(5 * MINUTE);

const hasVarDeclaration = (code: string, language: string): boolean => {
  if (!['js', 'javascript', 'ts', 'typescript'].includes(language.toLowerCase())) {
    return false;
  }

  try {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);

    let foundVar = false;

    const checkNode = (node: ts.Node) => {
      if (ts.isVariableStatement(node)) {
        const declList = node.declarationList;
        const isVar =
          (declList.flags & ts.NodeFlags.Let) === 0 && (declList.flags & ts.NodeFlags.Const) === 0;
        if (isVar) {
          foundVar = true;
        }
      }
      node.forEachChild(checkNode);
    };

    checkNode(sourceFile);

    return foundVar;
  } catch {
    return false;
  }
};

export const hasVarEvent = createEvent(
  {
    name: Events.MessageCreate,
    once: false,
  },
  async (message) => {
    if (message.author.bot || !canRun()) {
      return;
    }

    const codeBlocks = Array.from(message.content.match(codeBlockRegex) || []);

    for (const block of codeBlocks) {
      const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
      if (match) {
        const language = match[1] || '';
        const code = match[2] || '';

        if (hasVarDeclaration(code, language)) {
          await message.reply(
            'It looks like you are using `var` to declare variables. Consider using `let` or `const` instead, as they provide better scoping and help prevent unintended behavior.'
          );
          reset();
          return;
        }
      }
    }
    return;
  }
);
