const BridgeState = require('./bridgeState');
const createDb = require('./api/createDb');

jest.mock('./utils/ContractsEventsSubscription');

const ContractsEventsSubscription = require('./utils/ContractsEventsSubscription');

/* eslint-disable */
ContractsEventsSubscription.__setEventBatches([
  [{ event: 'EpochLength', returnValues: { epochLength: '4' } }],
  [{ event: 'MinGasPrice', returnValues: { minGasPrice: '1000000' } }],
  [
    {
      event: 'NewDeposit',
      returnValues: {
        depositId: '0',
        depositor: '0xB8205608d54cb81f44F263bE086027D8610F3C94',
        color: '0',
        amount: '100',
      },
    },
    {
      event: 'ExitStarted',
      returnValues: {
        depositor: '0xB8205608d54cb81f44F263bE086027D8610F3C94',
        txHash:
          '0x2bc83fb4a5ff059e8dfc6ac1a47903b133f484d8aeac943489841cc1cbb3bb0b',
        outIndex: '0',
        exitor: '0xB8205608d54cb81f44F263bE086027D8610F3C94',
        color: '0',
        amount: '100',
      },
    },
    {
      event: 'NewDepositV2',
      returnValues: {
        depositId: '0',
        depositor: '0xB8205608d54cb81f44F263bE086027D8610F3C94',
        color: '0',
        amount: '100',
        data: `0x${Buffer.alloc(32).fill(1).toString('hex')}`,
      },
    },
  ],
]);
/* eslint-enable */

const createInstance = (web3, bridgeContract, db, config) => {
  const bridgeState = new BridgeState(db, config.privKey, config, []);
  bridgeState.web3 = web3;
  bridgeState.bridgeContract = bridgeContract;

  return bridgeState;
};

describe('BridgeState', () => {
  test('Initialisation', async () => {
    const bridgeContract = {
      methods: {
        genesisBlockNumber: () => ({
          call: async () => 5,
        }),
      },
    };
    const state = createInstance(
      {
        eth: {
          getBlockNumber: async () => 5,
        },
      },
      bridgeContract,
      {
        async getLastBlockSynced() {
          return 0;
        },
        async storeBlock() {
          return null;
        },
      },
      {}
    );
    await state.init();
  });

  test('Initialisation: import privateKey', async () => {
    const bridgeContract = {
      methods: {
        genesisBlockNumber: () => ({
          call: async () => 5,
        }),
      },
    };
    const state = createInstance(
      {
        eth: {
          getBlockNumber: async () => 5,
        },
      },
      bridgeContract,
      {
        async getLastBlockSynced() {
          return 0;
        },
        async storeBlock() {
          return null;
        },
      },
      {
        privKey:
          '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311',
      }
    );
    await state.init();
    expect(state.account.address).toBe(
      '0xB8205608d54cb81f44F263bE086027D8610F3C94'
    );
  });

  test('BridgeState.{loadState, saveState}', async () => {
    let methodCalled = '';
    let storedObj = null;

    const level = {
      async get(key) {
        methodCalled = `get${key}`;

        if (!storedObj) {
          const err = new Error('NotFoundError');
          err.type = 'NotFoundError';
          throw err;
        }

        return storedObj;
      },

      async put(key, val) {
        methodCalled = `set${key}`;

        if (key === 'chainState') {
          storedObj = val;
        }
      },
    };

    const db = createDb(level);
    const bridgeState = new BridgeState(db, null, {});
    const initialState = await bridgeState.loadState();
    expect(methodCalled === 'getchainState').toBe(true);

    expect(await bridgeState.loadState()).toEqual(initialState);
    expect(methodCalled === 'getchainState').toBe(true);

    const newState = bridgeState.currentState;
    newState.blockHeight = 1;
    bridgeState.saveState(newState);
    expect(methodCalled === 'setchainState').toBe(true);

    expect(await bridgeState.loadState()).toEqual(newState);
    expect(methodCalled === 'getchainState').toBe(true);
  });
});
