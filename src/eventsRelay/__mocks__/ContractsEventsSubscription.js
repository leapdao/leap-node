const EventEmitter = require('events');

let eventsBatches = [];

class ContractsEventsSubscriptionMock extends EventEmitter {
  constructor() {
    super();
    this.fetchEvents = this.fetchEvents.bind(this);
    this.fetchCounts = 0;
  }

  async init() {
    const initialEvetns = await this.fetchEvents();
    return initialEvetns;
  }

  async fetchEvents() {
    const events = eventsBatches[this.fetchCounts] || [];
    this.fetchCounts += 1;

    this.emit('events', events);

    return events;
  }
}

/* eslint-disable */
ContractsEventsSubscriptionMock.__setEventBatches = batches => {
  eventsBatches = batches;
};

module.exports = ContractsEventsSubscriptionMock;
