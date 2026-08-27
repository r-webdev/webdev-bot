import { basicErrorMessage } from '@/util/components/basic-message.js';
import type { ErrorMessage } from './index.js';

export const Tags = {
  TagNotFound: (name) => basicErrorMessage(`Tag \`${name}\` not found.`),
  TagAlreadyExists: (name) =>
    basicErrorMessage(`Tag \`${name}\` already exists.`),

  OwnershipRequired: basicErrorMessage(
    'You must be the owner of this tag to use this command.'
  ),
  InvalidTagName: basicErrorMessage(
    'Tag names must be 1–32 characters, alphanumeric with hyphens/underscores, and cannot be purely numeric.'
  ),
} satisfies Record<string, ErrorMessage>;
