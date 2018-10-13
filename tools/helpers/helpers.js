const { helpers, Tx, Outpoint, Period, Block } = require('leap-core');
const { bufferToHex } = require('ethereumjs-util');

const range = (s, e) =>
  Array.from(new Array(e - s + 1), (_, i) => i + s);

function sleep(ms){
  return new Promise(resolve => {
      setTimeout(resolve,ms);
  })
}

function formatHostname(hostname, port) {
  return 'http://'+hostname+':'+port;
}

function unspentForAddress(unspent, address, color) {
  return Object.keys(unspent)
    .filter(
      k =>
        unspent[k] &&
        unspent[k].address.toLowerCase() === address.toLowerCase() &&
        (color !== undefined ? unspent[k].color === color : true)
    )
    .map(k => ({
      outpoint: k,
      output: unspent[k],
    }))
    .sort((a, b) => {
      return a.output.value - b.output.value;
    });
};

function makeTransfer(
  { balances, unspent },
  from,
  to,
  amount,
  color,
  privKey
) {

  let fromAddr = from.toLowerCase();
  to = to.toLowerCase();

  const colorBalances = balances[color] || {};
  const balance = colorBalances[fromAddr] || 0;

  if (balance < amount) {
    throw new Error('Insufficient balance');
  }

  const senderUnspent = unspentForAddress(unspent, from, color).map(u => ({
    output: u.output,
    outpoint: Outpoint.fromRaw(u.outpoint),
  }));

  const inputs = helpers.calcInputs(senderUnspent, from, amount, color);
  const outputs = helpers.calcOutputs(
    senderUnspent,
    inputs,
    fromAddr,
    to,
    amount,
    color
  );
  return Tx.transfer(inputs, outputs).signAll(privKey);
}

function makeTransferUxto(
  utxos,
  to,
  privKey
) {

  let from = utxos[0].output.address.toLowerCase();
  to = to.toLowerCase();
  const value = utxos.reduce((sum, unspent) => sum + unspent.output.value, 0);
  const color = utxos[0].output.color;

  return Tx.transferFromUtxos(utxos, from, to, value, color).signAll(privKey);
}

function periodOfTheBlock(web3, blockNumber) {
  // ToDo: fix typing in lib
  const periodNumber = Math.floor(blockNumber / 32);
  const startBlock = periodNumber * 32;
  const endBlock = periodNumber * 32 + 32;
  return Promise.all(
    range(startBlock, endBlock - 1).map(n => web3.eth.getBlock(n, true))
  ).then(blocks => {
    return new Period(
      null,
      blocks.filter(a => !!a).map(({ number, timestamp, transactions }) => {
        const block = new Block(number, {
          timestamp,
          txs: transactions.map(tx => Tx.fromRaw(tx.raw)),
        });

        return block;
      })
    );
  });
}

function getTxWithYoungestBlock(txs) {
  let youngestIndex = 0;
  let youngestInput = txs[0];
  txs.forEach((tx, i) => {
    if (tx.blockNumber > youngestInput.blockNumber) {
      youngestIndex = i;
      youngestInput = tx;
    }
  });
  return { index: youngestIndex, tx: youngestInput };
}

function getYoungestInputTx(web3, tx) {
  return Promise.all(tx.inputs.map(i =>
    web3.eth.getTransaction(bufferToHex(i.prevout.hash)),
  )).then(getTxWithYoungestBlock);
}

module.exports = { sleep, formatHostname, unspentForAddress, makeTransfer, makeTransferUxto, periodOfTheBlock, getYoungestInputTx };