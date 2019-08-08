const submitPeriod = require('./submitPeriod');
const { GENESIS } = require('../utils');

jest.mock('../utils/sendTransaction');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const PRIV =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';

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

const submitPeriodWithCas = jest.fn(() => null);

const operatorContractMock = () => ({
  options: {
    address: ADDR,
  },
  methods: {
    submitPeriod: submitPeriodWithCas,
  },
});

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
    const submittedPeriod = await submitPeriod(period, [], 0, bridgeState, {});

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

    const submittedPeriod = await submitPeriod(period, [], 0, bridgeState, {});

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(submitPeriodWithCas).not.toBeCalled();
  });

  test('not submitted, own slot, enough votes', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: period.prevHash,
      lastPeriodRoot: '0x1337',
      currentState: {
        periodVotes: {
          [PERIOD_ROOT]: [0],
        },
        slots: [{ signerAddr: ADDR, id: 0 }],
      },
    });

    const submittedPeriod = await submitPeriod(
      period,
      [{ signerAddr: ADDR, id: 0 }],
      1,
      bridgeState,
      {}
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(submitPeriodWithCas).toBeCalledWith(
      0,
      '0x1337',
      PERIOD_ROOT
      //      '0x8000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('not submitted, own slot, first period', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
      currentState: {
        periodVotes: {
          [PERIOD_ROOT]: [0],
        },
        slots: [{ signerAddr: ADDR, id: 0 }],
      },
    });

    const submittedPeriod = await submitPeriod(
      period,
      [{ signerAddr: ADDR, id: 0 }],
      0,
      bridgeState,
      {}
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(submitPeriodWithCas).toBeCalledWith(
      0,
      GENESIS,
      PERIOD_ROOT
      //      '0x8000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('submitted, own slot, always try to submit for lastPeriodRoot', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: '0x9999', // doesn't match period.prevHash
      lastPeriodRoot: '0x1337',
      currentState: {
        periodVotes: {
          [PERIOD_ROOT]: [0],
        },
        slots: [{ signerAddr: ADDR, id: 0 }],
      },
    });

    const submittedPeriod = await submitPeriod(
      period,
      [{ signerAddr: ADDR, id: 0 }],
      0,
      bridgeState,
      {}
    );

    expect(submittedPeriod).toEqual({
      timestamp: '0',
    });
    expect(submitPeriodWithCas).toBeCalled();
  });

  test('not submitted, own slot, readonly validator', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' },
      }),
      operatorContract: operatorContractMock(),
      lastBlocksRoot: period.prevHash,
      lastPeriodRoot: '0x1337',
      currentState: {
        periodVotes: {
          [PERIOD_ROOT]: [0],
        },
        slots: [{ signerAddr: ADDR, id: 0 }],
      },
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
    expect(submitPeriodWithCas).not.toBeCalled();
  });

  // describe('period vote', () => {
  //   test('not enough votes collected: 1/2', async () => {
  //     const bridgeState = bridgeStateMock({
  //       bridgeContract: bridgeContractMock({
  //         returnPeriod: { timestamp: '0' },
  //       }),
  //       operatorContract: operatorContractMock(),
  //       lastBlocksRoot: period.prevHash,
  //       lastPeriodRoot: '0x1337',
  //       currentState: {
  //         periodVotes: {
  //           [period.merkleRoot()]: [1],
  //         },
  //         slots: [{ signerAddr: ADDR, id: 0 }, { signerAddr: ADDR_1, id: 1 }],
  //       },
  //     });

  //     const submittedPeriod = await submitPeriod(
  //       period,
  //       [{ signerAddr: ADDR, id: 0 }, { signerAddr: ADDR_1, id: 1 }],
  //       0,
  //       bridgeState,
  //       {}
  //     );

  //     expect(submittedPeriod).toEqual({
  //       timestamp: '0',
  //     });
  //     expect(submitPeriodWithCas).not.toBeCalled();
  //   });

  //   test('not enough votes collected: 2/4', async () => {
  //     const bridgeState = bridgeStateMock({
  //       bridgeContract: bridgeContractMock({
  //         returnPeriod: { timestamp: '0' },
  //       }),
  //       operatorContract: operatorContractMock(),
  //       lastBlocksRoot: period.prevHash,
  //       lastPeriodRoot: '0x1337',
  //       currentState: {
  //         periodVotes: {
  //           [period.merkleRoot()]: [1, 2],
  //         },
  //         slots: [
  //           { signerAddr: ADDR, id: 0 },
  //           { signerAddr: ADDR_1, id: 1 },
  //           { signerAddr: ADDR_1, id: 2 },
  //           { signerAddr: ADDR_1, id: 3 },
  //         ],
  //       },
  //     });

  //     const submittedPeriod = await submitPeriod(
  //       period,
  //       [
  //         { signerAddr: ADDR, id: 0 },
  //         { signerAddr: ADDR_1, id: 1 },
  //         { signerAddr: ADDR_1, id: 2 },
  //         { signerAddr: ADDR_1, id: 3 },
  //       ],
  //       0,
  //       bridgeState,
  //       {}
  //     );

  //     expect(submittedPeriod).toEqual({
  //       timestamp: '0',
  //     });
  //     expect(submitPeriodWithCas).not.toBeCalled();
  //   });

  //   test('got enough votes: 3/4', async () => {
  //     const bridgeState = bridgeStateMock({
  //       bridgeContract: bridgeContractMock({
  //         returnPeriod: { timestamp: '0' },
  //       }),
  //       operatorContract: operatorContractMock(),
  //       lastBlocksRoot: period.prevHash,
  //       lastPeriodRoot: '0x1337',
  //       currentState: {
  //         periodVotes: {
  //           [period.merkleRoot()]: [0, 2, 3],
  //         },
  //         slots: [
  //           { signerAddr: ADDR, id: 0 },
  //           { signerAddr: ADDR_1, id: 1 },
  //           { signerAddr: ADDR_1, id: 2 },
  //           { signerAddr: ADDR_1, id: 3 },
  //         ],
  //       },
  //     });

  //     const submittedPeriod = await submitPeriod(
  //       period,
  //       [
  //         { signerAddr: ADDR, id: 0 },
  //         { signerAddr: ADDR_1, id: 1 },
  //         { signerAddr: ADDR_1, id: 2 },
  //         { signerAddr: ADDR_1, id: 3 },
  //       ],
  //       0,
  //       bridgeState,
  //       {}
  //     );

  //     expect(submittedPeriod).toEqual({
  //       timestamp: '0',
  //     });
  //     expect(submitPeriodWithCas).toBeCalled();
  //     expect(submitPeriodWithCas.mock.calls[0][3]).toEqual(
  //       '0xb000000000000000000000000000000000000000000000000000000000000000'
  //     );
  //   });
  // });
});
