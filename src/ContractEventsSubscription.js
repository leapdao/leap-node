/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const EventEmitter = require('events');

module.exports = class ContractEventsSubscription extends EventEmitter {
  constructor(web3, contract) {
    super();

    this.fromBlock = null;
    this.web3 = web3;
    this.contract = contract;
  }

  async init() {
    setInterval(() => this.fetchEvents(), 5 * 1000);
    return this.fetchEvents();
  }

  async fetchEvents() {
    const blockNumber = await this.web3.eth.getBlockNumber();
    const groups = {};
    const options = {
      fromBlock: this.fromBlock || 0,
      toBlock: 'latest',
    };

    const events = await this.contract.getPastEvents('allEvents', options);

    events.forEach(event => {
      groups[event.event] = groups[event.event] || [];
      groups[event.event].push(event);
    });

    if (!this.fromBlock) {
      Object.keys(groups).forEach(group => {
        this.emit(group, groups[group]);
      });
    }

    this.fromBlock = blockNumber;

    return groups;
  }
};
