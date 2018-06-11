const { readSlots } = require('./utils');

/*
 * Removes validators except those having a slot
 */
module.exports = async (state, chainInfo) => {
  const slots = await readSlots();

  Object.keys(chainInfo.validators).forEach(addr => {
    chainInfo.validators[addr] = 0;
  });

  slots.forEach(slot => {
    const addr = slot.tendermint.replace('0x', '').toUpperCase();
    chainInfo.validators[addr] = 10;
  });
};
