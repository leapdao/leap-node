const addrCmp = require('./addrCmp');

module.exports = (slots, address) => {
  return slots.filter(slot => addrCmp(slot.signer, address));
};
