const axios = require('axios');

module.exports = async (txServerPort, rawTx) => {
  const url = `http://localhost:${txServerPort}/txs`;
  return axios.post(url, { encoded: rawTx });
};
