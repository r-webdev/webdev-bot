import { basicErrorMessage } from '@/util/components/basic-message.js';
import type { ErrorMessage } from './index.js';

export const OptionTypes = {
  InvalidType: (optionName: string, expectedType: string) =>
    basicErrorMessage(
      `Invalid value for option "${optionName}". Expected a ${expectedType}.`
    ),
} satisfies Record<string, ErrorMessage>;
