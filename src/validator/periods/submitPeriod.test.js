// eslint-disable-next-line import/no-extraneous-dependencies
const PromiEvent = require('web3-core-promievent');
const submitPeriod = require('./submitPeriod');

jest.mock('../../utils');
const utils = jest.requireMock('../../utils');

jest.mock('./submitPeriodVote');
const submitPeriodVote = jest.requireMock('./submitPeriodVote');

jest.mock('./checkEnoughVotes');
const checkEnoughVotes = jest.requireMock('./checkEnoughVotes');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const PRIV =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const ADDR_1 = '0xd56f7dfcd2baffbc1d885f0266b21c7f2912020c';

const BLOCKS_ROOT =
  '0x7777777777777777777777777777777777777777777777777777777777777777';

// proposal for happy-case
const periodProposal = extend => ({
  blocksRoot: BLOCKS_ROOT,
  proposerSlotId: 0,
  prevPeriodRoot: '0x5678',
  votes: [0, 1],
  ...extend,
});

const submitPeriodWithCasMethod = 'submitPeriodWithCaseResponse';
const submitPeriodWithCas = jest.fn(() => submitPeriodWithCasMethod);

const web3 = {};
const operatorContractMock = () => ({
  options: {
    address: ADDR,
  },
  methods: {
    submitPeriodWithCas,
  },
});

const bridgeStateMock = attrs => ({
  web3,
  account: {
    address: ADDR,
    privateKey: PRIV,
  },
  currentState: {
    slots: [{ id: 0, signerAddr: ADDR }, { id: 1, signerAddr: ADDR_1 }],
  },
  operatorContract: operatorContractMock(),
  ...attrs,
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
  let txPromise;
  beforeEach(() => {
    // mocks for happy-case
    txPromise = new PromiEvent();
    utils.getSlotsByAddr.mockReturnValue([{ id: 0 }]);
    checkEnoughVotes.mockReturnValue({ result: true, votes: 2, needed: 2 });
    utils.buildCas.mockReturnValue(
      0xca50000000000000000000000000000000000000000000000000000000000000
    );
    utils.sendTransaction.mockReturnValue(
      Promise.resolve({ receiptPromise: txPromise.eventEmitter })
    );
  });

  test('period is onchain', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '100' }, // period found in the bridge contract
      }),
      lastBlocksRoot: BLOCKS_ROOT,
    });

    // submitted period has merkle root == lastBlocksRoot
    // lastBlocksRoot is being read from Submission event
    const { receiptPromise } = await submitPeriod(
      periodProposal(),
      bridgeState
    );

    expect(receiptPromise).resolves.toEqual({ status: true });
    expect(submitPeriodVote).not.toBeCalled();
    expect(utils.sendTransaction).not.toBeCalled();
  });

  test('period is expected to be onchain, but it is not', async () => {
    const bridgeState = bridgeStateMock({
      bridgeContract: bridgeContractMock({
        returnPeriod: { timestamp: '0' }, // period found in the bridge contract
      }),
      lastBlocksRoot: BLOCKS_ROOT,
    });

    // lastBlocksRoot is the same as in submitted period,
    // but for some reason there is no such period on chain (internal error in leap-node?)
    expect(submitPeriod(periodProposal(), bridgeState)).rejects.toEqual(
      new Error('No period found onchain for bridgeState.lastBlocksRoot')
    );
    expect(utils.sendTransaction).not.toBeCalled();
  });

  test('not submitted, has no slot', async () => {
    const bridgeState = bridgeStateMock({});
    utils.getSlotsByAddr.mockReturnValue([]);

    const { receiptPromise } = await submitPeriod(
      periodProposal(),
      bridgeState
    );

    expect(utils.getSlotsByAddr).toBeCalledWith(
      bridgeState.currentState.slots,
      bridgeState.account.address
    );
    expect(receiptPromise).resolves.toBe();
    expect(submitPeriodVote).not.toBeCalled();
    expect(utils.sendTransaction).not.toBeCalled();
    expect(submitPeriodWithCas).not.toBeCalled();
  });

  test('not submitted, has slot, not a proposer', async () => {
    const bridgeState = bridgeStateMock({});
    utils.getSlotsByAddr.mockReturnValue([{ id: 1 }]);

    const { receiptPromise } = await submitPeriod(
      periodProposal(),
      bridgeState
    );

    expect(receiptPromise).resolves.toEqual();
    expect(submitPeriodVote).not.toBeCalled();
    expect(utils.sendTransaction).not.toBeCalled();
    expect(submitPeriodWithCas).not.toBeCalled();
  });

  test("not submitted, has slot, not a proposer, hasn't voted yet", async () => {
    const bridgeState = bridgeStateMock({});
    utils.getSlotsByAddr.mockReturnValue([{ id: 1 }]);

    const proposal = periodProposal({
      votes: [0], // our node hasn't voted yet
    });
    const { receiptPromise } = await submitPeriod(proposal, bridgeState);

    expect(receiptPromise).resolves.toEqual();
    expect(submitPeriodVote).toBeCalledWith(BLOCKS_ROOT, proposal, bridgeState);
    expect(utils.sendTransaction).not.toBeCalled();
    expect(submitPeriodWithCas).not.toBeCalled();
  });

  test('not submitted, has slot, voted, not enough period votes', async () => {
    const bridgeState = bridgeStateMock({});
    checkEnoughVotes.mockReturnValue({ result: false, votes: 1, needed: 2 });

    const proposal = periodProposal();
    const { receiptPromise } = await submitPeriod(proposal, bridgeState);

    expect(receiptPromise).resolves.toEqual();
    expect(submitPeriodVote).not.toBeCalled();
    expect(utils.sendTransaction).not.toBeCalled();
    expect(submitPeriodWithCas).not.toBeCalled();
  });

  test('not submitted, has slot, enough period votes, tx is in flight already', async () => {
    const bridgeState = bridgeStateMock({});

    const proposal = periodProposal({
      txHash: '0xdeadbeef',
    });
    const { receiptPromise } = await submitPeriod(proposal, bridgeState);

    expect(receiptPromise).resolves.toEqual();
    expect(submitPeriodVote).not.toBeCalled();
    expect(utils.sendTransaction).not.toBeCalled();
    expect(submitPeriodWithCas).not.toBeCalled();
  });

  test('not submitted, has slot, enough period votes', async () => {
    const bridgeState = bridgeStateMock({});

    const proposal = periodProposal();
    txPromise.resolve({ status: true });
    const { receiptPromise } = await submitPeriod(proposal, bridgeState);

    expect(receiptPromise).resolves.toEqual({ status: true });
    expect(utils.sendTransaction).toBeCalledWith(
      web3,
      submitPeriodWithCasMethod,
      bridgeState.operatorContract.options.address,
      bridgeState.account,
      {}
    );
    expect(submitPeriodWithCas).toBeCalledWith(
      0,
      '0x5678',
      BLOCKS_ROOT,
      '0xca50000000000000000000000000000000000000000000000000000000000000'
    );
    txPromise.eventEmitter.emit('transactionHash', '0xdeadbeef');
    expect(proposal.txHash).toEqual('0xdeadbeef');
  });

  test('submit only minimum required CAS bitmap', async () => {
    // 4 validator slots
    const bridgeState = bridgeStateMock({
      currentState: {
        slots: [
          { id: 0, signerAddr: ADDR },
          { id: 1, signerAddr: ADDR_1 },
          { id: 2, signerAddr: ADDR_1 },
          { id: 3, signerAddr: ADDR_1 },
        ],
      },
    });

    // got 4 validator votes
    checkEnoughVotes.mockReturnValue({ result: true, votes: 4, needed: 3 });
    const proposal = periodProposal({
      votes: [0, 1, 2, 3],
    });

    await submitPeriod(proposal, bridgeState);

    // build CAS for 3 sigs only (quorum)
    expect(utils.buildCas).toBeCalledWith([0, 1, 2]);
  });

  test('pass through extra options to sendTransaction', async () => {
    const bridgeState = bridgeStateMock({});

    await submitPeriod(periodProposal(), bridgeState, { nonce: 2 });

    expect(utils.sendTransaction).toBeCalledWith(
      web3,
      submitPeriodWithCasMethod,
      bridgeState.operatorContract.options.address,
      bridgeState.account,
      { nonce: 2 }
    );
  });
});
