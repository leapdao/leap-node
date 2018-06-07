const { delay } = require('./utils');

module.exports = async (rsp, chainInfo, height, { node }) => {
  console.log('checkBridge: ', chainInfo, node);
  await delay(200); // simulates submit
  rsp.status = 1;
};
