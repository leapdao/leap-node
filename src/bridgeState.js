/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const Web3 = require('web3');
const { Period, Outpoint } = require('parsec-lib');
const bridgeABI = require('./bridgeABI');
const ContractEventsSubscription = require('./eventsRelay/ContractEventsSubscription');
const { handleEvents, getGenesisBlock } = require('./utils');

module.exports = class BridgeState {
  constructor(db, config) {
    this.config = config;
    this.web3 = new Web3();
    this.web3.setProvider(
      new this.web3.providers.HttpProvider(config.rootNetwork)
    );
    this.contract = new this.web3.eth.Contract(bridgeABI, config.bridgeAddr);
    this.account = config.privKey
      ? this.web3.eth.accounts.privateKeyToAccount(config.privKey)
      : this.web3.eth.accounts.create();

    this.db = db;
    this.blockHeight = 0;
    this.currentState = null;
    this.networkId = config.networkId;
    this.currentPeriod = new Period();
    this.previousPeriod = null;
    this.deposits = {};
    this.exits = {};
    this.epochLengths = [];
  }

  async init() {
    this.lastBlockSynced = await this.db.getLastBlockSynced();
    await this.watchContractEvents();
  }

  async watchContractEvents() {
    const genesisBlock = await getGenesisBlock(this.web3, this.contract);
    const eventsSubscription = new ContractEventsSubscription(
      this.web3,
      this.contract,
      genesisBlock
    );

    eventsSubscription.on(
      'events',
      handleEvents({
        NewDeposit: ({ returnValues: event }) => {
          this.deposits[event.depositId] = {
            depositor: event.depositor,
            color: event.color,
            amount: event.amount,
          };
        },
        ExitStarted: ({ returnValues: event }) => {
          const outpoint = new Outpoint(event.txHash, event.outIndex);
          this.exits[outpoint.getUtxoId()] = {
            txHash: event.txHash,
            outIndex: event.outIndex,
            exitor: event.exitor,
            color: event.color,
            amount: event.amount,
          };
        },
        EpochLength: ({ returnValues: event }) => {
          this.epochLengths.push(Number(event.epochLength));
        },
      })
    );
    await eventsSubscription.init();
  }
};
