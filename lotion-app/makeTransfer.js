const { Tx, Input, Outpoint, Output } = require('parsec-lib');

/*
 * Creates transfer tx based on address unspent outputs
 */
// ToDo: solve subset sum/knapsack problem for optimal outputs usage
module.exports = async function transfer(
  client,
  from,
  to,
  amount,
  { height, privKey } = {}
) {
  let fromAddr = from.toLowerCase(); // eslint-disable-line
  to = to.toLowerCase(); // eslint-disable-line
  const balance = (await client.state.balances[fromAddr]) || 0;

  if (balance < amount) {
    throw new Error('Insufficient balance');
  }

  const unspent = await client.state.unspent;
  const senderUnspent = Object.keys(unspent)
    .map(k => ({
      outpoint: Outpoint.fromRaw(k),
      output: unspent[k],
    }))
    .filter(unspend => {
      return unspend.output && unspend.output.address === fromAddr;
    })
    .sort((a, b) => {
      return a.output.value - b.output.value;
    });

  if (senderUnspent.length === 0) {
    throw new Error(`There are no unspents for address ${fromAddr}`);
  }

  const inputs = [];
  const outputs = [new Output(amount, to)];
  let sum = 0;
  for (let i = 0; i < senderUnspent.length; i += 1) {
    inputs.push(new Input(senderUnspent[i].outpoint));
    sum += senderUnspent[i].output.value;

    if (sum >= amount) {
      break;
    }
  }

  if (inputs.length === 0) {
    throw new Error('No inputs');
  }

  if (sum > amount) {
    outputs.push(new Output(sum - amount, fromAddr));
  }

  const tx = Tx.transfer(height, inputs, outputs);

  if (privKey) {
    return tx.sign(tx.inputs.map(() => privKey));
  }

  return tx;
};
