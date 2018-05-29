const connect = require('lotion-connect');
const Web3 = require('web3');
const { Tx, Input, Outpoint, Output } = require('parsec-lib');

const web3 = new Web3('https://rinkeby.infura.io');

const privKey =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const account = web3.eth.accounts.privateKeyToAccount(privKey);
const GCI = '200713c64ad405214045ce46b6574cce1e0d1ff7dfa59744519d7300197e1e77';
// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getBalance(client, address) {
  console.log('getBalance', address);
  const bal = await client.state.balances[address];
  return bal || 0;
}

async function run() {
  const client = await connect(GCI);
  console.log(client);

  console.log(await getBalance(client, account.address));

  const deposit = Tx.deposit(12, 5000, account.address);
  await client.send({ encoded: deposit.hex() });
  console.log('Deposit:', deposit.hex());
  console.log(await getBalance(client, account.address));

  const transfer1 = Tx.transfer(
    0,
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(5000, '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad')]
  ).sign([privKey]);
  await client.send({ encoded: transfer1.hex() });
  console.log('Transfer:', transfer1.hex());
  console.log(await getBalance(client, account.address));
  console.log(
    await getBalance(client, '0x8AB21C65041778DFc7eC7995F9cDef3d5221a5ad')
  );
}

run();
