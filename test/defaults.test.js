const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');

test('does not assign a default non-essential traffic setting', () => {
  assert.doesNotMatch(source, /DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC/);
  assert.doesNotMatch(source, /env\.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC\s*=/);
  assert.doesNotMatch(source, /settings\.env\.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC\s*=/);
});
