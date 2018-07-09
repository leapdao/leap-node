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

const cliArgs = require('./src/cliArgs');
const Db = require('./src/api/db');
const jsonrpc = require('./src/api/jsonrpc');

const bridgeABI = require('./src/bridgeABI');
const applyTx = require('./src/tx/applyTx');
const accumulateTx = require('./src/tx/accumulateTx');

const addBlock = require('./src/block/addBlock');
const updatePeriod = require('./src/block/updatePeriod');
const updateValidators = require('./src/block/updateValidators');

const checkBridge = require('./src/period/checkBridge');

const eventsRelay = require('./src/eventsRelay');
const ContractEventsSubscription = require('./src/eventsRelay/ContractEventsSubscription');
const { readSlots, getSlotsByAddr } = require('./src/utils');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

async function handleSlots(node, web3, bridge) {
  node.slots = await readSlots(bridge);

  const eventsSubscription = new ContractEventsSubscription(web3, bridge);
  await eventsSubscription.init();

  const updateSlots = async () => {
    node.slots = await readSlots(bridge);
  };
  eventsSubscription.on('ValidatorJoin', updateSlots);
  eventsSubscription.on('ValidatorLogout', updateSlots);
  eventsSubscription.on('ValidatorLeave', updateSlots);
  eventsSubscription.on('ValidatorUpdate', updateSlots);
}

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
    },
    networkId: config.network,
    genesis: config.genesis,
    abciPort: 26658,
    peers: config.peers,
    p2pPort: cliArgs.p2pPort,
    tendermintPort: 26659,
    createEmptyBlocks: false,
    logTendermint: true,
  });

  const privFilename = path.join(path.dirname(cliArgs.config), '.priv');
  if (await exists(privFilename)) {
    config.privKey = await readFile(privFilename);
  } else {
    const { privateKey } = web3.eth.accounts.create();
    config.privKey = privateKey;
    await writeFile(privFilename, privateKey);
  }

  const db = Db(app);

  const node = {
    blockHeight: 0,
    currentState: null,
    networkId: config.network,
    currentPeriod: new Period(),
    previousPeriod: null,
    lastBlockSynced: await db.getLastBlockSynced(),
  };

  await handleSlots(node, web3, bridge);

  const account = web3.eth.accounts.privateKeyToAccount(config.privKey);

  app.useInitChain(chainInfo => {
    if (!cliArgs.no_validators_updates) {
      updateValidators(chainInfo, node.slots);
    }
  });

  app.useTx(async (state, { encoded }) => {
    const tx = Tx.fromRaw(encoded);
    await applyTx(state, tx, bridge);
    accumulateTx(state, tx);
  });

  app.useBlock(async (state, chainInfo) => {
    updatePeriod(chainInfo, {
      bridge,
      web3,
      account,
      node,
    });
    await addBlock(state, chainInfo, {
      account,
      node,
      db,
    });
    if (!cliArgs.no_validators_updates) {
      updateValidators(chainInfo, node.slots);
    }
    console.log('Height:', chainInfo.height);
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
      account,
      privKey: config.privKey,
    });
  });

  app.listen(cliArgs.port).then(async params => {
    console.log(params);

    console.log(`Last block synced: ${node.lastBlockSynced}`);

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

    await eventsRelay(params.txServerPort, web3, bridge);
    const api = await jsonrpc(node, params.txServerPort, db, web3, bridge);
    api
      .listenHttp({ port: cliArgs.rpcport, host: cliArgs.rpcaddr })
      .then(addr => {
        console.log(
          `Http JSON RPC server is listening at ${addr.address}:${addr.port}`
        );
      });

    api.listenWs({ port: cliArgs.wsport, host: cliArgs.wsaddr }).then(addr => {
      console.log(
        `Ws JSON RPC server is listening at ${addr.address}:${addr.port}`
      );
    });
  });
}

run();
