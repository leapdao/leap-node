/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const dashdash = require('dashdash');

const options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help',
  },
  {
    names: ['version'],
    type: 'bool',
    help: 'Print version',
  },
  {
    names: ['no-validators-updates'],
    type: 'bool',
    default: false,
    help: 'Disabling validators set updates',
  },
  {
    names: ['port'],
    type: 'number',
    default: 3000,
    help: 'Tx endpoint port',
  },
  {
    names: ['rpcaddr'],
    type: 'string',
    default: 'localhost',
    help: 'Host for http RPC server',
  },
  {
    names: ['rpcport'],
    type: 'number',
    default: 8645,
    help: 'Port for http RPC server',
  },
  {
    names: ['wsaddr'],
    type: 'string',
    default: 'localhost',
    help: 'Host for websocket RPC server',
  },
  {
    names: ['wsport'],
    type: 'number',
    default: 8646,
    help: 'Port for websocket RPC server',
  },
  {
    names: ['p2pPort'],
    type: 'number',
    default: undefined,
    help: 'Port for p2p connection',
  },
  {
    names: ['tendermintPort'],
    type: 'number',
    default: 26659,
    help: 'Port for tendermint connection',
  },
  {
    names: ['abciPort'],
    type: 'number',
    default: 26658,
    help: 'Port for abci connection',
  },
  {
    names: ['devMode'],
    type: 'bool',
    default: false,
    help: 'Lotion devMode',
  },
  {
    names: ['config'],
    type: 'string',
    help: "Path to config file or other's node JSON RPC url",
  },
  {
    names: ['privateKey'],
    type: 'string',
    help:
      "Path to file with ethereum private key. Will be used for validators' transaction",
  },
  {
    names: ['network'],
    type: 'string',
    help: 'Config preset',
  },
  {
    names: ['fresh'],
    type: 'bool',
    default: false,
    help: 'Start node with fresh state',
  },
  {
    names: ['readonly'],
    type: 'bool',
    default: false,
    help: 'Run validator without producing blocks, only observing',
  },
];

const parser = dashdash.createParser({ options });
const cliArgs = parser.parse(process.argv);

if (cliArgs.help) {
  console.log('Usage:');
  console.log(parser.help({ includeEnv: true }).trimRight());
  process.exit(0);
}

if (cliArgs.version) {
  console.log(`v${require('../../package.json').version}`); // eslint-disable-line
  process.exit(0);
}

if (cliArgs.network) {
  const configPath = path.join(
    __dirname,
    '..',
    'presets',
    `leap-${cliArgs.network}.json`
  );

  if (fs.existsSync(configPath)) {
    cliArgs.config = configPath;
  }
}

if (!cliArgs.config) {
  console.log('Config/network option is required. See --help');
  process.exit(0);
}

if (cliArgs.privateKey && !fs.existsSync(cliArgs.privateKey)) {
  console.log(`${cliArgs.privateKey} does not exist`);
  process.exit(0);
}

module.exports = cliArgs;
