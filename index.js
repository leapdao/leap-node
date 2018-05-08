const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const Node = require('./src/Node');

const argv = require('minimist')(process.argv.slice(2));

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://rinkeby.infura.io'));

const node = new Node(web3, argv.bridgeAddr);
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
  const hash = await node.sendRawTransaction(req.body.transaction);
  res.send(hash);
});

setInterval(() => {
  node.submitBlock();
}, (argv.interval || 1) * 60 * 1000);

// ToDo: listen contract events here

console.log('Initializing node');
node.init().then(
  () => {
    const port = argv.port || argv.p || '8585';
    const host = argv.host || argv.h || '127.0.0.1';
    app.listen(port, host, err => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Running on ${host}:${port}`);
      }
    });
  },
  error => {
    console.error('Initialization failed with error:', error.message);
  }
);
