const lotion = require('lotion');

const validateTx = require('./validateTx');
const validateBlock = require('./validateBlock');

// const bridgeAddr = '0xa0a368325920b028e4da0ee2d7ccd8468b7ad1ee';

const app = lotion({
  initialState: {
    balances: {}, // stores account balances
    unspent: {}, // stores unspent outputs (deposits, transfers)
  },
  abciPort: 46658,
});

app.useTx(validateTx);

app.useBlock(validateBlock);

app.listen(process.env.PORT || 3000).then(params => console.log(params));
