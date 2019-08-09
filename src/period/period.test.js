const periodHandler = require('./index');

jest.mock('../txHelpers/submitPeriod');
jest.mock('../period/submitPeriodVote');

const submitPeriodVote = require('../period/submitPeriodVote');

const sender = () => {};

const EXISTENT_PERIOD = {
  prevHash: '0x000000',
  merkleRoot() {
    return '0x000010';
  },
};

const NON_EXISTENT_PERIOD = {
  prevHash: '0x000001',
  merkleRoot() {
    return '0x000011';
  },
};

describe('Period handler', () => {
  test('Do not check genesis period', async () => {
    const rsp = {};
    await periodHandler({})(rsp, { height: 32 });
    expect(rsp.status).toBe(1);
  });

  test('Existent prev period', async () => {
    const rsp = {};
    const bridgeState = {
      previousPeriod: EXISTENT_PERIOD,
      currentState: {
        slots: [],
      },
      checkCallsCount: 0,
    };
    await periodHandler(bridgeState, sender)(rsp, { height: 64 });
    expect(submitPeriodVote).toBeCalledWith(
      EXISTENT_PERIOD,
      bridgeState,
      sender
    );
    expect(rsp.status).toBe(0);
    expect(bridgeState.checkCallsCount).toBe(1);
  });

  test('Non-existent prev period', async () => {
    const rsp = {};
    const bridgeState = {
      previousPeriod: NON_EXISTENT_PERIOD,
      currentState: {
        slots: [],
      },
      checkCallsCount: 0,
    };
    await periodHandler(bridgeState)(rsp, { height: 64 });
    expect(rsp.status).toBe(1);
  });
});
