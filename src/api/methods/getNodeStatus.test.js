/* eslint-disable camelcase */

const getNodeStatus = require('./getNodeStatus');

const fakeApp = sync_info => ({
  status: async () => ({ sync_info }),
});

describe('getNodeStatus', () => {
  test('catching-up', async () => {
    const status = await getNodeStatus({}, fakeApp({ catching_up: true }));
    expect(status).toBe('catching-up');
  });

  test('waiting-for-period', async () => {
    const status = await getNodeStatus({ checkCallsCount: 1 }, fakeApp({}));
    expect(status).toBe('waiting-for-period');
  });

  test('ok', async () => {
    const status = await getNodeStatus({}, fakeApp({}));
    expect(status).toBe('ok');
  });
});
