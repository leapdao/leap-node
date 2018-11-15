const readSlots = require('./readSlots');

test('read validator slots from bridge', async () => {
  const sourceSlots = [
    {
      owner: '0x001',
      stake: 1,
      signer: '0x001',
      tendermint: '0000001',
      activationEpoch: 0,
      newOwner: '0x0',
      newStake: 0,
      newSigner: '0x0',
      newTendermint: '0x0',
    },
    {
      owner: '0x002',
      stake: 1,
      signer: '0x002',
      tendermint: '0000002',
      activationEpoch: 0,
      newOwner: '0x0',
      newStake: 0,
      newSigner: '0x0',
      newTendermint: '0x0',
    },
  ];
  const bridge = {
    methods: {
      epochLength: () => ({
        call: async () => 2,
      }),
      slots: slotId => ({
        call: async () => sourceSlots[slotId],
      }),
    },
  };
  const slots = await readSlots(bridge);
  expect(slots).toEqual([
    {
      activationEpoch: 0,
      id: 0,
      newOwner: '0x0',
      newSigner: '0x0',
      newStake: 0,
      newTendermint: '0x0',
      owner: '0x001',
      signerAddr: '0x001',
      stake: 1,
      tenderKey: '0000001',
    },
    {
      activationEpoch: 0,
      id: 1,
      newOwner: '0x0',
      newSigner: '0x0',
      newStake: 0,
      newTendermint: '0x0',
      owner: '0x002',
      signerAddr: '0x002',
      stake: 1,
      tenderKey: '0000002',
    },
  ]);
});
