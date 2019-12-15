const { toBuffer } = require('ethereumjs-util');
const submitPeriodVote = require('./submitPeriodVote');

jest.mock('../../txHelpers/sendTx');
jest.mock('./submitPeriod');

const sender = {
  sendDelayed: jest.fn(() => null),
  send: jest.fn(() => null),
};

const NO_SLOT_ADDR = '0x1111111111111111111113be086027d8610f3c94';
const ADDR_0 = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const PRIV_0 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';

const ADDR_1 = '0xd56f7dfcd2baffbc1d885f0266b21c7f2912020c';

const PERIOD_ROOT =
  '0x7777777777777777777777777777777777777777777777777777777777777777';

const stateMock = () => ({
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
});

const bridgeStateMock = (extend) => ({
  isReplay: () => false,
  account: {
    address: ADDR_0,
    privateKey: PRIV_0,
  },
  sender,
  currentState: stateMock(),
  periodProposal: {
    blocksRoot: PERIOD_ROOT,
    votes: []
  },
  ...extend,
});

const period = {
  merkleRoot() {
    return PERIOD_ROOT;
  },
  prevHash: '0x5678',
};

describe('submit period vote', () => {
  test('no slot, no period vote', async () => {
    const bridgeState = bridgeStateMock({
      account: {
        address: NO_SLOT_ADDR,
      },
    });

    await submitPeriodVote(PERIOD_ROOT, bridgeState);

    expect(sender.send).not.toBeCalled();
  });

  test('own slot, submit period vote tx', async () => {
    const bridgeState = bridgeStateMock();

    await submitPeriodVote(PERIOD_ROOT, bridgeState);

    expect(sender.send).toBeCalled();
    const tx = sender.send.mock.calls[0][0];
    expect(tx.inputs[0].signer).toEqual(ADDR_0);
    expect(tx.options.slotId).toEqual(0);
    expect(tx.inputs[0].prevout.hash).toEqual(toBuffer(PERIOD_ROOT));
  });

  test('own slot, already submitted vote', async () => {
    const bridgeState = bridgeStateMock({
      ...bridgeStateMock(),
      periodProposal: {
        blocksRoot: PERIOD_ROOT,
        votes: [0]
      },
    });

    await submitPeriodVote(PERIOD_ROOT, bridgeState);

    expect(sender.send).not.toBeCalled();
  });

  test('tx replay', async () => {
    const bridgeState = bridgeStateMock({
      isReplay: () => true
    });

    await submitPeriodVote(PERIOD_ROOT, bridgeState);

    expect(sender.send).not.toBeCalled();
  });

});
