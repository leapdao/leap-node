const ContractsEventsSubscription = require('./ContractsEventsSubscription');

const mockWeb3 = blockNumber => ({
  eth: {
    async getBlockNumber() {
      return blockNumber;
    },
    async getBlock(block) {
      return {
        number: block,
        timestamp: block * 100000,
      };
    },
  },
});

const mockContracts = getPastEvents => [
  {
    getPastEvents,
  },
];

test('events fetching', async () => {
  let fetched = false;
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts((event, options) => {
      expect(event).toBe('allEvents');
      expect(options.fromBlock).toBe(0);
      expect(options.toBlock).toBe(10);
      fetched = true;

      return [];
    })
  );

  await sub.init();

  expect(fetched).toBe(true);
});

test('events handling', async () => {
  let handled = false;
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts((event, options) => {
      expect(event).toBe('allEvents');
      expect(options.fromBlock).toBe(0);
      expect(options.toBlock).toBe(10);

      return [];
    })
  );

  sub.handlers = [
    async () => {
      handled = true;
    },
  ];
  await sub.handleEvents([]);

  expect(handled).toBe(true);
});

test('subscribe/unsubscribe', async () => {
  const handler1 = () => {};
  const handler2 = () => {};
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts((event, options) => {
      expect(event).toBe('allEvents');
      expect(options.fromBlock).toBe(0);
      expect(options.toBlock).toBe(10);

      return [];
    })
  );

  const s1 = sub.subscribe(handler1);
  expect(sub.handlers).toEqual([handler1]);
  const s2 = sub.subscribe(handler2);
  expect(sub.handlers).toEqual([handler1, handler2]);
  s1();
  expect(sub.handlers).toEqual([handler2]);
  s2();
  expect(sub.handlers).toEqual([]);
});

test('events fetching from same block', async () => {
  let fetched = false;
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts(() => {
      fetched = true;
    }),
    10
  );

  await sub.init();

  expect(fetched).toBe(false);
});

test('init', async () => {
  const contractEvents = [
    { event: 'NewDeposit' },
    { event: 'NewDeposit' },
    { event: 'NewExit' },
  ];
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts(() => contractEvents)
  );

  const events = await sub.init();
  expect(events).toEqual(contractEvents);
});

test('emitter', async () => {
  const contractEvents = [
    { event: 'NewDeposit' },
    { event: 'NewDeposit' },
    { event: 'NewExit' },
  ];
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts(() => contractEvents)
  );

  let emitted = false;
  sub.subscribe(events => {
    emitted = true;
    expect(events).toEqual(contractEvents);
  });

  await sub.init();

  expect(emitted).toBe(true);
});
