const Web3 = require('web3');
const dashdash = require('dashdash');
const connect = require('lotion-connect');
const { Tx } = require('parsec-lib');
const lotion = require('lotion');

const bridgeABI = require('./src/bridgeABI');
const ContractEventsSubscription = require('./src/ContractEventsSubscription');
const validateTx = require('./src/validateTx');
const validateBlock = require('./src/validateBlock');

const dashParser = dashdash.createParser({
  options: [
    {
      names: ['port', 'p'],
      type: 'number',
      default: 3000,
      help: 'REST API port',
    },
    {
      names: ['bridgeAddr'],
      type: 'string',
      help: 'ParsecBridge contract address',
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
  console.log('Options:');
  console.log(help);
  process.exit(0);
}

if (!options.bridgeAddr) {
  console.error('bridgeAddr is required');
  process.exit(0);
}

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://rinkeby.infura.io'));

// const bridgeAddr = '0xE5a9bDAFF671Dc0f9e32b6aa356E4D8938a49869';
const bridge = new web3.eth.Contract(bridgeABI, options.bridgeAddr);

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

app.listen(options.port).then(async params => {
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
