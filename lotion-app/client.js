const lotion = require('lotion');
const Web3 = require('web3');
const { Tx } = require('parsec-lib');
const makeTransfer = require('./makeTransfer');

const web3 = new Web3('https://rinkeby.infura.io');

const privKey =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const account = web3.eth.accounts.privateKeyToAccount(privKey);
const GCI = 'bcf3e255844465760a087ec3050b60af6eb10fc47e71600c6fff2bfd025f6d81';

async function run() {
  const client = await lotion.connect(GCI);
  console.log(client);

  console.log(await client.state.balances);

  const deposit = Tx.deposit(12, 5000, account.address);
  await client.send({ encoded: deposit.hex() });
  console.log('Deposit:', deposit.hex());
  console.log(await client.state.balances);

  const transfer1 = makeTransfer(
    client,
    account.address,
    '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad',
    4000,
    { privKey }
  );
  await client.send({ encoded: transfer1.hex() });
  console.log('Transfer:', transfer1.hex());
  console.log(await client.state.balances);

  const transfer2 = makeTransfer(
    client,
    account.address,
    '0x9caa3424cb91900ef7ac41a7b04a246304c02d3a',
    1000,
    { privKey }
  );
  await client.send({ encoded: transfer2.hex() });
  console.log('Transfer:', transfer2.hex());
  console.log(await client.state.balances);
}

run();
