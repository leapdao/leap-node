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
    const deposits = await Promise.all(
      events.map(event =>
        this.bridgeContract.methods
          .deposits(event.returnValues.depositId)
          .call()
      )
    );
    if (events.length > 0) {
      this.emit('deposits', deposits);
    }
    this.fromBlock = blockNumber;
  }
};
