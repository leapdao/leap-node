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
const { Tx, Period } = require('parsec-lib');
const lotion = require('lotion');

const bridgeABI = require('./src/bridgeABI');
const validateTx = require('./src/validateTx');
const checkBridge = require('./src/checkBridge');
const accumulateTx = require('./src/accumulateTx');
const validateBlock = require('./src/validateBlock');
const updateValidators = require('./src/updateValidators');
const eventsRelay = require('./src/eventsRelay');
const { readSlots, getSlotsByAddr } = require('./src/utils');

const config = require('./config.json');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

if (!config.bridgeAddr) {
  console.error('bridgeAddr is required');
  process.exit(0);
}

async function run() {
  const web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(config.network));
  const bridge = new web3.eth.Contract(bridgeABI, config.bridgeAddr);

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
    createEmptyBlocks: false,
    logTendermint: false,
  });

  if (!config.privKey) {
    const { privateKey } = web3.eth.accounts.create();
    config.privKey = privateKey;
    await writeFile('./config.json', JSON.stringify(config, null, 2));
  }

  const account = web3.eth.accounts.privateKeyToAccount(config.privKey);

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
    await updateValidators(state, chainInfo, {
      web3,
      bridge,
    });
  });

  app.usePeriod(async (rsp, chainInfo, height) => {
    await checkBridge(rsp, chainInfo, height, {
      node,
      web3,
      bridge,
      account,
      privKey: config.privKey,
    });
  });

  app.listen(config.port).then(async params => {
    console.log(params);
    eventsRelay(params.GCI, web3, bridge);

    const validatorKeyPath = path.join(
      params.lotionPath,
      'config',
      'priv_validator.json'
    );

    const validatorKey = JSON.parse(await readFile(validatorKeyPath, 'utf-8'));
    const slots = await readSlots(bridge);
    const mySlots = await getSlotsByAddr(slots, account.address);

    mySlots.forEach(slot => {
      if (
        slot.tendermint.replace('0x', '').toLowerCase() !==
        validatorKey.address.toLowerCase()
      ) {
        console.log(
          `You need to update validator ID in slot ${slot.id} to ${
            validatorKey.address
          }`
        );
      }
    });

    if (mySlots.length === 0) {
      console.log('=====');
      console.log('You need to become a validator first');
      console.log('Open http://localhost:3001 and follow instruction');
      console.log(`Validator address: ${account.address}`);
      console.log(`Validator ID: ${validatorKey.address}`);
      console.log('=====');
    }
  });
}

run();
