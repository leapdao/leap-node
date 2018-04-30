const express = require('express');
const bodyParser = require('body-parser');
const Node = require('./Node');

const argv = require('minimist')(process.argv.slice(2));

const node = new Node();
const app = express();

app.use(
  bodyParser.json({
    type: 'application/*+json',
  })
);

app.get('/block/:hash', async (req, res) => {
  const block = await node.getBlock(req.params.hash);
  res.send(block);
});

app.get('/tx/:hash', async (req, res) => {
  const tx = await node.getTransaction(req.params.hash);
  res.send(tx);
});

app.get('/currentBlock', async (req, res) => {
  const hash = await node.getCurrentBlock();
  res.send(hash);
});

app.post('/sendRawTransaction', async (req, res) => {
  const hash = await node.getCurrentBlock(req.body.transaction);
  res.send(hash);
});

setInterval(() => {
  node.submitBlock();
}, (argv.interval || 1) * 60 * 1000);

// ToDo: listen contract events here

const port = argv.port || argv.p || '8585';
const host = argv.host || argv.h || '127.0.0.1';
app.listen(port, host, err => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Running on ${host}:${port}`);
  }
});
