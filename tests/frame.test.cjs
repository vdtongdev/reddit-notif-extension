const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/content.js', 'utf8');
const start = source.indexOf('  function prepareFrame(frame) {');
const end = source.indexOf('\n  //', start);
const prepare = source.slice(start, end);
function element(parent = null) {
  return { parentElement: parent, children: [], style: { setProperty() {} } };
}
const body = element();
const main = element(body);
body.children = [main];
const status = { hidden: false };
const classes = new Set();
const doc = {
  body, documentElement: {}, location: { origin: 'https://www.reddit.com' },
  querySelector(selector) {
    if (selector === 'main') return main;
    if (selector === 'notification-item' || selector === 'main notification-item') return {};
    return null;
  },
};
const frame = { contentDocument: doc, classList: { add: c => classes.add(c), contains: c => classes.has(c) } };
const context = {
  dropdown: { querySelector: () => status }, location: doc.location,
  MutationObserver: class { observe() {} disconnect() {} }, setTimeout() {},
};
vm.runInNewContext(prepare + '\nprepareFrame(frame);', { ...context, frame });
assert.equal(classes.has('rnd-frame--ready'), true, 'notification feed should become visible');
assert.equal(status.hidden, true);
console.log('Notification feed becomes visible');
