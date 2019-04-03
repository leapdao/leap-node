const fs = require('fs');
const { join } = require('path');
const tendermint = require('tendermint-node');

const CONSENSUS_PARAMS = {
  'block': {
    'max_bytes':'22020096',
    'max_gas':'-1',
    'time_iota_ms':'1000',
  },
  'evidence': {
    'max_age':'100000',
  },
  'validator': {
    'pub_key_types':['ed25519'],
  }
};

module.exports = async ({
  lotionPath,
  tendermintAddr,
  tendermintPort,
  abciPort,
  p2pPort,
  // networkId,
  logTendermint,
  peers,
  genesis,
  keys,
  createEmptyBlocks,
  unsafeRpc,
  readonlyValidator,
}) => {
  await tendermint.init(lotionPath);

  if (genesis) {
    fs.writeFileSync(
      join(lotionPath, 'config', 'genesis.json'),
      JSON.stringify(genesis)
    );
  }
  if (keys) {
    const validatorJsonPath = join(lotionPath, 'config', 'priv_validator_key.json');
    const generatedValidatorJson = JSON.parse(
      fs.readFileSync(validatorJsonPath, { encoding: 'utf8' })
    );
    const newValidatorJson = Object.assign({}, generatedValidatorJson, keys);
    fs.writeFileSync(validatorJsonPath, JSON.stringify(newValidatorJson));
  }

  // add app hash to genesis
  const newGenesis = Object.assign(
    {},
    JSON.parse(fs.readFileSync(join(lotionPath, 'config', 'genesis.json'))),
    {
      consensus_params: CONSENSUS_PARAMS,
    }
  );
  fs.writeFileSync(
    join(lotionPath, 'config', 'genesis.json'),
    JSON.stringify(newGenesis)
  );

  const opts = {
    rpc: { laddr: `tcp://${tendermintAddr}:${tendermintPort}` },
    p2p: { laddr: `tcp://0.0.0.0:${p2pPort}` },
    proxyApp: `tcp://127.0.0.1:${abciPort}`,
  };
  if (peers.length) {
    opts.p2p.persistentPeers = peers.join(',');
  }
  if (unsafeRpc) {
    opts.rpc.unsafe = true;
  }
  opts.consensus = {};
  if (createEmptyBlocks === false) {
    opts.consensus.create_empty_blocks = false;
  }

  if (!logTendermint) {
    opts.logLevel = 'error';
  }
  if (readonlyValidator) {
    opts.consensus.readonly = true;
  }

  let shuttingDown = false;
  const tendermintProcess = tendermint.node(lotionPath, opts);
  if (logTendermint) {
    if (typeof logTendermint === 'function') {
      tendermintProcess.stdout.on('data', chunk => {
        logTendermint(chunk.toString('utf8'));
      });
      tendermintProcess.stderr.on('data', chunk => {
        logTendermint(chunk.toString('utf8'));
      });
    } else {
      tendermintProcess.stdout.pipe(process.stdout);
      tendermintProcess.stderr.pipe(process.stderr);
    }
  }
  tendermintProcess.then(() => {
    if (shuttingDown) return;

    console.log('Tendermint node crashed');
    // exit here, it makes no sense to keep running without tendermint
    process.exit(1);
  });

  // wait for RPC server
  await tendermintProcess.started();

  return {
    synced: tendermintProcess.synced(),
    process: tendermintProcess,
    close: () => {
      shuttingDown = true;
      tendermintProcess.kill();
    },
  };
};
