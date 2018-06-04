const connect = require('lotion-connect');
const Web3 = require('web3');
const { Tx } = require('parsec-lib');
const lotion = require('lotion');

const bridgeABI = require('../src/bridgeABI');
const ContractEventsSubscription = require('../src/ContractEventsSubscription');
const validateTx = require('./validateTx');
const validateBlock = require('./validateBlock');

const bridgeAddr = '0xE5a9bDAFF671Dc0f9e32b6aa356E4D8938a49869';
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

app.useTx(async (state, { encoded }) => {
  await validateTx(state, Tx.fromRaw(encoded), bridge);
});

app.useBlock(validateBlock);

app.listen(process.env.PORT || 3000).then(async params => {
  console.log(params);
  const client = await connect(params.GCI);

  const eventSubscription = new ContractEventsSubscription(web3, bridge, 1000);
  eventSubscription.on('NewDeposit', async event => {
    const deposit = await bridge.methods
      .deposits(event.returnValues.depositId)
      .call();
    const tx = Tx.deposit(
      event.returnValues.depositId,
      Number(deposit.amount),
      deposit.owner
    );
    await client.send({ encoded: tx.hex() });
  });
});
