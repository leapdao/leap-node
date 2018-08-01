const express = require('express');
const { json } = require('body-parser');
const axios = require('axios');
const encodeTx = require('./tx-encoding.js').encode;
const proxy = require('express-http-proxy');
const cors = require('cors');

module.exports = ({
  // port,
  // tendermintPort,
  tendermintRpcUrl,
  store,
  nodeInfo,
}) => {
  const app = express();
  app.use(cors());
  app.use(json({ type: '*/*' }));
  app.post('/txs', async (req, res) => {
    // encode transaction bytes, send it to tendermint node
    const nonce = Math.floor(Math.random() * (2 << 12)); // eslint-disable-line no-bitwise
    const txBytes = `0x${encodeTx(req.body, nonce).toString('hex')}`;
    const result = await axios.get(`${tendermintRpcUrl}/broadcast_tx_commit`, {
      params: {
        tx: txBytes,
      },
    });
    const response = {
      result: result.data.result,
    };
    res.json(response);
  });

  app.get('/info', (req, res) => {
    res.json(nodeInfo);
  });
  app.use('/tendermint', proxy(tendermintRpcUrl));

  app.get('/state', (req, res) => {
    res.json(store);
  });

  return app;
};
