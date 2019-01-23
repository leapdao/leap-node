const getBlockAverageTime = require('./getBlockAverageTime');

module.exports = class BlockTicker {
  constructor(web3, subscribers = []) {
    this.web3 = web3;
    this.subscribers = subscribers;
    this.latestBlock = this.latestBlock.bind(this);
    this.lastSeenBlock = 0;
  }

  subscribe(subscriber) {
    this.subscribers.push(subscriber);
  }

  async init() {
    const interval = Math.max(1, (await getBlockAverageTime(this.web3)) * 0.7);
    setInterval(this.latestBlock, interval * 1000);
  }

  async latestBlock() {
    const blockNumber = await this.web3.eth.getBlockNumber();
    if (blockNumber > this.lastSeenBlock) {
      this.lastSeenBlock = blockNumber;
      for (const subscriber of this.subscribers) {
        subscriber(blockNumber);
      }
    }
  }
};
