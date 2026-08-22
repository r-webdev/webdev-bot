import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ComponentType, type TopLevelComponent } from 'discord.js';
import { clampPrunePerPage, getPruneIds, parseHeader } from './prune-tags.js';

const asComponents = (value: unknown): readonly TopLevelComponent[] =>
  value as readonly TopLevelComponent[];

void describe('clampPrunePerPage', () => {
  void it('defaults to 10 when no value is provided', () => {
    assert.equal(clampPrunePerPage(null), 10);
  });

  void it('returns the value as-is when within bounds', () => {
    assert.equal(clampPrunePerPage(5), 5);
  });

  void it('clamps values below 1 up to 1', () => {
    assert.equal(clampPrunePerPage(0), 1);
    assert.equal(clampPrunePerPage(-10), 1);
  });

  void it('clamps values above 25 down to 25', () => {
    assert.equal(clampPrunePerPage(100), 25);
  });
});

void describe('parseHeader', () => {
  const withHeaderText = (content: string) =>
    asComponents([
      {
        type: ComponentType.Container,
        components: [{ type: ComponentType.TextDisplay, content }],
      },
    ]);

  void it('extracts the page and per-page count from the header text', () => {
    const components = withHeaderText(
      '### 🧹 Prunable Tags (Page 2/5 • Per Page 10)'
    );

    assert.deepEqual(parseHeader(components), { page: 2, perPage: 10 });
  });

  void it('returns undefined when the first component is not a container', () => {
    const components = asComponents([
      { type: ComponentType.TextDisplay, content: 'oops' },
    ]);

    assert.equal(parseHeader(components), undefined);
  });

  void it('returns undefined when the container has no text display header', () => {
    const components = asComponents([
      {
        type: ComponentType.Container,
        components: [{ type: ComponentType.Separator }],
      },
    ]);

    assert.equal(parseHeader(components), undefined);
  });

  void it('returns undefined when the header text does not match the expected format', () => {
    const components = withHeaderText('### Something else entirely');

    assert.equal(parseHeader(components), undefined);
  });
});

void describe('getPruneIds', () => {
  const withSelectOptions = (options: { value: string; default?: boolean }[]) =>
    asComponents([
      { type: ComponentType.Container, components: [] },
      {
        type: ComponentType.ActionRow,
        components: [{ type: ComponentType.StringSelect, options }],
      },
    ]);

  void it('returns only the pruned ids (selected options)', () => {
    const components = withSelectOptions([
      { value: '1', default: false },
      { value: '2', default: true },
      { value: '3', default: true },
    ]);

    assert.deepEqual(getPruneIds(components), [2, 3]);
  });

  void it('returns empty array when the select row is missing', () => {
    const components = asComponents([
      { type: ComponentType.Container, components: [] },
    ]);

    assert.deepEqual(getPruneIds(components), []);
  });

  void it('returns empty array when the second component is not an action row', () => {
    const components = asComponents([
      { type: ComponentType.Container, components: [] },
      { type: ComponentType.TextDisplay, content: 'not a row' },
    ]);

    assert.deepEqual(getPruneIds(components), []);
  });

  void it('returns empty array when the action row does not contain a select menu', () => {
    const components = asComponents([
      { type: ComponentType.Container, components: [] },
      {
        type: ComponentType.ActionRow,
        components: [{ type: ComponentType.Button }],
      },
    ]);

    assert.deepEqual(getPruneIds(components), []);
  });
});
