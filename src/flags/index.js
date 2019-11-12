const flagsFactory = require('./flagsFactory');

// when adding a flag, add a link to the issue/PR describing the reason for the change
const FLAGS = [
  'spend_cond_stricter_rules', // https://github.com/leapdao/leap-node/pull/303
  'spend_cond_new_bytecode' // https://github.com/leapdao/leap-node/pull/292
];

module.exports = flagsFactory(FLAGS);
