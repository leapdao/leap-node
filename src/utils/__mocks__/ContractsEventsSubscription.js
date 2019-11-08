const EventEmitter = require('events');

let eventsBatches = [];

class ContractsEventsSubscriptionMock extends EventEmitter {
  constructor() {
    super();
    this.fetchEvents = this.fetchEvents.bind(this);
    this.fetchCounts = 0;
    this.handlers = [];
  }

  subscribe(handler) {
    this.handlers.push(handler);
  }

  async init() {
    const initialEvetns = await this.fetchEvents();
    return initialEvetns;
  }

  async fetchEvents() {
    const events = eventsBatches[this.fetchCounts] || [];
    this.fetchCounts += 1;

    this.handlers.forEach(handler => handler(events));
    this.emit('newEvents', events);
    return events;
  }
}

/* eslint-disable */
ContractsEventsSubscriptionMock.__setEventBatches = batches => {
  eventsBatches = batches;
};

module.exports = ContractsEventsSubscriptionMock;
