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
    env: 'NO_VALIDATORS_UPDATES',
    default: false,
    help: 'Disabling validators set updates',
  },
  {
    names: ['rpcaddr'],
    type: 'string',
    env: 'RPC_ADDR',
    default: 'localhost',
    help: 'Host for http RPC server',
  },
  {
    names: ['rpcport'],
    type: 'number',
    env: 'RPC_PORT',
    default: 8645,
    help: 'Port for http RPC server',
  },
  {
    names: ['wsaddr'],
    type: 'string',
    env: 'WS_ADDR',
    default: 'localhost',
    help: 'Host for websocket RPC server',
  },
  {
    names: ['wsport'],
    type: 'number',
    env: 'WS_PORT',
    default: 8646,
    help: 'Port for websocket RPC server',
  },
  {
    names: ['p2pPort'],
    type: 'number',
    env: 'P2P_PORT',
    default: undefined,
    help: 'Port for p2p connection',
  },
  {
    names: ['tendermintAddr'],
    type: 'string',
    env: 'TENDERMINT_ADDR',
    default: '0.0.0.0',
    help: 'Host for tendermint RPC connection',
  },
  {
    names: ['tendermintPort'],
    type: 'number',
    default: 26659,
    help: 'Port for tendermint RPC connection',
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
    env: 'CONFIG_URL',
    help: "Path to config file or other's node JSON RPC url",
  },
  {
    names: ['privateKey'],
    type: 'string',
    env: 'PRIVATE_KEY',
    help:
      "Path to file with ethereum private key. Will be used for validators' transaction",
  },
  {
    names: ['network'],
    type: 'string',
    env: 'NETWORK',
    help: 'Config preset',
  },
  {
    names: ['fresh'],
    type: 'bool',
    default: false,
    help: 'Start node with fresh state',
  },
  {
    names: ['unsafeRpc'],
    type: 'bool',
    default: false,
    env: 'UNSAFE_RPC',
    help: 'Run unsafe Tendermint RPC',
  },
  {
    names: ['dataPath'],
    type: 'string',
    env: 'DATA_PATH',
    help: 'Path to lotion folder',
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
    '../../',
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
