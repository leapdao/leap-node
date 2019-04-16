module.exports = [
  {
    "constant": true,
    "inputs": [],
    "name": "genesisBlockNumber",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x0356fe3a"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "lastParentBlock",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x117546c5"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "operator",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x570ca735"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "periods",
    "outputs": [
      {
        "name": "height",
        "type": "uint32"
      },
      {
        "name": "timestamp",
        "type": "uint32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xc222ef6d"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "tipHash",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xed3e46ae"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xf851a440"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "height",
        "type": "uint256"
      },
      {
        "indexed": true,
        "name": "root",
        "type": "bytes32"
      }
    ],
    "name": "NewHeight",
    "type": "event",
    "signature": "0xe31f975aec703affe1ea897d4c5a536d03b9858b6a563a7e3225cd5444c26937"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "NewOperator",
    "type": "event",
    "signature": "0xda12ee837e6978172aaf54b16145ffe08414fd8710092ef033c71b8eb6ec189a"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_parentBlockInterval",
        "type": "uint256"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xfe4b84df"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_operator",
        "type": "address"
      }
    ],
    "name": "setOperator",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xb3ab15fb"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getParentBlockInterval",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xb99c9157"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_parentBlockInterval",
        "type": "uint256"
      }
    ],
    "name": "setParentBlockInterval",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x994c748b"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_prevHash",
        "type": "bytes32"
      },
      {
        "name": "_root",
        "type": "bytes32"
      }
    ],
    "name": "submitPeriod",
    "outputs": [
      {
        "name": "newHeight",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x5848ce71"
  }
]