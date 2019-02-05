const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const {
  bufferToHex,
  toBuffer,
  keccak256,
  privateToAddress,
} = require('ethereumjs-util');
const bridgeABI = require('../abis/bridgeAbi');

const BATCH_SIZE = 50;
const swapAddr = process.env.SWAP_ADDR;
const fromHeight = process.env.FROM_HEIGHT;
const toHeight = process.env.TO_HEIGHT;
const operatorContractAddr = process.env.OP_CONTRACT_ADDR;
const validatorPriv = process.env.VALIDATOR_PRIV;
const providerUrl = process.env.PROVIDER_URL;
const swapAbi = [
  {
    constant: false,
    inputs: [
      {
        name: '_slotId',
        type: 'uint256',
      },
      {
        name: '_consensusRoots',
        type: 'bytes32[]',
      },
      {
        name: '_cas',
        type: 'bytes32[]',
      },
      {
        name: '_validatorData',
        type: 'bytes32[]',
      },
      {
        name: '_rest',
        type: 'bytes32[]',
      },
    ],
    name: 'claim',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
const operatorAbi = [
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
];

async function getPastEvents(contract, fromBlock, toBlock) {
  const batchCount = Math.ceil((toBlock - fromBlock) / BATCH_SIZE);
  const events = [];

  for (let i = 0; i < batchCount; i += 1) {
    /* eslint-disable no-await-in-loop */
    events.push(
      await contract.getPastEvents('allEvents', {
        fromBlock: i * BATCH_SIZE + fromBlock,
        toBlock: Math.min(toBlock, i * BATCH_SIZE + fromBlock + BATCH_SIZE),
      })
    );
    /* eslint-enable */
  }

  return events.reduce((result, ev) => result.concat(ev), []);
}

function separateForSubmission(arr, size) {
  const newArr = [];
  for (let i = 0; i < arr[0].length; i += size) {
    const sliceIt = [];
    sliceIt.push(arr[0].slice(i, i + size));
    sliceIt.push(arr[1].slice(i, i + size));
    sliceIt.push(arr[2].slice(i, i + size));
    sliceIt.push(arr[3].slice(i, i + size));
    newArr.push(sliceIt);
  }
  return newArr;
}

function getPeriodRoot(consensus, cas, data, rest) {
  let buf = Buffer.alloc(64, 0);
  toBuffer(data).copy(buf);
  toBuffer(rest).copy(buf, 32);
  const dataBuf = keccak256(buf);

  buf = Buffer.alloc(64, 0);
  toBuffer(cas).copy(buf);
  dataBuf.copy(buf, 32);
  const casBuf = keccak256(buf);

  buf = Buffer.alloc(64, 0);
  toBuffer(consensus).copy(buf);
  casBuf.copy(buf, 32);
  return bufferToHex(keccak256(buf));
}

const web3 = new Web3();
const provider = new HDWalletProvider(validatorPriv, providerUrl);
const claimantAddr = bufferToHex(privateToAddress(validatorPriv));
web3.setProvider(provider);
const swapRegistry = new web3.eth.Contract(swapAbi, swapAddr);
const operatorContract = new web3.eth.Contract(
  operatorAbi,
  operatorContractAddr
);

const run = async function() {
  let slotId;

  // get events and filter out data
  const events = await getPastEvents(operatorContract, fromHeight, toHeight);
  const data = events
    .filter(event => {
      const { owner } = event.returnValues;
      return owner && owner.toLowerCase() === claimantAddr.toLowerCase();
    })
    .map(event => {
      const { owner, blocksRoot } = event.returnValues;
      slotId = event.returnValues.slotId; // eslint-disable-line prefer-destructuring

      const consenusBuf = Buffer.alloc(64, 0);
      toBuffer(blocksRoot).copy(consenusBuf);
      const consensusRoot = bufferToHex(keccak256(consenusBuf));

      const validatorBuf = Buffer.alloc(32, 0);
      validatorBuf.writeUInt8(slotId, 11);
      toBuffer(owner).copy(validatorBuf, 12);
      const validatorData = bufferToHex(validatorBuf);

      const empty = bufferToHex(Buffer.alloc(32, 0));

      return {
        consensusRoot,
        cas: empty,
        validatorData,
        rest: empty,
      };
    })
    .reduce((accumulator, event) => {
      let acc = accumulator;
      if (!acc.push) {
        acc = [[], [], [], []];
      }
      acc[0].push(event.consensusRoot);
      acc[1].push(event.cas);
      acc[2].push(event.validatorData);
      acc[3].push(event.rest);
      return acc;
    });

  // read data from bridge
  const bridgeAddr = await operatorContract.methods.bridge().call();
  const bridge = new web3.eth.Contract(bridgeABI, bridgeAddr);
  const startRoot = getPeriodRoot(
    data[0][0],
    data[1][0],
    data[2][0],
    data[3][0]
  );
  const last = data[0].length - 1;
  const endRoot = getPeriodRoot(
    data[0][last],
    data[1][last],
    data[2][last],
    data[3][last]
  );
  let periodRsp = await bridge.methods.periods(startRoot).call();
  console.log('start height: ', periodRsp.height);
  periodRsp = await bridge.methods.periods(endRoot).call();
  console.log('end height: ', periodRsp.height);

  // claim rewards by submitting
  const slices = separateForSubmission(data, BATCH_SIZE);
  let estimate = await swapRegistry.methods
    .claim(slotId, ...slices[0])
    .estimateGas({ from: claimantAddr });
  estimate = Math.floor(estimate * 1.2);
  for (const slice of slices) {
    const rsp = await swapRegistry.methods // eslint-disable-line no-await-in-loop
      .claim(slotId, ...slice)
      .send({ from: claimantAddr, gas: estimate });
    console.log('submitting: ', rsp.transactionHash);
  }
  console.log('done');
};
run();
