/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

const fs = require('fs');
const { promisify } = require('util');
const Web3 = require('web3');
const { Tx, Period } = require('parsec-lib');
const lotion = require('lotion');

const bridgeABI = require('./src/bridgeABI');
const validateTx = require('./src/validateTx');
const checkBridge = require('./src/checkBridge');
const accumulateTx = require('./src/accumulateTx');
const validateBlock = require('./src/validateBlock');
const eventsRelay = require('./src/eventsRelay');
const { delay } = require('./src/utils');

const config = require('./config.json');

const writeFile = promisify(fs.writeFile);

if (!config.bridgeAddr) {
  console.error('bridgeAddr is required');
  process.exit(0);
}

async function run() {
  const web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(config.network));
  const bridge = new web3.eth.Contract(bridgeABI, config.bridgeAddr);

  if (!config.privKey) {
    // ToDo: try to use private key from tendermint
    const { privateKey } = web3.eth.accounts.create();
    config.privKey = privateKey;
    await writeFile('./config.json', JSON.stringify(config, null, 2));
  }

  const account = web3.eth.accounts.privateKeyToAccount(config.privKey);

  const node = {
    currentPeriod: new Period(),
    previousPeriod: null,
  };

  const app = lotion({
    initialState: {
      mempool: [],
      balances: {}, // stores account balances
      unspent: {}, // stores unspent outputs (deposits, transfers)
    },
    abciPort: 46658,
  });

  app.useInitializer(async () => {
    const isValidator = false; // check if account.address in validators list

    if (!isValidator) {
      console.log('=====');
      console.log('You need to become a validator first');
      console.log('Open http://localhost:/3001 and follow instruction');
      console.log(`Your validator address will be: ${account.address}`);
      console.log('=====');

      await delay(2000); // waiting for join here
    }

    /*
     * Check if addr in validators list here (how? read all events?)
     * ----------------------------------------------------------
     * Join here if add is not a validator. How to set a stake?
     * Maybe we should handle it outside the node.
     * So validator should join somewhere (on join page)
     * and after that run the node? Or init handler can wait for
     * ValidatorJoin event with validator addr
     * ----------------------------------------------------------
     * How to update voting power in tendermint here?
     * As an option, ValidatorJoin/ValidatorLeave events
     * can be used to broadcast special tx (not from parsec-lib)
     *
     * Each node should check address from event with own
     * address (we need private key?). If it's match, then
     * node should update voting power of validator that run it.
     *
     * Voting power can be changed in useTx handler
     * by mutating validators object in chainInfo param
     *
     * Validator address/pubKey (pubKey base64 using for validators object keys)
     * can be found in $LOTION_PATH/config/priv_validator.json
     */
  });

  app.useTx(async (state, { encoded }) => {
    const tx = Tx.fromRaw(encoded);
    await validateTx(state, tx, bridge);
    accumulateTx(state, tx);
  });

  app.useBlock(async (state, chainInfo) => {
    await validateBlock(state, chainInfo, {
      web3,
      bridge,
      account,
      privKey: config.privKey,
      node,
    });
  });

  app.usePeriod(async (rsp, chainInfo, height) => {
    await checkBridge(rsp, chainInfo, height, {
      node,
      web3,
    });
  });

  app.listen(config.port).then(params => {
    console.log(params);
    eventsRelay(params.GCI, web3, bridge);
  });
}

run();
