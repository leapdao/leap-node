/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period, Outpoint } = require('parsec-lib');
const ContractEventsSubscription = require('./eventsRelay/ContractEventsSubscription');
const { handleEvents } = require('./utils');

module.exports = class Node {
  constructor(db, web3, bridge, config) {
    this.db = db;
    this.web3 = web3;
    this.bridge = bridge;
    this.replay = true;
    this.blockHeight = 0;
    this.currentState = null;
    this.networkId = config.networkId;
    this.currentPeriod = new Period();
    this.previousPeriod = null;
    this.deposits = {};
    this.exits = {};
    this.account = web3.eth.accounts.privateKeyToAccount(config.privKey);
  }

  async init() {
    this.lastBlockSynced = await this.db.getLastBlockSynced();
    await this.watchContractEvents();
  }

  async watchContractEvents() {
    const eventsSubscription = new ContractEventsSubscription(
      this.web3,
      this.bridge
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
      })
    );
    await eventsSubscription.init();
  }
};
