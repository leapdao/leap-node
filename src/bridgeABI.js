module.exports = [
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
    inputs: [
      {
        name: '',
        type: 'uint32',
      },
    ],
    name: 'deposits',
    outputs: [
      {
        name: 'height',
        type: 'uint64',
      },
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'amount',
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
        type: 'bytes32',
      },
    ],
    name: 'periods',
    outputs: [
      {
        name: 'parent',
        type: 'bytes32',
      },
      {
        name: 'height',
        type: 'uint32',
      },
      {
        name: 'parentIndex',
        type: 'uint32',
      },
      {
        name: 'slot',
        type: 'uint8',
      },
      {
        name: 'timestamp',
        type: 'uint32',
      },
      {
        name: 'reward',
        type: 'uint64',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'tipHash',
    outputs: [
      {
        name: '',
        type: 'bytes32',
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
        type: 'bytes32',
      },
    ],
    name: 'exits',
    outputs: [
      {
        name: 'amount',
        type: 'uint64',
      },
      {
        name: 'owner',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: '_token',
        type: 'address',
      },
      {
        name: '_epochLength',
        type: 'uint256',
      },
      {
        name: '_maxReward',
        type: 'uint256',
      },
      {
        name: '_parentBlockInterval',
        type: 'uint256',
      },
      {
        name: '_exitDuration',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
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
        name: 'blockNumber',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'root',
        type: 'bytes32',
      },
    ],
    name: 'NewHeight',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'depositId',
        type: 'uint32',
      },
      {
        indexed: false,
        name: 'depositor',
        type: 'address',
      },
    ],
    name: 'NewDeposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'txHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'outIndex',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'exitor',
        type: 'address',
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'ExitStarted',
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
        indexed: false,
        name: 'epoch',
        type: 'uint256',
      },
    ],
    name: 'ValidatorLeave',
    type: 'event',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_slotId',
        type: 'uint256',
      },
    ],
    name: 'getSlot',
    outputs: [
      {
        name: '',
        type: 'address',
      },
      {
        name: '',
        type: 'uint64',
      },
      {
        name: '',
        type: 'address',
      },
      {
        name: '',
        type: 'uint32',
      },
      {
        name: '',
        type: 'address',
      },
      {
        name: '',
        type: 'uint64',
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
    constant: true,
    inputs: [],
    name: 'getTip',
    outputs: [
      {
        name: '',
        type: 'bytes32',
      },
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
    constant: false,
    inputs: [
      {
        name: '_slotId',
        type: 'uint256',
      },
      {
        name: '_value',
        type: 'uint256',
      },
      {
        name: '_signerAddr',
        type: 'address',
      },
    ],
    name: 'bet',
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
        name: '_root',
        type: 'bytes32',
      },
      {
        name: 'orphans',
        type: 'bytes32[]',
      },
    ],
    name: 'submitAndPrune',
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
        name: '_root',
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
    constant: false,
    inputs: [
      {
        name: '_txData',
        type: 'bytes32[]',
      },
    ],
    name: 'reportInvalidDeposit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proof',
        type: 'bytes32[]',
      },
      {
        name: '_prevProof',
        type: 'bytes32[]',
      },
    ],
    name: 'reportDoubleSpend',
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
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'slash',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'deposit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proof',
        type: 'bytes32[]',
      },
    ],
    name: 'withdrawBurn',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proof',
        type: 'bytes32[]',
      },
    ],
    name: 'startExit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proof',
        type: 'bytes32[]',
      },
      {
        name: '_prevProof',
        type: 'bytes32[]',
      },
    ],
    name: 'challengeExit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'finalizeExits',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
