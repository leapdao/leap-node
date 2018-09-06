const { GENESIS } = require('./constants');

const BLOCK_GUESS_GAP = 10000;

const getBlockAverageTime = async web3 => {
  const span = 40000;
  const blockNumber = await web3.eth.getBlockNumber();
  const b1 = await web3.eth.getBlock(blockNumber);
  const b2 = await web3.eth.getBlock(blockNumber - span);

  return (b1.timestamp - b2.timestamp) / span;
};

const estimateBlockNumber = async (web3, timestamp) => {
  const blockNumber = await web3.eth.getBlockNumber();
  const blockTime = await getBlockAverageTime(web3);

  return Math.floor(
    blockNumber - (Date.now() - timestamp * 1000) / (blockTime * 1000)
  );
};

module.exports = async (web3, bridge) => {
  const period = await bridge.methods.periods(GENESIS).call();
  const guess = await estimateBlockNumber(web3, Number(period.timestamp));
  return guess - BLOCK_GUESS_GAP;
};
