const ContractEventsSubscription = require('./ContractEventsSubscription');

const mockWeb3 = blockNumber => ({
  eth: {
    async getBlockNumber() {
      return blockNumber;
    },
  },
});

const mockContract = getPastEvents => ({
  getPastEvents,
});

test('events fetching', async () => {
  let fetched = false;
  const sub = new ContractEventsSubscription(
    mockWeb3(10),
    mockContract((event, options) => {
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

test('events fetching from same block', async () => {
  let fetched = false;
  const sub = new ContractEventsSubscription(
    mockWeb3(10),
    mockContract(() => {
      fetched = true;
    }),
    10
  );

  await sub.init();

  expect(fetched).toBe(false);
});

test('events groupping', async () => {
  const sub = new ContractEventsSubscription(
    mockWeb3(10),
    mockContract(() => [
      { event: 'NewDeposit' },
      { event: 'NewDeposit' },
      { event: 'NewExit' },
    ])
  );

  const events = await sub.fetchEvents();
  expect(typeof events).toBe('object');
  expect(events.NewDeposit).toBeDefined();
  expect(events.NewDeposit.length).toBe(2);
  expect(events.NewExit).toBeDefined();
  expect(events.NewExit.length).toBe(1);
});

test('init', async () => {
  const sub = new ContractEventsSubscription(
    mockWeb3(10),
    mockContract(() => [
      { event: 'NewDeposit' },
      { event: 'NewDeposit' },
      { event: 'NewExit' },
    ])
  );

  const events = await sub.init();
  expect(typeof events).toBe('object');
  expect(events.NewDeposit).toBeDefined();
  expect(events.NewDeposit.length).toBe(2);
  expect(events.NewExit).toBeDefined();
  expect(events.NewExit.length).toBe(1);
});

test('emitter', async () => {
  const sub = new ContractEventsSubscription(
    mockWeb3(10),
    mockContract(() => [
      { event: 'NewDeposit' },
      { event: 'NewDeposit' },
      { event: 'NewExit' },
    ])
  );

  let depositEmitted = false;
  sub.on('NewDeposit', depositEvents => {
    depositEmitted = true;
    expect(depositEvents).toBeDefined();
    expect(depositEvents.length).toBe(2);
  });

  let exitEmitted = false;
  sub.on('NewExit', exitEvents => {
    exitEmitted = true;
    expect(exitEvents).toBeDefined();
    expect(exitEvents.length).toBe(1);
  });

  await sub.init();

  expect(depositEmitted).toBe(true);
  expect(exitEmitted).toBe(true);
});
