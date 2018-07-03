/* eslint-disable no-console */

const dashdash = require('dashdash');

const options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help',
  },
  {
    names: ['no-validators-updates'],
    type: 'bool',
    default: false,
    help: 'Disabling validators set updates',
  },
];

const parser = dashdash.createParser({ options });
const cliArgs = parser.parse(process.argv);

if (cliArgs.help) {
  console.log('Usage:');
  console.log(parser.help({ includeEnv: true }).trimRight());
  process.exit(0);
}

module.exports = cliArgs;
