module.exports = function unspentForAddress(unspent, address) {
  return Object.keys(unspent)
    .map(k => ({
      outpoint: k,
      output: unspent[k],
    }))
    .filter(u => {
      return (
        u.output && u.output.address.toLowerCase() === address.toLowerCase()
      );
    })
    .sort((a, b) => {
      return a.output.value - b.output.value;
    });
};
