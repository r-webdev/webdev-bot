import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  finishModeration,
  isUserBeingModerated,
  startModeration,
} from './moderation-state.js';

void describe('spam-detection/moderation-state', () => {
  void it('tracks a user until all active moderation actions finish', () => {
    startModeration('user-1');
    startModeration('user-1');

    finishModeration('user-1');
    assert(isUserBeingModerated('user-1'));

    finishModeration('user-1');
    assert(!isUserBeingModerated('user-1'));
  });
});
