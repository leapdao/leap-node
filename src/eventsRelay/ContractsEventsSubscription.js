/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const EventEmitter = require('events');
const getBlockAverageTime = require('../utils/getBlockAverageTime');

const BATCH_SIZE = 5000;
async function getPastEvents(contract, fromBlock, toBlock) {
  const batchCount = Math.ceil((toBlock - fromBlock) / BATCH_SIZE);
  const events = [];

  for (let i = 0; i < batchCount; i += 1) {
    /* eslint-disable no-await-in-loop */
    events.push(
      await contract.getPastEvents('allEvents', {
        fromBlock: i * BATCH_SIZE + fromBlock,
        toBlock: Math.min(toBlock, i * BATCH_SIZE + fromBlock + BATCH_SIZE),
      })
    );
    /* eslint-enable */
  }

  return events.reduce((result, ev) => result.concat(ev), []);
}

module.exports = class ContractsEventsSubscription extends EventEmitter {
  constructor(web3, contracts, fromBlock = null) {
    super();
    this.fromBlock = fromBlock;
    this.web3 = web3;
    this.contracts = contracts;
    this.fetchEvents = this.fetchEvents.bind(this);
  }

  async init() {
    const initialEvetns = await this.fetchEvents();
    const eventsInterval = Math.max(
      1,
      (await getBlockAverageTime(this.web3)) * 0.7
    );
    setInterval(this.fetchEvents, eventsInterval * 1000);
    return initialEvetns;
  }

  async fetchEvents() {
    const blockNumber = await this.web3.eth.getBlockNumber();

    if (this.fromBlock === blockNumber) {
      return null;
    }

    const eventsList = await Promise.all(
      this.contracts.map(contract => {
        return getPastEvents(contract, this.fromBlock || 0, blockNumber);
      })
    );
    const events = eventsList.reduce((acc, evnts) => acc.concat(evnts), []);

    this.emit('events', events);

    this.fromBlock = blockNumber;

    return events;
  }
};
