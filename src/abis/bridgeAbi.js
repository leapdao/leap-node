module.exports = [
  {
    constant: true,
    inputs: [],
    name: 'genesisBlockNumber',
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
    name: 'lastParentBlock',
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
    name: 'operator',
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
    name: 'periods',
    outputs: [
      {
        name: 'height',
        type: 'uint32',
      },
      {
        name: 'timestamp',
        type: 'uint32',
      },
      {
        name: 'parentBlockNumber',
        type: 'uint32',
      },
      {
        name: 'parentBlockHash',
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'height',
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
        indexed: false,
        name: 'operator',
        type: 'address',
      },
    ],
    name: 'NewOperator',
    type: 'event',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_parentBlockInterval',
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
        name: '_operator',
        type: 'address',
      },
    ],
    name: 'setOperator',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getParentBlockInterval',
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
    constant: false,
    inputs: [
      {
        name: '_parentBlockInterval',
        type: 'uint256',
      },
    ],
    name: 'setParentBlockInterval',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
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
    outputs: [
      {
        name: 'newHeight',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
