module.exports = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "registerNST",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x23b1896a"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "depositCount",
    "outputs": [
      {
        "name": "",
        "type": "uint32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x2dfdf0b5"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "exitsTokenData",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x30774098"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "uint32"
      }
    ],
    "name": "tokenData",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x3447fc1d"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_youngerInputProof",
        "type": "bytes32[]"
      },
      {
        "name": "_exitingTxProof",
        "type": "bytes32[]"
      },
      {
        "name": "_outputIndex",
        "type": "uint8"
      },
      {
        "name": "_inputIndex",
        "type": "uint8"
      }
    ],
    "name": "challengeYoungestInput",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x374a5435"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "exitStake",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x3882f742"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "uint32"
      }
    ],
    "name": "deposits",
    "outputs": [
      {
        "name": "time",
        "type": "uint64"
      },
      {
        "name": "color",
        "type": "uint16"
      },
      {
        "name": "owner",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x5bae510d"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "nstExitCounter",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x6210d62b"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "bytes32[]"
      },
      {
        "name": "_prevProof",
        "type": "bytes32[]"
      },
      {
        "name": "_outputIndex",
        "type": "uint8"
      },
      {
        "name": "_inputIndex",
        "type": "uint8"
      }
    ],
    "name": "challengeExit",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x65f0b9b5"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      },
      {
        "name": "_isERC721",
        "type": "bool"
      }
    ],
    "name": "registerToken",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x6710b83f"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "nftTokenCount",
    "outputs": [
      {
        "name": "",
        "type": "uint16"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x7695d79b"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "nftExitCounter",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x78e70645"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_color",
        "type": "uint16"
      }
    ],
    "name": "finalizeExits",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x8290fe25"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "nstTokenCount",
    "outputs": [
      {
        "name": "",
        "type": "uint16"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x83717bef"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_minGasPrice",
        "type": "uint256"
      }
    ],
    "name": "setMinGasPrice",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0x90ac1866"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "exitDuration",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0x9eeaa7f4"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_exitStake",
        "type": "uint256"
      }
    ],
    "name": "setExitStake",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xac3d8558"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_bridge",
        "type": "address"
      },
      {
        "name": "_exitDuration",
        "type": "uint256"
      },
      {
        "name": "_exitStake",
        "type": "uint256"
      }
    ],
    "name": "initializeWithExit",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xba27a911"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "erc20TokenCount",
    "outputs": [
      {
        "name": "",
        "type": "uint16"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xbc48bc22"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_color",
        "type": "uint16"
      }
    ],
    "name": "finalizeTopExit",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xc215f1be"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_bridge",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xc4d66de8"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      },
      {
        "name": "_amountOrTokenId",
        "type": "uint256"
      },
      {
        "name": "_color",
        "type": "uint16"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xd2d0e066"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "minGasPrice",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xd96ed505"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_color",
        "type": "uint16"
      }
    ],
    "name": "getTokenAddr",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xdb9ed47e"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "bridge",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xe78cea92"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_exitDuration",
        "type": "uint256"
      }
    ],
    "name": "setExitDuration",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function",
    "signature": "0xeabd6868"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "tokenColors",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xeefc3083"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "uint16"
      }
    ],
    "name": "tokens",
    "outputs": [
      {
        "name": "addr",
        "type": "address"
      },
      {
        "name": "currentSize",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xf3c20de0"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_depositId",
        "type": "uint256"
      }
    ],
    "name": "startDepositExit",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function",
    "signature": "0xf5239f64"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_youngestInputProof",
        "type": "bytes32[]"
      },
      {
        "name": "_proof",
        "type": "bytes32[]"
      },
      {
        "name": "_outputIndex",
        "type": "uint8"
      },
      {
        "name": "_inputIndex",
        "type": "uint8"
      }
    ],
    "name": "startExit",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function",
    "signature": "0xf6169e35"
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
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "exits",
    "outputs": [
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "color",
        "type": "uint16"
      },
      {
        "name": "owner",
        "type": "address"
      },
      {
        "name": "finalized",
        "type": "bool"
      },
      {
        "name": "priorityTimestamp",
        "type": "uint32"
      },
      {
        "name": "stake",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function",
    "signature": "0xffa696d3"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "txHash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "name": "outIndex",
        "type": "uint8"
      },
      {
        "indexed": true,
        "name": "color",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "exitor",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "ExitStarted",
    "type": "event",
    "signature": "0xaace06690e02011b548d8c5a74e1a678833d4136a56e657909fc6354bfb7c31f"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "txHash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "name": "outIndex",
        "type": "uint8"
      },
      {
        "indexed": true,
        "name": "color",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "exitor",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "data",
        "type": "bytes32"
      }
    ],
    "name": "ExitStartedV2",
    "type": "event",
    "signature": "0x30924909ab00e149ea3c4b2ca611cbd244a3ac033163919000ccedf093fb4bf4"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "depositId",
        "type": "uint32"
      },
      {
        "indexed": true,
        "name": "depositor",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "color",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "NewDeposit",
    "type": "event",
    "signature": "0x3fb288e5672e5fbbac19c54a77d8c562a521b069b922e16736f69e648ceb13a3"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "minGasPrice",
        "type": "uint256"
      }
    ],
    "name": "MinGasPrice",
    "type": "event",
    "signature": "0x85feea100eda69e1c4fe1b228ed4d7229f3e9e9ebf7d30893d71de8165c46abb"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "depositId",
        "type": "uint32"
      },
      {
        "indexed": true,
        "name": "depositor",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "color",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "data",
        "type": "bytes32"
      }
    ],
    "name": "NewDepositV2",
    "type": "event",
    "signature": "0xfc7d4a724aae4a4fa0536a988ae3a4e31bfeffd022c2aa2a5d5eef40758b8ac4"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddr",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "color",
        "type": "uint16"
      }
    ],
    "name": "NewToken",
    "type": "event",
    "signature": "0xfe74dea79bde70d1990ddb655bac45735b14f495ddc508cfab80b7729aa9d668"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_youngestInputProof",
        "type": "bytes32[]"
      },
      {
        "name": "_proof",
        "type": "bytes32[]"
      },
      {
        "name": "_outputIndex",
        "type": "uint8"
      },
      {
        "name": "_inputIndex",
        "type": "uint8"
      },
      {
        "name": "signedData",
        "type": "bytes32[]"
      }
    ],
    "name": "startBoughtExit",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function",
    "signature": "0x690505a7"
  }
]