/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const EventEmitter = require('events');

module.exports = class ContractEventsSubscription extends EventEmitter {
  constructor(web3, contract, fromBlock = null) {
    super();

    this.fromBlock = fromBlock;
    this.web3 = web3;
    this.contract = contract;
  }

  async init() {
    setInterval(() => this.fetchEvents(), 5 * 1000);
    return this.fetchEvents();
  }

  async fetchEvents() {
    const blockNumber = await this.web3.eth.getBlockNumber();

    if (this.fromBlock === blockNumber) {
      return null;
    }

    const options = {
      fromBlock: this.fromBlock || 0,
      toBlock: blockNumber,
    };

    const events = await this.contract.getPastEvents('allEvents', options);

    this.emit('events', events);

    this.fromBlock = blockNumber;

    return events;
  }
};
