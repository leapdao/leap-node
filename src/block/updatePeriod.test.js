const updatePeriod = require('./updatePeriod');

jest.mock('../utils/sendTransaction');

jest.mock('../period/submitPeriodVote', () => jest.fn());
const submitPeriodVote = jest.requireMock('../period/submitPeriodVote');

jest.mock('../txHelpers/submitPeriod', () => jest.fn());
const submitPeriod = jest.requireMock('../txHelpers/submitPeriod');

const ADDR = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0x4436373705394267350db2c06613990d34621d61';

const NON_EXISTENT_PERIOD = {
  prevHash: '0x000001',
  merkleRoot() {
    return '0x000011';
  },
};

describe('updatePeriod', () => {
  test('start new period each 32 blocks', async () => {
    const bridgeState = {
      currentPeriod: NON_EXISTENT_PERIOD,
      periodHeights: {},
    };
    const state = {
      slots: [],
    };
    await updatePeriod(
      state,
      { height: 32 },
      bridgeState,
      {},
      ADDR
    );

    expect(bridgeState.currentPeriod.prevHash).toBe(
      NON_EXISTENT_PERIOD.merkleRoot()
    );
    expect(bridgeState.previousPeriod).toBe(NON_EXISTENT_PERIOD);
    expect(bridgeState.periodHeights[NON_EXISTENT_PERIOD.merkleRoot()]).toBe(32);
    expect(submitPeriod).not.toBeCalled();
    expect(submitPeriodVote).toBeCalledWith(NON_EXISTENT_PERIOD, state, bridgeState, ADDR);
  });

  describe('at the height % 32 !== 0 and height % 32 !== 16', () => {

    test('do nothing if not enough period votes or no period yet', async () => {
      const bridgeState = {
        currentPeriod: NON_EXISTENT_PERIOD,
        submittedPeriods: {},
      };
      await updatePeriod(
        {
          slots: [],
        },
        { height: 15 },
        bridgeState
      );
  
      expect(bridgeState.currentPeriod).toBe(NON_EXISTENT_PERIOD);
      expect(bridgeState.previousPeriod).toBe(undefined);  
    });

    test('submit period if enough period votes and period pending', async () => {
      const bridgeState = {
        previousPeriod: NON_EXISTENT_PERIOD,
        submittedPeriods: {},
        periodHeights: {
          [NON_EXISTENT_PERIOD.merkleRoot()]: 32
        }
      };
      await updatePeriod(
        {
          periodVotes: { 
            [NON_EXISTENT_PERIOD.merkleRoot()]: [0] // one vote
          },
          slots: ['0x1'], // one slot
        },
        { height: 34 },
        bridgeState
      );
  
      expect(submitPeriod).toBeCalledWith(NON_EXISTENT_PERIOD, ['0x1'], 32, bridgeState);
    });

    test('do nothing if not enough period votes and period pending', async () => {
      const bridgeState = {
        previousPeriod: NON_EXISTENT_PERIOD,
        submittedPeriods: {},
        periodHeights: {
          [NON_EXISTENT_PERIOD.merkleRoot()]: 32
        }
      };
      await updatePeriod(
        {
          periodVotes: { 
            [NON_EXISTENT_PERIOD.merkleRoot()]: [] // no votes
          },
          slots: ['0x1'], // one slot
        },
        { height: 34 },
        bridgeState
      );
  
      expect(submitPeriod).not.toBeCalled();
    });

    test('do nothing if no period pending', async () => {
      const bridgeState = {
        previousPeriod: NON_EXISTENT_PERIOD,
        submittedPeriods: {},
        periodHeights: {}
      };
      await updatePeriod(
        {
          periodVotes: { 
            [NON_EXISTENT_PERIOD.merkleRoot()]: [0]
          },
          slots: ['0x1'], // one slot
        },
        { height: 34 },
        bridgeState
      );
  
      expect(submitPeriod).not.toBeCalled();
    });

    test('do nothing period if period already submitted', async () => {
      const bridgeState = {
        previousPeriod: NON_EXISTENT_PERIOD,
        submittedPeriods: {
          [NON_EXISTENT_PERIOD.merkleRoot()]: true
        },
        periodHeights: {
          [NON_EXISTENT_PERIOD.merkleRoot()]: 32
        }
      };
      await updatePeriod(
        {
          periodVotes: { 
            [NON_EXISTENT_PERIOD.merkleRoot()]: [] // no votes
          },
          slots: ['0x1'], // one slot
        },
        { height: 34 },
        bridgeState
      );
  
      expect(submitPeriod).not.toBeCalled();
    });
  });

  test('activate own auctioned slots at height % 32 === 16', async () => {
    let activateCalled = false;
    const bridgeState = {
      currentPeriod: NON_EXISTENT_PERIOD,
      account: {
        address: ADDR,
      },
      operatorContract: {
        options: {
          address: ADDR,
        },
        methods: {
          activate: () => {
            activateCalled = true;
          },
        },
      },
    };
    await updatePeriod(
      {
        slots: [
          {
            newSigner: ADDR,
            activationEpoch: 2,
          },
        ],
        epoch: {
          epoch: 0,
        },
      },
      { height: 16 },
      bridgeState
    );
    expect(bridgeState.currentPeriod).toBe(NON_EXISTENT_PERIOD);
    expect(bridgeState.previousPeriod).toBe(undefined);
    expect(activateCalled).toBe(true);
  });

  test('no own auctioned slots at height % 32 === 16', async () => {
    let activateCalled = false;
    const bridgeState = {
      currentPeriod: NON_EXISTENT_PERIOD,
      account: {
        address: ADDR,
      },
      operatorContract: {
        options: {
          address: ADDR,
        },
        methods: {
          activate: () => {
            activateCalled = true;
          },
        },
      },
    };
    await updatePeriod(
      {
        slots: [
          {
            newSigner: ADDR_2,
            activationEpoch: 2,
          },
        ],
        epoch: {
          epoch: 0,
        },
      },
      { height: 16 },
      bridgeState
    );
    expect(bridgeState.currentPeriod).toBe(NON_EXISTENT_PERIOD);
    expect(bridgeState.previousPeriod).toBe(undefined);
    expect(activateCalled).toBe(false);
  });
});
