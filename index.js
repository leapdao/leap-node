/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Web3 = require('web3');
const { Tx } = require('parsec-lib');

const cliArgs = require('./src/cliArgs');
const cleanupLotion = require('./src/cleanupLotion');
const Db = require('./src/api/db');
const jsonrpc = require('./src/api/jsonrpc');

const bridgeABI = require('./src/bridgeABI');
const applyTx = require('./src/tx/applyTx');
const accumulateTx = require('./src/tx/accumulateTx');

const addBlock = require('./src/block/addBlock');
const updatePeriod = require('./src/block/updatePeriod');
const updateValidators = require('./src/block/updateValidators');
const updateEpoch = require('./src/block/updateEpoch');

const checkBridge = require('./src/period/checkBridge');

const eventsRelay = require('./src/eventsRelay');
const { printStartupInfo } = require('./src/utils');
const printTx = require('./src/txHelpers/printTx');
const Node = require('./src/node');
const lotion = require('./lotion');

const { logParsec, logTendermint, logTx } = require('./src/debug');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

async function run() {
  const config = JSON.parse(await readFile(cliArgs.config));

  if (!config.bridgeAddr) {
    console.error('bridgeAddr is required');
    process.exit(0);
  }

  const web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(config.rootNetwork));
  const bridge = new web3.eth.Contract(bridgeABI, config.bridgeAddr);

  const app = lotion({
    initialState: {
      mempool: [],
      balances: {}, // stores account balances like this { [colorIndex]: { address1: 0, ... } }
      unspent: {}, // stores unspent outputs (deposits, transfers)
      processedDeposit: 0,
      epoch: 0,
      lastEpochHeight: 0,
      epochLength: null,
      slots: [],
    },
    networkId: config.network,
    genesis: config.genesis,
    abciPort: 26658,
    peers: config.peers,
    p2pPort: cliArgs.p2pPort,
    tendermintPort: 26659,
    createEmptyBlocks: false,
    logTendermint: log => {
      logTendermint(
        log.replace(/I\[\d{2}-\d{2}\|\d{2}:\d{2}:\d{2}\.\d{3}\] /g, '')
      );
    },
  });

  if (cliArgs.fresh) {
    await cleanupLotion(app);
  }

  const privFilename = path.join(path.dirname(cliArgs.config), '.priv');
  if (await exists(privFilename)) {
    config.privKey = await readFile(privFilename);
  } else {
    const { privateKey } = web3.eth.accounts.create();
    config.privKey = privateKey;
    await writeFile(privFilename, privateKey);
  }

  const db = Db(app);

  const node = new Node(db, web3, bridge, config);
  await node.init();

  app.useTx((state, { encoded }) => {
    const tx = Tx.fromRaw(encoded);
    const printedTx = printTx(state, tx);

    applyTx(state, tx, node, bridge);
    accumulateTx(state, tx);

    if (printedTx) {
      logTx(printedTx);
    }
  });

  app.useBlock(async (state, chainInfo) => {
    await updatePeriod(state, chainInfo, {
      bridge,
      web3,
      node,
    });
    await addBlock(state, chainInfo, {
      node,
      db,
    });
    if (!cliArgs.no_validators_updates && state.slots.length > 0) {
      await updateValidators(state, chainInfo);
    }

    updateEpoch(state, chainInfo);
    logParsec(
      'Height: %d, epoch: %d, epochLenght: %d',
      chainInfo.height,
      state.epoch,
      state.epochLength
    );
  });

  app.useBlock((state, { height }) => {
    // state is merk here. TODO: assign object copy or something immutable
    node.currentState = state;
    node.blockHeight = height;
  });

  app.usePeriod(async (rsp, chainInfo, height) => {
    await checkBridge(rsp, chainInfo, height, {
      node,
      web3,
      bridge,
      privKey: config.privKey,
    });
  });

  app.listen(cliArgs.port).then(async params => {
    node.replay = false;

    await eventsRelay(params.txServerPort, web3, bridge);
    await printStartupInfo(params, node, bridge);

    const api = await jsonrpc(node, params.txServerPort, db, bridge);
    api
      .listenHttp({ port: cliArgs.rpcport, host: cliArgs.rpcaddr })
      .then(addr => {
        logParsec(
          `Http JSON RPC server is listening at ${addr.address}:${addr.port}`
        );
      });

    api.listenWs({ port: cliArgs.wsport, host: cliArgs.wsaddr }).then(addr => {
      logParsec(
        `Ws JSON RPC server is listening at ${addr.address}:${addr.port}`
      );
    });
  });
}

run();
