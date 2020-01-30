// eslint-disable-next-line import/no-extraneous-dependencies
const PromiEvent = require('web3-core-promievent');

const periodHandler = require('./index');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const ADDR_1 = '0xd56f7dfcd2baffbc1d885f0266b21c7f2912020c';

jest.mock('../validator/periods/submitPeriod');
const submitPeriod = require('../validator/periods/submitPeriod');

const state = {};

const web3 = {
  eth: {
    getTransactionReceipt: () => null,
    getTransaction: () => ({ nonce: 3 }),
  },
};

const proposal = extra => ({
  blocksRoot: '0x000010',
  proposerSlotId: 0,
  prevPeriodRoot: '0x5678',
  votes: [0, 1],
  ...extra,
});

const bridgeStateMock = periodProposal => ({
  web3,
  currentState: {
    slots: [{ id: 0, signerAddr: ADDR }, { id: 1, signerAddr: ADDR_1 }],
  },
  checkCallsCount: 0,
  stalePeriodProposal: periodProposal,
  db: {
    setStalePeriodProposal: jest.fn(),
    getPeriodDataByBlocksRoot: () => null,
  },
});

describe('Period handler', () => {
  let txPromise;

  beforeEach(() => {
    txPromise = new PromiEvent();
    submitPeriod.mockReturnValue(
      Promise.resolve({ receiptPromise: txPromise.eventEmitter })
    );
    web3.eth.getTransactionReceipt = () => ({ status: true });
  });

  test('Do not check genesis period', async () => {
    const rsp = {};
    const periodProposal = proposal();
    await periodHandler({ periodProposal })(rsp, state, { height: 32 });
    expect(rsp.status).toBe(1);
  });

  test('no period proposal', async () => {
    const rsp = {};
    await periodHandler({})(rsp, state, { height: 64 });
    expect(rsp.status).toBe(1);
  });

  test('period is on chain', async () => {
    const rsp = {};
    const periodProposal = proposal();
    const bridgeState = {
      ...bridgeStateMock(periodProposal),
      db: {
        setStalePeriodProposal: jest.fn(),
        getPeriodDataByBlocksRoot: blocksRoot =>
          blocksRoot === '0x000010' ? { blocksRoot } : null,
      },
    };

    await periodHandler(bridgeState)(rsp, state, { height: 64 });
    expect(rsp.status).toBe(1);
    expect(bridgeState.db.setStalePeriodProposal).toBeCalledWith(null);
    expect(bridgeState.stalePeriodProposal).toEqual(null);
  });

  test('waiting for resubmission to land', async () => {
    const rsp = {};
    const periodProposal = proposal();
    const bridgeState = {
      ...bridgeStateMock(periodProposal),
      checkCallsCount: 1,
    };

    await periodHandler(bridgeState)(rsp, state, { height: 64 });
    expect(rsp.status).toBe(0);
    expect(bridgeState.checkCallsCount).toEqual(2);
  });

  describe('not submitted', () => {
    let rsp;
    let periodProposal;
    let bridgeState;

    beforeEach(() => {
      rsp = {};
      periodProposal = proposal();
      bridgeState = bridgeStateMock(periodProposal);
    });

    test('submission success', async () => {
      txPromise.resolve({ status: true });

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      expect(periodProposal.proposerSlotId).toEqual(1);
      expect(bridgeState.db.setStalePeriodProposal).toBeCalledWith(
        periodProposal
      );
      expect(submitPeriod).toBeCalledWith(periodProposal, bridgeState, {});

      expect(rsp.status).toBe(0);
    });

    test('submission success after switching over the slot', async () => {
      txPromise.resolve({ status: true });
      bridgeState = {
        ...bridgeStateMock(periodProposal),
        checkCallsCount: 10,
      };

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      expect(periodProposal.proposerSlotId).toEqual(1);
      expect(bridgeState.db.setStalePeriodProposal).toBeCalledWith(
        periodProposal
      );
      expect(submitPeriod).toBeCalledWith(periodProposal, bridgeState, {});

      expect(rsp.status).toBe(0);
      expect(bridgeState.checkCallsCount).toEqual(1);
    });

    test('submission failure', async () => {
      txPromise.resolve({ status: false });

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      expect(periodProposal.proposerSlotId).toEqual(1);
      expect(bridgeState.db.setStalePeriodProposal).toBeCalledWith(
        periodProposal
      );
      expect(submitPeriod).toBeCalledWith(periodProposal, bridgeState, {});

      expect(rsp.status).toBe(0);
    });

    test('submission stuck in a mempool', async () => {
      txPromise.resolve(null);

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      expect(periodProposal.proposerSlotId).toEqual(1);
      expect(bridgeState.db.setStalePeriodProposal).toBeCalledWith(
        periodProposal
      );
      expect(submitPeriod).toBeCalledWith(periodProposal, bridgeState, {});

      expect(rsp.status).toBe(0);
    });
  });

  describe('stuck in a mempool', () => {
    let rsp;
    let periodProposal;
    let bridgeState;

    beforeEach(() => {
      rsp = {};
      periodProposal = proposal({ txHash: '0xdeadbeef' });
      bridgeState = bridgeStateMock(periodProposal);
      web3.eth.getTransactionReceipt = () => Promise.resolve(null);
    });

    test('resubmission success', async () => {
      txPromise.resolve({ status: true });

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      // same slot
      expect(periodProposal.proposerSlotId).toEqual(0);

      expect(submitPeriod).toBeCalledWith(
        periodProposal,
        bridgeState,
        { nonce: 3 } // same nonce
      );

      expect(rsp.status).toBe(0);
    });

    test('resubmission failure', async () => {
      txPromise.resolve({ status: false });

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      // same slot
      expect(periodProposal.proposerSlotId).toEqual(0);

      expect(submitPeriod).toBeCalledWith(
        periodProposal,
        bridgeState,
        { nonce: 3 } // same nonce
      );

      expect(rsp.status).toBe(0);
    });

    test('resubmission stuck in a mempool', async () => {
      txPromise.resolve(null);

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      // same slot
      expect(periodProposal.proposerSlotId).toEqual(0);

      expect(submitPeriod).toBeCalledWith(
        periodProposal,
        bridgeState,
        { nonce: 3 } // same nonce
      );

      expect(rsp.status).toBe(0);
    });
  });

  describe('failed', () => {
    let rsp;
    let periodProposal;
    let bridgeState;

    beforeEach(() => {
      rsp = {};
      periodProposal = proposal({ txHash: '0xdeadbeef' });
      bridgeState = bridgeStateMock(periodProposal);
      web3.eth.getTransactionReceipt = () => Promise.resolve({ status: false });
    });

    test('resubmission success', async () => {
      txPromise.resolve({ status: true });

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      // next slot
      expect(periodProposal.proposerSlotId).toEqual(1);

      expect(submitPeriod).toBeCalledWith(periodProposal, bridgeState, {});

      expect(rsp.status).toBe(0);
    });

    test('resubmission failure', async () => {
      txPromise.resolve({ status: false });

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      expect(periodProposal.proposerSlotId).toEqual(1);

      expect(submitPeriod).toBeCalledWith(periodProposal, bridgeState, {});

      expect(rsp.status).toBe(0);
    });

    test('resubmission stuck in a mempool', async () => {
      txPromise.resolve(null);

      await periodHandler(bridgeState)(rsp, state, { height: 64 });

      expect(periodProposal.proposerSlotId).toEqual(1);

      expect(submitPeriod).toBeCalledWith(periodProposal, bridgeState, {});

      expect(rsp.status).toBe(0);
    });
  });

  test('submission successful', async () => {
    const rsp = {};
    const periodProposal = proposal({ txHash: '0xdeadbeef' });
    const bridgeState = bridgeStateMock(periodProposal);
    web3.eth.getTransactionReceipt = () => Promise.resolve({ status: true });

    await periodHandler(bridgeState)(rsp, state, { height: 64 });

    expect(submitPeriod).not.toBeCalled();
    expect(rsp.status).toBe(0);
  });
});
