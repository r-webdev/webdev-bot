import { basicErrorMessage } from '@/util/components/basic-message.js';
import type { ErrorMessage } from './index.js';

export const User = {
  UnableToVerifyPermissions: basicErrorMessage(
    'An error occurred while verifying your permissions.'
  ),
  MissingRole: basicErrorMessage(
    'You do not have the required role to use this command.'
  ),
  MissingPermissions: basicErrorMessage(
    'You do not have the required permissions to use this command.'
  ),
} satisfies Record<string, ErrorMessage>;
