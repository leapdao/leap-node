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
    signature: '0x387dd9e9',
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
    signature: '0x5620d1d7',
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
    signature: '0x57d775f8',
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
    signature: '0x5c60da1b',
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
    signature: '0x659f9e3c',
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
    signature: '0xe78cea92',
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
    signature: '0xf851a440',
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
    signature: '0xfbfa77cf',
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
    signature:
      '0xc1d4931e10652da8ab23604510531810d2eebfcd33a81ba4946d702ce8057b64',
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
    signature:
      '0x0d6907b9b2ea7da47011fac3f7a9cd92db6a465b919c62b15e61cc74e360ed42',
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
    signature:
      '0x4c9088728a29490bef2515a7613c7a87145317c97c5a6db0cfc39b7603dc5d05',
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
    signature:
      '0xfc17170df6a99106bd17e260bba5bf947bd69496cec7ee38c77d819af73682b6',
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
    signature:
      '0x8c7dcd0d98dd0f717c7cb4db1dec8bccf98dec6114eba26c026815b0046fb40f',
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
    signature:
      '0x544de641c952cf567862150ebe0f2a364e9863b490e8b3bf0f48d9cfda7c843c',
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
        name: 'casRoot',
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
    signature:
      '0xf986eac9872d4e0d99f75c012fa3e120147044f1e92bd63c196ff43f19f1e7ce',
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
    signature: '0x1794bb3c',
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
    signature: '0x54eea796',
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
    signature: '0xe3c9e9b3',
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
    signature: '0xb260c42a',
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
        name: '_cas',
        type: 'bytes32',
      },
    ],
    name: 'submitPeriodWithCas',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
    signature: '0x58d40279',
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
    signature: '0x877c4f6e',
  },
];
