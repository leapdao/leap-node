/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = class ContractsEventsSubscription {
  constructor(web3, contracts, eventsBuffer, fromBlock = null) {
    this.fromBlock = fromBlock;
    this.web3 = web3;
    this.contracts = contracts;
    this.eventsBuffer = eventsBuffer;
  }

  async init() {
    this.contracts.forEach(contract => {
      contract.events.allEvents({ fromBlock: this.fromBlock }, (err, event) => {
        if (err) return console.log('Error', err);
        if (!event) return false;
        this.eventsBuffer.push(event);
        return true;
      });
    });
  }
};
