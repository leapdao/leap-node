const { Tx, Input, Outpoint } = require('leap-core');

const checkPeriodVote = require('./checkPeriodVote');

const ADDR_0 = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const ADDR_1 = '0xd56f7dfcd2baffbc1d885f0266b21c7f2912020c';
const PRIV_0 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const PRIV_1 =
  '0xea3a59a673a9f7e74ad65e92ee04c2330fc5b905d0fa47bb2ae36c0b94af61cd';
const merkleRoot =
  '0x3342fc20b1a6b66a964d58e4f56ec38c3421964237b41853a603e1abd0b7885d';

const stateMock = attrs => ({
  slots: [
    {
      id: 0,
      signerAddr: ADDR_0,
    },
    {
      id: 1,
      signerAddr: ADDR_1,
    },
  ],
  ...attrs,
});

const bridgeStateMock = (votes, extend) => ({
  blockHeight: 1,
  currentState: stateMock(),
  periodProposal: {
    blocksRoot: merkleRoot,
    votes: votes || [],
  },
  ...extend,
});

describe('checkPeriodVote', () => {
  test('success: add vote, not enough votes for submission', async () => {
    const bridgeState = bridgeStateMock();
    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    await checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState);
    expect(bridgeState.periodProposal.votes).toEqual([1]);
  });

  test('success: add vote, enough votes for submission', async () => {
    const bridgeState = bridgeStateMock([0]);

    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    await checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState);
    expect(bridgeState.periodProposal.votes).toEqual([0, 1]);
  });

  test('success: already submitted vote', async () => {
    const bridgeState = bridgeStateMock([1]);

    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    await checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState);
    expect(bridgeState.periodProposal.votes).toEqual([1]);
  });

  test('reject: wrong type', async () => {
    const tx = Tx.transfer([], []);
    expect(checkPeriodVote({}, tx)).rejects.toEqual(
      new Error('[period vote] periodVote tx expected')
    );
  });

  test('reject: slot is not taken', async () => {
    const bridgeState = bridgeStateMock();
    const periodVoteTx = Tx.periodVote(
      2,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    expect(
      checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState)
    ).rejects.toEqual(new Error('[period vote] Slot 2 is empty'));
  });

  test('reject: unsigned input', async () => {
    const bridgeState = bridgeStateMock();
    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    );

    expect(
      checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState)
    ).rejects.toEqual(
      new Error(`[period vote] Input should be signed by validator: ${ADDR_1}`)
    );
  });

  test('reject: wrong signer', async () => {
    const bridgeState = bridgeStateMock();
    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_0); // PRIV_0 is not a signer for slot 1

    expect(
      checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState)
    ).rejects.toEqual(
      new Error(`[period vote] Input should be signed by validator: ${ADDR_1}`)
    );
  });

  test('reject: wrong prevout index', async () => {
    const bridgeState = bridgeStateMock();

    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 9))
    ).signAll(PRIV_1);

    expect(
      checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState)
    ).rejects.toEqual(
      new Error(`[period vote] Input should have prevout index of 0. Got: 9`)
    );
  });

  test('reject: no period proposal to vote on', async () => {
    const bridgeState = bridgeStateMock([0], {
      periodProposal: null,
    });

    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    await checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState);
    expect(bridgeState.periodProposal).toEqual(null);
  });

  test('reject: proposed period is different', async () => {
    const bridgeState = bridgeStateMock([0], {
      periodProposal: {
        blocksRoot: '0x123',
        votes: [0],
      }
    });

    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    await checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState);
    expect(bridgeState.periodProposal.votes).toEqual([0]);
  });
});
