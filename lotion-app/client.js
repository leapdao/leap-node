const connect = require('lotion-connect');
const Web3 = require('web3');
const { Tx } = require('parsec-lib');
const makeTransfer = require('./makeTransfer');

const web3 = new Web3('https://rinkeby.infura.io');

const privKey =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const account = web3.eth.accounts.privateKeyToAccount(privKey);
const GCI = '1a90d93654d5d6cd3b592d37393276ecb6ce0ddd6251b4d7f3c1250f1329a67e';

async function run() {
  const client = await connect(GCI);

  console.log('------');
  console.log(await client.state.balances);
  console.log('------');

  const deposit = Tx.deposit(12, 5000, account.address);
  await client.send({ encoded: deposit.hex() });
  console.log('Deposit:', deposit.hex());
  console.log('------');
  console.log(await client.state.balances);
  console.log('------');

  const transfer1 = await makeTransfer(
    client,
    account.address,
    '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad',
    4000,
    { privKey }
  );
  await client.send({ encoded: transfer1.hex() });
  console.log('Transfer:', transfer1.hex());
  console.log('------');
  console.log(await client.state.balances);
  console.log('------');

  const transfer2 = await makeTransfer(
    client,
    account.address,
    '0x9caa3424cb91900ef7ac41a7b04a246304c02d3a',
    1000,
    { privKey }
  );
  await client.send({ encoded: transfer2.hex() });
  console.log('Transfer:', transfer2.hex());
  console.log('------');
  console.log(await client.state.balances);
  console.log('------');
}

run();
