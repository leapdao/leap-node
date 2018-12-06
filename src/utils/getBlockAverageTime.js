const getBlockAverageTime = async web3 => {
  const span = 40000;
  const blockNumber = await web3.eth.getBlockNumber();
  const b1 = await web3.eth.getBlock(blockNumber);
  const b2 = await web3.eth.getBlock(Math.max(0, blockNumber - span));
  return (b1.timestamp - b2.timestamp) / (b1.number - b2.number);
};

module.exports = getBlockAverageTime;
