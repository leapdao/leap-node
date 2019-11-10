const flagsFactory = require('./flagsFactory');

const FLAGS = ['spend_cond_stricter_rules', 'spend_cond_new_bytecode'];

module.exports = flagsFactory(FLAGS);
