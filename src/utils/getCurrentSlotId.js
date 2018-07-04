const { EMPTY_ADDRESS } = require('./constants');

module.exports = function getCurrentSlotId(slots, height) {
  const activeSlots = slots.filter(s => s.owner !== EMPTY_ADDRESS);
  const index = height % activeSlots.length;
  return activeSlots[index] && activeSlots[index].id;
};
