module.exports = [
  {
    constant: true,
    inputs: [],
    name: 'blockReward',
    outputs: [
      {
        name: '',
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
    name: 'lastParentBlock',
    outputs: [
      {
        name: '',
        type: 'uint64',
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
        type: 'address',
      },
    ],
    name: 'operators',
    outputs: [
      {
        name: 'joinedAt',
        type: 'uint64',
      },
      {
        name: 'claimedUntil',
        type: 'uint64',
      },
      {
        name: 'stakeAmount',
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
    name: 'parentBlockInterval',
    outputs: [
      {
        name: '',
        type: 'uint32',
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
        type: 'uint32',
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
    name: 'chain',
    outputs: [
      {
        name: 'parent',
        type: 'bytes32',
      },
      {
        name: 'height',
        type: 'uint64',
      },
      {
        name: 'parentIndex',
        type: 'uint32',
      },
      {
        name: 'operator',
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
    name: 'operatorCount',
    outputs: [
      {
        name: '',
        type: 'uint32',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalStake',
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
    name: 'stakePeriod',
    outputs: [
      {
        name: '',
        type: 'uint32',
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
    inputs: [],
    name: 'token',
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
        name: 'opened',
        type: 'uint32',
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
        name: '_parentBlockInterval',
        type: 'uint32',
      },
      {
        name: '_epochLength',
        type: 'uint32',
      },
      {
        name: '_blockReward',
        type: 'uint64',
      },
      {
        name: '_stakePeriod',
        type: 'uint32',
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
        name: 'blockNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'root',
        type: 'bytes32',
      },
    ],
    name: 'ArchiveBlock',
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
        name: 'blockNumber',
        type: 'uint256',
      },
    ],
    name: 'OperatorJoin',
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
        name: 'blockNumber',
        type: 'uint256',
      },
    ],
    name: 'OperatorLeave',
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
    constant: false,
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'join',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'requestLeave',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'signerAddr',
        type: 'address',
      },
    ],
    name: 'payout',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'prevHash',
        type: 'bytes32',
      },
      {
        name: 'root',
        type: 'bytes32',
      },
      {
        name: 'v',
        type: 'uint8',
      },
      {
        name: 'r',
        type: 'bytes32',
      },
      {
        name: 's',
        type: 'bytes32',
      },
      {
        name: 'orphans',
        type: 'bytes32[]',
      },
    ],
    name: 'submitBlockAndPrune',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'prevHash',
        type: 'bytes32',
      },
      {
        name: 'root',
        type: 'bytes32',
      },
      {
        name: 'v',
        type: 'uint8',
      },
      {
        name: 'r',
        type: 'bytes32',
      },
      {
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'submitBlock',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'hashA',
        type: 'bytes32',
      },
      {
        name: 'hashB',
        type: 'bytes32',
      },
    ],
    name: 'reportHeightConflict',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_data',
        type: 'bytes32[]',
      },
    ],
    name: 'reportLightBranch',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_data',
        type: 'bytes32[]',
      },
      {
        name: '_offset',
        type: 'uint256',
      },
    ],
    name: 'buildMap',
    outputs: [
      {
        name: 'map',
        type: 'uint256[]',
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
        name: '_data',
        type: 'bytes32[]',
      },
      {
        name: 'nodeHash',
        type: 'bytes32',
      },
      {
        name: '_map',
        type: 'uint256[]',
      },
    ],
    name: 'getWeight',
    outputs: [
      {
        name: 'weight',
        type: 'uint256',
      },
      {
        name: 'i',
        type: 'uint256',
      },
      {
        name: 'prevHash',
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
        name: '_data',
        type: 'bytes32[]',
      },
    ],
    name: 'isLightBranch',
    outputs: [
      {
        name: 'isLight',
        type: 'bool',
      },
      {
        name: 'prevHash',
        type: 'bytes32',
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
    constant: true,
    inputs: [
      {
        name: 'nodeId',
        type: 'bytes32',
      },
    ],
    name: 'getBranchCount',
    outputs: [
      {
        name: 'childCount',
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
        name: 'nodeId',
        type: 'bytes32',
      },
      {
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'getBranchAtIndex',
    outputs: [
      {
        name: 'childId',
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
    name: 'getHighest',
    outputs: [
      {
        name: '',
        type: 'bytes32',
      },
      {
        name: '',
        type: 'uint64',
      },
      {
        name: '',
        type: 'uint32',
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
    inputs: [
      {
        name: '_operators',
        type: 'address[]',
      },
    ],
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
    constant: true,
    inputs: [
      {
        name: 'height',
        type: 'uint256',
      },
    ],
    name: 'getBlock',
    outputs: [
      {
        name: 'root',
        type: 'bytes32',
      },
      {
        name: 'operator',
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
];
