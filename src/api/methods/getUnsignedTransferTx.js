const { isValidAddress } = require('ethereumjs-util');
const getColor = require('./getColor');
const makeTransfer = require('../../txHelpers/makeTransfer');

module.exports = async (bridgeState, from, to, colorOrAddress, value) => {
  let color = colorOrAddress;
  if (isValidAddress(colorOrAddress)) {
    color = await getColor(bridgeState, colorOrAddress);
  }

  const tx = await makeTransfer(
    {
      balances: bridgeState.currentState.balances,
      unspent: bridgeState.currentState.unspent,
    },
    from,
    to,
    value,
    Number(color)
  );
  return tx.toJSON();
};
