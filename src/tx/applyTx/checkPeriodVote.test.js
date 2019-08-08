const { Tx, Input, Outpoint } = require('leap-core');

const checkPeriodVote = require('./checkPeriodVote');

const ADDR_0 = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const ADDR_1 = '0xd56f7dfcd2baffbc1d885f0266b21c7f2912020c';
const PRIV_0 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const PRIV_1 =
  '0xea3a59a673a9f7e74ad65e92ee04c2330fc5b905d0fa47bb2ae36c0b94af61cd';
const TENDER_KEY_0 = '0x7640D69D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();
const TENDER_KEY_1 = '0x0000069D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();
const merkleRoot =
  '0x3342fc20b1a6b66a964d58e4f56ec38c3421964237b41853a603e1abd0b7885d';

jest.mock('../../txHelpers/submitPeriod', () => jest.fn());
const submitPeriodMock = jest.requireMock('../../txHelpers/submitPeriod');

const stateMock = attrs => ({
  slots: [
    {
      id: 0,
      tenderKey: TENDER_KEY_0,
      signerAddr: ADDR_0,
      eventsCount: 1,
    },
    {
      id: 1,
      tenderKey: TENDER_KEY_1,
      signerAddr: ADDR_1,
      eventsCount: 1,
    },
  ],
  periodVotes: {},
  ...attrs,
});

const bridgeStateMock = attrs => ({
  blockHeight: 1,
  currentState: stateMock(),
  ...attrs,
});

describe('checkPeriodVote', () => {
  test('success: add vote, not enough votes for submission', async () => {
    const bridgeState = bridgeStateMock();
    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    await checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState);
    expect(bridgeState.currentState.periodVotes[merkleRoot]).toEqual([1]);
    expect(submitPeriodMock).not.toBeCalled();
  });

  test('success: add vote, enough votes for submission', async () => {
    const bridgeState = bridgeStateMock({
      currentState: stateMock({
        periodVotes: {
          [merkleRoot]: [0],
        },
      }),
    });

    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    await checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState);

    expect(bridgeState.currentState.periodVotes[merkleRoot]).toEqual([0, 1]);
    // expect(submitPeriodMock).toBeCalled();
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

  test('reject: already submitted vote', async () => {
    const bridgeState = bridgeStateMock({
      currentState: stateMock({
        periodVotes: {
          [merkleRoot]: [1],
        },
      }),
    });

    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    expect(
      checkPeriodVote(bridgeState.currentState, periodVoteTx, bridgeState)
    ).rejects.toEqual(
      new Error(
        `[period vote] Already submitted. Slot: ${1}. Root: ${merkleRoot}`
      )
    );
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
});
