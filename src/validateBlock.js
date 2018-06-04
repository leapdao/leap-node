const { delay } = require('./utils');

module.exports = async (state, chainInfo) => {
  // check if this is a validator
  // how to get address of this validator?
  if (chainInfo.height % 32 === 0) {
    // how to find slot?
    // define order of submission by list of validator addresses
    // build period and submit
    await delay(200); // simulates network (contract calls, etc)
  }
};
