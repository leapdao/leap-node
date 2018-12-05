import updatePeriod from './updatePeriod';

jest.mock('../txHelpers/submitPeriod');
jest.mock('../utils//sendTransaction');

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
    };
    await updatePeriod(
      {
        slots: [],
      },
      { height: 32 },
      bridgeState
    );

    expect(bridgeState.currentPeriod.prevHash).toBe(
      NON_EXISTENT_PERIOD.merkleRoot()
    );
    expect(bridgeState.previousPeriod).toBe(NON_EXISTENT_PERIOD);
  });

  test('do nothing at the height % 32 !== 0 || height % 32 !== 16', async () => {
    const bridgeState = {
      currentPeriod: NON_EXISTENT_PERIOD,
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
