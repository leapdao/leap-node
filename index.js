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
const applyTx = require('./src/tx/applyTx');
const accumulateTx = require('./src/tx/accumulateTx');

const addBlock = require('./src/block/addBlock');
const submitPeriod = require('./src/block/submitPeriod');
const updateValidators = require('./src/block/updateValidators');

const checkBridge = require('./src/period/checkBridge');

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
  node.slots = await readSlots(bridge);

  const app = lotion({
    initialState: {
      mempool: [],
      balances: {}, // stores account balances
      unspent: {}, // stores unspent outputs (deposits, transfers)
      processedDeposit: 0,
    },
    abciPort: 26658,
    tendermintPort: 26659,
    createEmptyBlocks: false,
    logTendermint: true,
  });

  if (!config.privKey) {
    const { privateKey } = web3.eth.accounts.create();
    config.privKey = privateKey;
    await writeFile('./config.json', JSON.stringify(config, null, 2));
  }

  const account = web3.eth.accounts.privateKeyToAccount(config.privKey);

  app.useInitChain(chainInfo => {
    updateValidators(chainInfo, node.slots);
  });

  app.useTx(async (state, { encoded }) => {
    const tx = Tx.fromRaw(encoded);
    await applyTx(state, tx, bridge);
    accumulateTx(state, tx);
  });

  app.useBlock((state, chainInfo) => {
    submitPeriod(chainInfo, {
      bridge,
      web3,
      account,
      node,
    });
    addBlock(state, chainInfo, {
      account,
      node,
    });
    updateValidators(chainInfo, node.slots);
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

    const validatorKeyPath = path.join(
      params.lotionPath,
      'config',
      'priv_validator.json'
    );

    const validatorKey = JSON.parse(await readFile(validatorKeyPath, 'utf-8'));
    const validatorID = Buffer.from(
      validatorKey.pub_key.value,
      'base64'
    ).toString('hex');
    const mySlots = await getSlotsByAddr(node.slots, account.address);

    mySlots.forEach(slot => {
      if (
        slot.tendermint.replace('0x', '').toLowerCase() !==
        validatorID.toLowerCase()
      ) {
        console.log(
          `You need to update validator ID in slot ${slot.id} to ${validatorID}`
        );
      }
    });

    if (mySlots.length === 0) {
      console.log('=====');
      console.log('You need to become a validator first');
      console.log('Open http://localhost:3001 and follow instruction');
      console.log(`Validator address: ${account.address}`);
      console.log(`Validator ID: ${validatorID}`);
      console.log('=====');
    }

    const subscription = await eventsRelay(params.GCI, web3, bridge);
    const updateSlots = async () => {
      node.slots = await readSlots(bridge);
    };
    subscription.on('ValidatorJoin', updateSlots);
    subscription.on('ValidatorLogout', updateSlots);
    subscription.on('ValidatorLeave', updateSlots);
    subscription.on('ValidatorUpdate', updateSlots);
  });
}

run();
