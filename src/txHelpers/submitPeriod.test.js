const { toBuffer } = require('ethereumjs-util');

const submitPeriod = require('./submitPeriod');
const { GENESIS } = require('../utils');

jest.mock('../utils/sendTransaction');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const PRIV =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';

const ADDR_1 = '0xd56f7dfcd2baffbc1d885f0266b21c7f2912020c';

const web3 = {};

const PERIOD_ROOT =
  '0x7777777777777777777777777777777777777777777777777777777777777777';
const period = {
  merkleRoot() {
    return PERIOD_ROOT;
  },
  prevHash: '0x5678',
};

const bridgeStateMock = attrs => ({
  web3,
  account: {
    address: ADDR,
    privateKey: PRIV,
  },
  currentState: {
    periodVotes: {},
  },
  ...attrs,
});

const operatorContractMock = () => {
  const test = {
    submitCalled: false,
    prevPeriodRoot: undefined,
    cas: undefined,
  };

  return {
    test,
    options: {
      address: ADDR,
    },
    methods: {
      submitPeriodWithCas: (_slotId, prevRootHash, _periodRoot, cas) => {
        test.submitCalled = true;
        test.prevPeriodRoot = prevRootHash;
        test.cas = cas;
        return {};
      },
    },
  };
};

const bridgeContractMock = ({ returnPeriod }) => ({
  options: {
    address: ADDR,
  },
  methods: {
    periods: () => ({
      async call() {
        return returnPeriod;
      },
    }),
  },
});

const sendTxMock = () => {
  this.calls = 0;
  return {
    calls: () => this.calls,
    tx: () => this.tx,
    send: tx => {
      this.calls += 1;
      this.tx = tx;
    },
  };
};

describe('submitPeriod', () => {
  test('period is already submitted', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '100' }, // period found in the bridge contract
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: PERIOD_ROOT,
    });

    // submitted period has merkle root == lastBlocksRoot
    // lastBlocksRoot is being read from Submission event
    const submittedPeriod = await submitPeriod(
      period,
      [],
      0,
      bridgeState,
      {},
      sendTxMock().send
    );

    expect(submittedPeriod).toEqual({
      timestamp: '100',
    });
  });

  test('not submitted, node has no own slot', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
    });

    const submittedPeriod = await submitPeriod(
      period,
      [],
      0,
      bridgeState,
      {},
      sendTxMock().send
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(false);
  });

  test('not submitted, own slot', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: period.prevHash,
      lastPeriodRoot: '0x1337',
    });

    const submittedPeriod = await submitPeriod(
      period,
      [{ signerAddr: ADDR, id: 0 }],
      1,
      bridgeState,
      {},
      sendTxMock().send
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(true);
    expect(bridgeState.operatorContract.test.prevPeriodRoot).toEqual('0x1337');
    expect(bridgeState.operatorContract.test.cas).toEqual(
      '0x8000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('not submitted, own slot, first period', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
    });

    const submittedPeriod = await submitPeriod(
      period,
      [{ signerAddr: ADDR, id: 0 }],
      0,
      bridgeState,
      {},
      sendTxMock().send
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(true);
    expect(bridgeState.operatorContract.test.prevPeriodRoot).toEqual(GENESIS);
  });

  test('submitted, own slot, always try to submit for lastPeriodRoot', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: '0x9999', // doesn't match period.prevHash
      lastPeriodRoot: '0x1337',
    });

    const submittedPeriod = await submitPeriod(
      period,
      [{ signerAddr: ADDR, id: 0 }],
      0,
      bridgeState,
      {},
      sendTxMock().send
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(true);
  });

  test('not submitted, own slot, readonly validator', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: period.prevHash,
      lastPeriodRoot: '0x1337',
    });

    const submittedPeriod = await submitPeriod(
      period,
      [{ signerAddr: ADDR, id: 0 }],
      1,
      bridgeState,
      { readonly: true },
      sendTxMock().send
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(false);
  });

  describe('period vote', () => {
    test('no slot, no period vote', async () => {
      const bridgeState = bridgeStateMock({
        bridgeContract: bridgeContractMock({
          returnPeriod: { timestamp: '0' },
        }),
        operatorContract: operatorContractMock(),
      });

      const sendMock = sendTxMock();
      await submitPeriod(period, [], 0, bridgeState, {}, sendMock.send);

      expect(sendMock.calls()).toEqual(0);
    });

    test('own slot, submit period vote tx', async () => {
      const bridgeState = bridgeStateMock({
        bridgeContract: bridgeContractMock({
          returnPeriod: { timestamp: '0' },
        }),
        operatorContract: operatorContractMock(),
      });

      const sendMock = sendTxMock();
      await submitPeriod(
        period,
        [{ signerAddr: ADDR, id: 0 }],
        0,
        bridgeState,
        {},
        sendMock.send
      );

      expect(sendMock.calls()).toEqual(1);
      const tx = sendMock.tx();
      expect(tx.inputs[0].signer).toEqual(ADDR);
      expect(tx.options.slotId).toEqual(0);
      expect(tx.inputs[0].prevout.hash).toEqual(toBuffer(PERIOD_ROOT));
    });

    test('not enough votes collected: 1/2', async () => {
      const bridgeState = bridgeStateMock({
        bridgeContract: bridgeContractMock({
          returnPeriod: { timestamp: '0' },
        }),
        operatorContract: operatorContractMock(),
        lastBlocksRoot: period.prevHash,
        lastPeriodRoot: '0x1337',
        currentState: {
          periodVotes: {},
        },
      });

      const submittedPeriod = await submitPeriod(
        period,
        [{ signerAddr: ADDR, id: 0 }, { signerAddr: ADDR_1, id: 1 }],
        0,
        bridgeState,
        {},
        sendTxMock().send
      );

      expect(submittedPeriod).toEqual({
        timestamp: '0',
      });
      expect(bridgeState.operatorContract.test.submitCalled).toBe(false);
    });

    test('not enough votes collected: 2/4', async () => {
      const bridgeState = bridgeStateMock({
        bridgeContract: bridgeContractMock({
          returnPeriod: { timestamp: '0' },
        }),
        operatorContract: operatorContractMock(),
        lastBlocksRoot: period.prevHash,
        lastPeriodRoot: '0x1337',
        currentState: {
          periodVotes: {
            1: period.merkleRoot(),
          },
        },
      });

      const submittedPeriod = await submitPeriod(
        period,
        [
          { signerAddr: ADDR, id: 0 },
          { signerAddr: ADDR_1, id: 1 },
          { signerAddr: ADDR_1, id: 2 },
          { signerAddr: ADDR_1, id: 3 },
        ],
        0,
        bridgeState,
        {},
        sendTxMock().send
      );

      expect(submittedPeriod).toEqual({
        timestamp: '0',
      });
      expect(bridgeState.operatorContract.test.submitCalled).toBe(false);
    });

    test('got enough votes: 3/4', async () => {
      const bridgeState = bridgeStateMock({
        bridgeContract: bridgeContractMock({
          returnPeriod: { timestamp: '0' },
        }),
        operatorContract: operatorContractMock(),
        lastBlocksRoot: period.prevHash,
        lastPeriodRoot: '0x1337',
        currentState: {
          periodVotes: {
            1: period.merkleRoot(),
            2: period.merkleRoot(),
          },
        },
      });

      const submittedPeriod = await submitPeriod(
        period,
        [
          { signerAddr: ADDR, id: 0 },
          { signerAddr: ADDR_1, id: 1 },
          { signerAddr: ADDR_1, id: 2 },
          { signerAddr: ADDR_1, id: 3 },
        ],
        0,
        bridgeState,
        {},
        sendTxMock().send
      );

      expect(submittedPeriod).toEqual({
        timestamp: '0',
      });
      expect(bridgeState.operatorContract.test.submitCalled).toBe(true);
      expect(bridgeState.operatorContract.test.cas).toEqual(
        '0xe000000000000000000000000000000000000000000000000000000000000000'
      );
    });
  });
});
