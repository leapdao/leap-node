const submitPeriod = require('./submitPeriod');
const { GENESIS } = require('../utils');

jest.mock('../utils/sendTransaction');

const ADDR = '0x4436373705394267350db2c06613990d34621d69';
const web3 = {};

const period = {
  merkleRoot() {
    return '0x1234';
  },
  prevHash: '0x5678',
};

const bridgeStateMock = attrs => ({
  web3,
  account: {
    address: ADDR,
  },
  ...attrs,
});

const operatorContractMock = () => {
  const test = {
    submitCalled: false,
    prevPeriodRoot: undefined,
  };

  return {
    test,
    options: {
      address: ADDR,
    },
    methods: {
      submitPeriod: (_, prevRootHash) => {
        test.submitCalled = true;
        test.prevPeriodRoot = prevRootHash;
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

describe('submitPeriod', async () => {
  test('period is already submitted', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '100' }, // period found in the bridge contract
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: '0x1234',
    });

    // submitted period has merkle root == lastBlocksRoot
    // lastBlocksRoot is being read from Submission event
    const submittedPeriod = await submitPeriod(period, [], 0, bridgeState);

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

    const submittedPeriod = await submitPeriod(period, [], 0, bridgeState);

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
      bridgeState
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(true);
    expect(bridgeState.operatorContract.test.prevPeriodRoot).toEqual('0x1337');
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
      bridgeState
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(true);
    expect(bridgeState.operatorContract.test.prevPeriodRoot).toEqual(GENESIS);
  });

  test('not submitted, own slot, wrong prev hash', async () => {
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
      bridgeState
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(false);
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
      { readonly: true }
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(bridgeState.operatorContract.test.submitCalled).toBe(false);
  });
});
