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

const cliArgs = require('./src/cliArgs');
const cleanupLotion = require('./src/cleanupLotion');
const readConfig = require('./src/readConfig');
const Db = require('./src/api/db');
const jsonrpc = require('./src/api/jsonrpc');

const txHandler = require('./src/tx');
const blockHandler = require('./src/block');
const periodHandler = require('./src/period');

const eventsRelay = require('./src/eventsRelay');
const { printStartupInfo } = require('./src/utils');
const BridgeState = require('./src/bridgeState');
const lotion = require('./lotion');

const { logParsec, logTendermint } = require('./src/debug');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

async function run() {
  const config = await readConfig(cliArgs.config);

  const app = lotion({
    initialState: {
      mempool: [],
      balances: {}, // stores account balances like this { [colorIndex]: { address1: 0, ... } }
      storageRoots: {},
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

  const db = Db(path.join(app.lotionPath(), 'parsec.db'));

  const privFilename = path.join(path.dirname(cliArgs.config), '.priv');
  if (await exists(privFilename)) {
    config.privKey = await readFile(privFilename);
  }

  const bridgeState = new BridgeState(db, config);
  await bridgeState.init();

  await writeFile(privFilename, bridgeState.account.privateKey);

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
