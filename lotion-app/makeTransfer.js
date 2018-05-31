const { Tx, Input, Outpoint, Output } = require('parsec-lib');

function sumAddressOutputs(tx, address) {
  return tx.outputs
    .filter(output => output && output.address === address)
    .reduce((sum, o) => sum + o.value);
}

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
  const balance = (await client.state.balances[from]) || 0;

  if (balance < amount) {
    throw new Error('Insufficient balance');
  }

  const unspent = await client.state.unspent;
  const senderUnspent = Object.keys(unspent)
    .map(k => unspent[k])
    .filter(
      tx =>
        tx.outputs.findIndex(output => output && output.address === from) > -1
    )
    .sort((a, b) => {
      const aSum = sumAddressOutputs(a, from);
      const bSum = sumAddressOutputs(b, from);

      return aSum - bSum;
    });

  const inputs = [];
  const outputs = [new Output(amount, to)];
  let sum = 0;
  for (let i = 0; i < senderUnspent.length; i += 1) {
    const tx = senderUnspent[i];
    for (let j = 0; j < tx.outputs.length; j += 1) {
      const output = tx.outputs[j];

      if (output && output.address === from) {
        inputs.push(new Input(new Outpoint(tx.hash, j)));
        sum += output.value;

        if (sum >= amount) {
          break;
        }
      }
    }

    if (sum >= amount) {
      break;
    }
  }

  if (sum > amount) {
    outputs.push(new Output(sum - amount, from));
  }

  const tx = Tx.transfer(height, inputs, outputs);

  if (privKey) {
    tx.sign(tx.inputs.map(() => privKey));
  }

  return tx;
};
