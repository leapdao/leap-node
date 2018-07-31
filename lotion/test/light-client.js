/* eslint-disable */

const lotion = require('../index.js');

const { connect } = lotion;
const test = require('tape-promise/tape');

let CGI;

test('setup', async t => {
  // GCI = await startCounterApp()
  GCI = 'QmVzjHtfQobbxbVydJX9XZz2zJMRddTWTvZpPdScbDZ9HP';
});

test('light client state query', async t => {
  let { state, send } = connect(GCI);

  await state;
  console.log(state);
});
