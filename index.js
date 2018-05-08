const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const dashdash = require('dashdash');
const Node = require('./src/Node');

const dashParser = dashdash.createParser({
  options: [
    {
      names: ['port', 'p'],
      type: 'number',
      default: 8545,
      help: 'REST API port',
    },
    {
      names: ['host', 'h'],
      type: 'string',
      default: '127.0.0.1',
      help: 'REST API host',
    },
    {
      names: ['bridgeAddr'],
      type: 'string',
      help: 'ParsecBridge contract address',
    },
    {
      names: ['interval'],
      type: 'number',
      default: 1,
      help: 'Interval in minutes for submitting new block',
    },
    {
      names: ['help'],
      type: 'bool',
      help: 'Print this help and exit.',
    },
  ],
});
const options = dashParser.parse();

if (options.help) {
  const help = dashParser.help({ includeEnv: true }).trimRight();
  console.log('Options:', help);
  process.exit(0);
}

if (!options.bridgeAddr) {
  console.error('bridgeAddr is required');
  process.exit(0);
}

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://rinkeby.infura.io'));

const node = new Node(web3, options.bridgeAddr);
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
}, (options.interval || 1) * 60 * 1000);

// ToDo: listen contract events here

console.log('Initializing node', options);
node.init().then(
  () => {
    app.listen(options.port, options.host, err => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Running on ${options.host}:${options.port}`);
      }
    });
  },
  error => {
    console.error('Initialization failed with error:', error.message);
  }
);
