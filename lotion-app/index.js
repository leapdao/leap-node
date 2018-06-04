const Web3 = require('web3');
const { Tx } = require('parsec-lib');
const lotion = require('lotion');

const bridgeABI = require('../src/bridgeABI');
const validateTx = require('./validateTx');
const validateBlock = require('./validateBlock');

const bridgeAddr = '0x6b12ff9d695459ce4a840f7f70e43d3b300a1432';
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://rinkeby.infura.io'));

const bridge = new web3.eth.Contract(bridgeABI, bridgeAddr);

const app = lotion({
  initialState: {
    balances: {}, // stores account balances
    unspent: {}, // stores unspent outputs (deposits, transfers)
  },
  abciPort: 46658,
});

app.useTx((state, { encoded }) => {
  validateTx(state, Tx.fromRaw(encoded), bridge);
});

app.useBlock(validateBlock);

app.listen(process.env.PORT || 3000).then(params => console.log(params));
