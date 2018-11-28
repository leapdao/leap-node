/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

const cliArgs = require('./src/utils/cliArgs');
const cleanupLotion = require('./src/utils/cleanupLotion');
const readConfig = require('./src/utils/readConfig');
const { readPrivKey, writePrivKey } = require('./src/utils/privKey');
const Db = require('./src/api/db');
const jsonrpc = require('./src/api/jsonrpc');

const txHandler = require('./src/tx');
const blockHandler = require('./src/block');
const periodHandler = require('./src/period');

const eventsRelay = require('./src/eventsRelay');
const { printStartupInfo } = require('./src/utils');
const BridgeState = require('./src/bridgeState');
const lotion = require('./lotion');

const { logNode, logTendermint } = require('./src/utils/debug');

async function run() {
  const config = await (async () => {
    let result;
    try {
      result = readConfig(cliArgs.config);
    } catch (err) {
      console.error(err.message);
      process.exit(0);
    }

    return result;
  })();

  const app = lotion({
    initialState: {
      mempool: [],
      balances: {}, // stores account balances like this { [colorIndex]: { address1: 0, ... } }
      owners: {}, // index for NFT ownerOf call
      unspent: {}, // stores unspent outputs (deposits, transfers)
      processedDeposit: 0,
      slots: [],
      epoch: {
        epoch: 0,
        lastEpochHeight: 0,
        epochLength: null,
        epochLengthIndex: -1,
      },
    },
    networkId: `${config.network}-${config.networkId}`,
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
    process.exit(0);
  }

  const db = Db(app);

  await readPrivKey(app, config, cliArgs);

  const bridgeState = new BridgeState(db, config);
  await bridgeState.init();

  await writePrivKey(app, cliArgs, bridgeState.account.privateKey);

  app.useTx(txHandler(bridgeState));
  app.useBlock(blockHandler(bridgeState, db, cliArgs.no_validators_updates));
  app.usePeriod(periodHandler(bridgeState));

  app.listen(cliArgs.port).then(async params => {
    await eventsRelay(
      params.txServerPort,
      bridgeState.web3,
      bridgeState.contract
    );
    await printStartupInfo(params, bridgeState);

    const api = await jsonrpc(bridgeState, params.txServerPort, db, app);
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
