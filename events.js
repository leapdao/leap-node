const Web3 = require('web3');
const ABI = require('./src/bridgeABI');
const { GENESIS } = require('./src/utils');

const web3 = new Web3('http://localhost:8544');
const bridge = new web3.eth.Contract(
  ABI,
  '0xf0c95081114f61e44ce2470ddd1611756db6db4c'
);

const BLOCK_GUESS_GAP = 10000;

const getBlockAverageTime = async () => {
  const span = 500;
  const blockNumber = await web3.eth.getBlockNumber();
  const b1 = await web3.eth.getBlock(blockNumber);
  const b2 = await web3.eth.getBlock(blockNumber - span);

  return (b1.timestamp - b2.timestamp) / span;
};

const estimateBlockNumber = async timestamp => {
  const latestBlock = await web3.eth.getBlockNumber();

  return Math.floor(
    latestBlock -
      (Date.now() - timestamp * 1000) / ((await getBlockAverageTime()) * 1000)
  );
};

async function getGenesisBlock(contract) {
  const period = await contract.methods.periods(GENESIS).call();
  const guess = await estimateBlockNumber(Number(period.timestamp));
  return guess - BLOCK_GUESS_GAP;
}

async function run() {
  const block = await getGenesisBlock(bridge);

  console.log(block);
}

run();
