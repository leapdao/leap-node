const { BigInt } = require('jsbi-utils');

const { helpers, Tx, Outpoint } = require('leap-core');

const getUnspent = require('./getUnspent');

module.exports = async (bridgeState, from, to, color, value) => {
  from = from.toLowerCase(); // eslint-disable-line
  to = to.toLowerCase(); // eslint-disable-line

  const unspent = await getUnspent(bridgeState, from, color);

  const unspent1 = [];
  unspent.forEach((val, index) => {
    unspent1[index] = {
      outpoint: Outpoint.fromRaw(val.outpoint),
      output: val.output,
    };
  });

  const inputs = helpers.calcInputs(unspent1, from, BigInt(value), color);

  const outputs = helpers.calcOutputs(
    unspent1,
    inputs,
    from,
    to,
    BigInt(value),
    color
  );

  return Tx.transfer(inputs, outputs).toJSON();
};
