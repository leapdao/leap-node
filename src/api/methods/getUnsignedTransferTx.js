const makeTransfer = require('../../txHelpers/makeTransfer');

module.exports = async (bridgeState, from, to, color, value) => {
  const tx = await makeTransfer(
    {
      balances: bridgeState.currentState.balances,
      unspent: bridgeState.currentState.unspent,
    },
    from,
    to,
    value,
    color
  );
  return tx.toJSON();
};
