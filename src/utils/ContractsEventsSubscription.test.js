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
    }),
    []
  );

  await sub.init();

  expect(fetched).toBe(true);
});

test('events fetching from same block', async () => {
  let fetched = false;
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts(() => {
      fetched = true;
    }),
    [],
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
    mockContracts(() => contractEvents),
    []
  );

  const events = await sub.init();
  expect(events).toEqual(contractEvents);
});

test('specific event', async () => {
  const contractEvents = [
    { event: 'NewDeposit' },
    { event: 'NewDeposit' },
    { event: 'NewExit' },
  ];
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts(event => {
      expect(event).toBe('NewExit');
      return contractEvents.slice(-1);
    }),
    [],
    null,
    'NewExit'
  );

  const events = await sub.init();
  expect(events).toEqual([{ event: 'NewExit' }]);
});

test('event emitter', async () => {
  const contractEvents = [
    { event: 'NewDeposit' },
    { event: 'NewDeposit' },
    { event: 'NewExit' },
  ];
  const sub = new ContractsEventsSubscription(
    mockWeb3(10),
    mockContracts(() => contractEvents),
    []
  );

  sub.addListener('newEvents', events => {
    expect(events).toEqual(contractEvents);
  });
  await sub.init();
});
