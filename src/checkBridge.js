const { delay } = require('./utils');

module.exports = async (rsp, chainInfo, height, { node }) => {
  console.log('checkBridge: ', chainInfo, node);
  // take the merkle root of prev_period
  // look up if it has been submitted to the bridge already
  await delay(200); // simulate reading from contract
  // return 1 if found in bridge
  // return 0 if not found in bridge, checkBridge will be called again in 5 secs
  rsp.status = 1;
};
