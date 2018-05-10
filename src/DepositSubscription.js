const EventEmitter = require('events');

module.exports = class DepositSubscription extends EventEmitter {
  constructor(web3, bridgeContract) {
    super();

    this.fromBlock = null;
    this.web3 = web3;
    this.bridgeContract = bridgeContract;

    this.fetchEvents();
    setInterval(() => this.fetchEvents(), 60 * 2 * 1000);
  }

  async fetchEvents() {
    const blockNumber = await this.web3.eth.getBlockNumber();
    const options = {
      fromBlock: this.fromBlock || blockNumber - 100,
      toBlock: 'latest',
    };

    const events = await this.bridgeContract.getPastEvents(
      'NewDeposit',
      options
    );
    console.log(events);
    if (events.length > 0) {
      this.emit('events', events);
    }
    this.fromBlock = blockNumber;
  }
};
