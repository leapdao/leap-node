module.exports = (state, tx) => {
  state.mempool.push(tx.toJSON());
};
