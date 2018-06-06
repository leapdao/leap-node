const Web3 = require('web3');
const connect = require('lotion-connect');
const { Tx, Input, Outpoint } = require('parsec-lib');
const lotion = require('lotion');

const bridgeABI = require('./src/bridgeABI');
const ContractEventsSubscription = require('./src/ContractEventsSubscription');
const validateTx = require('./src/validateTx');
const validateBlock = require('./src/validateBlock');
const { map } = require('./src/utils');

const config = require('./config.json');

if (!config.bridgeAddr) {
  console.error('bridgeAddr is required');
  process.exit(0);
}

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(config.network));

// const bridgeAddr = '0xE5a9bDAFF671Dc0f9e32b6aa356E4D8938a49869';
const bridge = new web3.eth.Contract(bridgeABI, config.bridgeAddr);

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

app.listen(config.port).then(async params => {
  console.log(params);
  const client = await connect(params.GCI);

  const handleDeposit = async event => {
    const deposit = await bridge.methods
      .deposits(event.returnValues.depositId)
      .call();
    const tx = Tx.deposit(
      event.returnValues.depositId,
      Number(deposit.amount),
      deposit.owner
    );
    await client.send({ encoded: tx.hex() });
  };

  const handleExit = async event => {
    const { txHash, outIndex } = event.returnValues;
    const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
    await client.send({ encoded: tx.hex() });
  };

  const eventSubscription = new ContractEventsSubscription(web3, bridge, 1000);
  const {
    NewDeposit: deposits = [],
    ExitStarted: exits = [],
  } = await eventSubscription.init();

  await Promise.all(deposits.map(handleDeposit));
  await Promise.all(exits.map(handleExit));

  eventSubscription.on('NewDeposit', map(handleDeposit));
  eventSubscription.on('ExitStarted', map(handleExit));
});
