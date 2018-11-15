const handleEvents = require('./handleEvents');

describe('handleEvents', () => {
  test('only capitalized event names', () => {
    expect(() => {
      handleEvents({
        event: () => null,
      });
    }).toThrow('Event name should start with a capital letter');
  });

  test('handle emitted events', async () => {
    const handledEvents = [];
    const events = [
      {
        event: 'Event2',
        id: 0,
      },
      {
        event: 'Event1',
        id: 1,
      },
      {
        event: 'Event4',
        id: 2,
      },
      {
        event: 'Event2',
        id: 3,
      },
    ];
    const asyncHandler = async e => {
      handledEvents.push(e);
    };
    const syncHandler = e => {
      handledEvents.push(e);
    };
    const handlers = handleEvents({
      Event1: asyncHandler,
      Event2: syncHandler,
    });

    await handlers(events);
    expect(handledEvents).toEqual([events[0], events[1], events[3]]);
  });
});
