module.exports = [
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    name: 'slots',
    outputs: [
      {
        name: 'eventCounter',
        type: 'uint32',
      },
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'stake',
        type: 'uint64',
      },
      {
        name: 'signer',
        type: 'address',
      },
      {
        name: 'tendermint',
        type: 'bytes32',
      },
      {
        name: 'activationEpoch',
        type: 'uint32',
      },
      {
        name: 'newOwner',
        type: 'address',
      },
      {
        name: 'newStake',
        type: 'uint64',
      },
      {
        name: 'newSigner',
        type: 'address',
      },
      {
        name: 'newTendermint',
        type: 'bytes32',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'lastCompleteEpoch',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'epochLength',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'lastEpochBlockHeight',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'bridge',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'admin',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'vault',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'epoch',
        type: 'uint256',
      },
    ],
    name: 'Epoch',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'epochLength',
        type: 'uint256',
      },
    ],
    name: 'EpochLength',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'signerAddr',
        type: 'address',
      },
      {
        indexed: true,
        name: 'slotId',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'tenderAddr',
        type: 'bytes32',
      },
      {
        indexed: false,
        name: 'eventCounter',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'epoch',
        type: 'uint256',
      },
    ],
    name: 'ValidatorJoin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'signerAddr',
        type: 'address',
      },
      {
        indexed: true,
        name: 'slotId',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'tenderAddr',
        type: 'bytes32',
      },
      {
        indexed: false,
        name: 'newSigner',
        type: 'address',
      },
      {
        indexed: false,
        name: 'eventCounter',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'epoch',
        type: 'uint256',
      },
    ],
    name: 'ValidatorLogout',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'signerAddr',
        type: 'address',
      },
      {
        indexed: true,
        name: 'slotId',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'tenderAddr',
        type: 'bytes32',
      },
      {
        indexed: false,
        name: 'epoch',
        type: 'uint256',
      },
    ],
    name: 'ValidatorLeave',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'signerAddr',
        type: 'address',
      },
      {
        indexed: true,
        name: 'slotId',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'tenderAddr',
        type: 'bytes32',
      },
      {
        indexed: false,
        name: 'eventCounter',
        type: 'uint256',
      },
    ],
    name: 'ValidatorUpdate',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'blocksRoot',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'slotId',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        name: 'periodRoot',
        type: 'bytes32',
      },
    ],
    name: 'Submission',
    type: 'event',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_bridge',
        type: 'address',
      },
      {
        name: '_vault',
        type: 'address',
      },
      {
        name: '_epochLength',
        type: 'uint256',
      },
    ],
    name: 'initialize',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_epochLength',
        type: 'uint256',
      },
    ],
    name: 'setEpochLength',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_slotId',
        type: 'uint256',
      },
      {
        name: '_signerAddr',
        type: 'address',
      },
      {
        name: '_tenderAddr',
        type: 'bytes32',
      },
    ],
    name: 'setSlot',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_slotId',
        type: 'uint256',
      },
    ],
    name: 'activate',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_slotId',
        type: 'uint256',
      },
      {
        name: '_prevHash',
        type: 'bytes32',
      },
      {
        name: '_blocksRoot',
        type: 'bytes32',
      },
    ],
    name: 'submitPeriod',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
