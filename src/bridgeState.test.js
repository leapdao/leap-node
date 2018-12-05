const { Outpoint } = require('leap-core');
const BridgeState = require('./bridgeState');

jest.mock('./eventsRelay/ContractsEventsSubscription');

const ContractsEventsSubscription = require('./eventsRelay/ContractsEventsSubscription');

// class Contract {
//   constructor(abi, address) {
//     this.options = { address };
//     this.methods = {
//       genesisBlockNumber: () => ({
//         call: async () => 5,
//       }),
//     };
//   }
// }

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

const createInstance = (web3, exitHandlerContract, db, config) => {
  const bridgeState = new BridgeState(db, config.privKey, config);
  bridgeState.web3 = web3;
  bridgeState.exitHandlerContract = exitHandlerContract;
  bridgeState.operatorContract = {};
  bridgeState.bridgeContract = {
    methods: {
      genesisBlockNumber: () => ({
        call: async () => 5,
      }),
    },
  };

  return bridgeState;
};

describe('BridgeState', () => {
  test('Initialisation', async () => {
    const exitHandlerContract = {
      methods: {},
    };
    const state = createInstance(
      {},
      exitHandlerContract,
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
    expect(state.epochLengths).toEqual([4]);
  });

  test('Initialisation: import privateKey', async () => {
    const exitHandlerContract = {
      methods: {},
    };
    const state = createInstance(
      {},
      exitHandlerContract,
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
    expect(state.epochLengths).toEqual([4]);
  });

  test('Handle events', async () => {
    const exitHandlerContract = {
      methods: {},
    };
    const state = createInstance(
      {},
      exitHandlerContract,
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
    expect(state.epochLengths).toEqual([4]);
    expect(state.deposits).toEqual({});
    expect(state.exits).toEqual({});
    await state.eventsSubscription.fetchEvents();
    expect(state.deposits).toEqual({
      '0': {
        amount: '100',
        color: '0',
        depositor: '0xB8205608d54cb81f44F263bE086027D8610F3C94',
      },
    });
    const outpoint = new Outpoint(
      '0x2bc83fb4a5ff059e8dfc6ac1a47903b133f484d8aeac943489841cc1cbb3bb0b',
      0
    );
    expect(state.exits).toEqual({
      [outpoint.getUtxoId()]: {
        txHash:
          '0x2bc83fb4a5ff059e8dfc6ac1a47903b133f484d8aeac943489841cc1cbb3bb0b',
        outIndex: 0,
        exitor: '0xB8205608d54cb81f44F263bE086027D8610F3C94',
        color: '0',
        amount: '100',
      },
    });
  });

  // test('Create bridgeContract instance', async () => {
  //   const exitHandlerContract = {
  //     methods: {
  //       bridge: () => ({
  //         call: async () => '0x00',
  //       }),
  //     },
  //   };
  //   const state = createInstance(
  //     {
  //       eth: {
  //         Contract,
  //       },
  //     },
  //     exitHandlerContract,
  //     {
  //       async getLastBlockSynced() {
  //         return 0;
  //       },
  //       async storeBlock() {
  //         return null;
  //       },
  //     },
  //     {
  //       privKey:
  //         '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311',
  //     }
  //   );
  //   state.bridgeContract = undefined;
  //   await state.init();
  //   expect(state.bridgeContract.options.address).toBe('0x00');
  // });

  // test('Create operatorContract instance', async () => {
  //   const exitHandlerContract = {
  //     methods: {
  //       bridge: () => ({
  //         call: async () => '0x00',
  //       }),
  //     },
  //   };
  //   const state = createInstance(
  //     {
  //       eth: {
  //         Contract,
  //       },
  //     },
  //     exitHandlerContract,
  //     {
  //       async getLastBlockSynced() {
  //         return 0;
  //       },
  //       async storeBlock() {
  //         return null;
  //       },
  //     },
  //     {
  //       privKey:
  //         '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311',
  //     }
  //   );
  //   state.operatorContract = undefined;
  //   state.bridgeContract.methods.operator = () => ({
  //     call: async () => '0x01',
  //   });
  //   await state.init();
  //   expect(state.operatorContract.options.address).toBe('0x01');
  // });
});
