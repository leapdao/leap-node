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
const merkleRoot1 =
  '0xc3421964237b41853a603e1abd0b7885d3342fc20b1a6b66a964d58e4f56ec38';

const getInitialState = () => ({
  periodVotes: {},
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
});

describe('checkPeriodVote', () => {
  test('successful tx', () => {
    const state = getInitialState();
    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_1);

    checkPeriodVote(state, periodVoteTx);

    expect(Object.keys(state.periodVotes).length).toEqual(1);
    expect(state.periodVotes[1]).toBe(merkleRoot);

    // vote override
    checkPeriodVote(
      state,
      Tx.periodVote(1, new Input(new Outpoint(merkleRoot1, 0))).signAll(PRIV_1)
    );

    expect(Object.keys(state.periodVotes).length).toEqual(1);
    expect(state.periodVotes[1]).toBe(merkleRoot1);
  });

  test('reject: wrong type', () => {
    const tx = Tx.transfer([], []);
    expect(() => checkPeriodVote({}, tx)).toThrow(
      '[period vote] periodVote tx expected'
    );
  });

  test('reject: slot is not taken', () => {
    const state = getInitialState();
    const periodVoteTx = Tx.periodVote(
      2,
      new Input(new Outpoint(merkleRoot, 0))
    );

    expect(() => checkPeriodVote(state, periodVoteTx)).toThrow(
      '[period vote] Slot 2 is empty'
    );
  });

  test('reject: unsigned input', () => {
    const state = getInitialState();
    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    );

    expect(() => checkPeriodVote(state, periodVoteTx)).toThrow(
      '[period vote] Input should be signed by validator'
    );
  });

  test('reject: wrong signer', () => {
    const state = getInitialState();
    const periodVoteTx = Tx.periodVote(
      1,
      new Input(new Outpoint(merkleRoot, 0))
    ).signAll(PRIV_0); // PRIV_0 is not a signer for slot 1

    expect(() => checkPeriodVote(state, periodVoteTx)).toThrow(
      `[period vote] Input should be signed by validator: ${ADDR_1}`
    );
  });
});
