const BridgeState = require('./bridgeState');

jest.mock('./utils/ContractsEventsSubscription');

const ContractsEventsSubscription = require('./utils/ContractsEventsSubscription');

/* eslint-disable */
ContractsEventsSubscription.__setEventBatches([
  [{ event: 'EpochLength', returnValues: { epochLength: 4 } }],
  [
    {
      event: 'NewDeposit',
      returnValues: {
        depositId: 0,
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
  ],
]);
/* eslint-enable */

const createInstance = (web3, bridgeContract, db, config) => {
  const bridgeState = new BridgeState(db, config.privKey, config, 0, []);
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
});
