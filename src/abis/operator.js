module.exports = [
  {
    constant: true,
    inputs: [],
    name: 'casChallengeDuration',
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
    name: 'implementation',
    outputs: [
      {
        name: 'impl',
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
        indexed: true,
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        name: 'casBitmap',
        type: 'bytes32',
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
    signature:
      '0x6690fe1f2634f1045e46d9adb5863d34ad6e548e6eb55fac8189444a403f8ee0',
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
      {
        name: '_casChallengeDuration',
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
      {
        name: '_casBitmap',
        type: 'bytes32',
      },
    ],
    name: 'submitPeriodWithCas',
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
  {
    constant: true,
    inputs: [
      {
        name: '_period',
        type: 'bytes32',
      },
      {
        name: '_slotId',
        type: 'uint256',
      },
    ],
    name: 'getChallenge',
    outputs: [
      {
        name: '',
        type: 'address',
      },
      {
        name: '',
        type: 'uint256',
      },
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
    constant: false,
    inputs: [
      {
        name: '_casChallengeDuration',
        type: 'uint256',
      },
    ],
    name: 'setCasChallengeDuration',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_casBitmap',
        type: 'bytes32',
      },
      {
        name: '_validatorRoot',
        type: 'bytes32',
      },
      {
        name: '_consensusRoot',
        type: 'bytes32',
      },
      {
        name: '_slotId',
        type: 'uint256',
      },
    ],
    name: 'challengeCas',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_consensusRoot',
        type: 'bytes32',
      },
      {
        name: '_casRoot',
        type: 'bytes32',
      },
      {
        name: '_slotId',
        type: 'uint256',
      },
      {
        name: '_v',
        type: 'uint8',
      },
      {
        name: '_r',
        type: 'bytes32',
      },
      {
        name: '_s',
        type: 'bytes32',
      },
      {
        name: '_msgSender',
        type: 'address',
      },
    ],
    name: 'respondCas',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_period',
        type: 'bytes32',
      },
      {
        name: '_slotId',
        type: 'uint256',
      },
    ],
    name: 'timeoutCas',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
