const EventEmitter = require('events');

module.exports = class ContractEventsSubscription extends EventEmitter {
  constructor(web3, contract, lookAheadPeriod) {
    super();

    this.fromBlock = null;
    this.web3 = web3;
    this.contract = contract;
    this.lookAheadPeriod = lookAheadPeriod;

    this.fetchEvents();
    setInterval(() => this.fetchEvents(), 60 * 2 * 1000);
  }

  async fetchEvents() {
    const blockNumber = await this.web3.eth.getBlockNumber();
    if (this.fromBlock || this.lookAheadPeriod) {
      const options = {
        fromBlock: this.fromBlock || blockNumber - this.lookAheadPeriod,
        toBlock: 'latest',
      };

      const events = await this.contract.getPastEvents('allEvents', options);

      events.forEach(event => {
        this.emit(event.event, event);
      });
    }
    this.fromBlock = blockNumber;
  }
};
