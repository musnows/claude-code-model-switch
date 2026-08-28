const test = require('node:test');
const assert = require('node:assert/strict');

const { findStartModelIndex, normalizeStartCommandArgs } = require('../argv');

test('finds start and model after protocol arguments', () => {
  const args = ['-p', '--output-format', 'stream-json', 'start', 'dsf'];

  assert.equal(findStartModelIndex(args), 3);
});

test('moves start and model before protocol arguments', () => {
  const args = ['-p', '--output-format', 'stream-json', 'start', 'dsf'];

  assert.deepEqual(normalizeStartCommandArgs(args), [
    'start',
    'dsf',
    '-p',
    '--output-format',
    'stream-json',
  ]);
});

test('preserves the standard start command order', () => {
  const args = ['start', 'glm53flash', '-p', 'hello'];

  assert.deepEqual(normalizeStartCommandArgs(args), args);
});

test('leaves arguments unchanged when no start model pair exists', () => {
  const args = ['-p', 'hello'];

  assert.deepEqual(normalizeStartCommandArgs(args), args);
});
