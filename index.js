/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */
/* global app, bridgeState, blockTicker, eventsRelay, db */

const cliArgs = require('./src/utils/cliArgs');
const cleanupLotion = require('./src/utils/cleanupLotion');
const readConfig = require('./src/utils/readConfig');
const { readPrivKey, writePrivKey } = require('./src/utils/privKey');
const Db = require('./src/api/db');
const jsonrpc = require('./src/api/jsonrpc');

const txHandler = require('./src/tx');
const blockHandler = require('./src/block');
const periodHandler = require('./src/period');

const { printStartupInfo } = require('./src/utils');
const BridgeState = require('./src/bridgeState');
const BlockTicker = require('./src/utils/BlockTicker');
const EventsRelay = require('./src/eventsRelay');
const lotion = require('./lotion');
const delayedSender = require('./src/txHelpers/delayedSender');

const { logNode, logTendermint } = require('./src/utils/debug');

async function run() {
  const config = await (async () => {
    let result;
    try {
      result = readConfig(cliArgs.config, cliArgs.rootNetwork);
    } catch (err) {
      console.error(err.message);
      process.exit(0);
    }

    return result;
  })();

  global.app = lotion({
    networkId: `${config.network}-${config.networkId}`,
    genesis: config.genesis,
    devMode: cliArgs.devMode,
    abciPort: cliArgs.abciPort,
    peers: config.peers,
    p2pPort: cliArgs.p2pPort,
    tendermintAddr: cliArgs.tendermintAddr,
    tendermintPort: cliArgs.tendermintPort,
    createEmptyBlocks: false,
    logTendermint: log => {
      logTendermint(
        log.replace(/I\[\d{2}-\d{2}\|\d{2}:\d{2}:\d{2}\.\d{3}\] /g, '')
      );
    },
    unsafeRpc: cliArgs.unsafeRpc,
    dataPath: cliArgs.dataPath,
  });

  if (cliArgs.fresh) {
    await cleanupLotion(app);
    process.exit(0);
  }

  global.db = Db(app);

  const privKey = await readPrivKey(app, cliArgs);

  const sender = delayedSender(cliArgs.tendermintPort);

  global.eventsRelay = new EventsRelay(config.eventsDelay, sender);
  global.bridgeState = new BridgeState(
    db,
    privKey,
    config,
    eventsRelay.relayBuffer,
    sender
  );
  global.blockTicker = new BlockTicker(bridgeState.web3, [
    bridgeState.onNewBlock,
  ]);

  await writePrivKey(app, cliArgs, bridgeState.account.privateKey);

  await bridgeState.init();
  await blockTicker.init();

  const nodeConfig = Object.assign({}, cliArgs, { network: config });

  app.useTx(txHandler(bridgeState, nodeConfig));
  app.useBlock(blockHandler(bridgeState, db, nodeConfig));
  app.usePeriod(periodHandler(bridgeState));

  const lastGoodState = await bridgeState.loadState();

  app.listen(lastGoodState).then(async params => {
    blockTicker.subscribe(eventsRelay.onNewBlock);
    await printStartupInfo(params, bridgeState);

    const api = await jsonrpc(bridgeState, cliArgs.tendermintPort, db, app);
    api
      .listenHttp({ port: cliArgs.rpcport, host: cliArgs.rpcaddr })
      .then(addr => {
        logNode(
          `Http JSON RPC server is listening at ${addr.address}:${addr.port}`
        );
      });

    api.listenWs({ port: cliArgs.wsport, host: cliArgs.wsaddr }).then(addr => {
      logNode(
        `Ws JSON RPC server is listening at ${addr.address}:${addr.port}`
      );
    });
  });
}

run();

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});
