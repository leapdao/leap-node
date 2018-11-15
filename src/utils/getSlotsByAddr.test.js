const getSlotsByAddr = require('./getSlotsByAddr');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0xc5a72c0bf9f59ed5a1d2ac9f29bd80c55279d2d3';

describe('getSlotsByAddr', () => {
  test('Find slots by address', () => {
    const slots = [
      {
        id: 0,
        signerAddr: ADDR_1,
      },
      {
        id: 1,
        signerAddr: ADDR_2,
      },
      {
        id: 2,
        signerAddr: ADDR_1,
      },
    ];
    const result = getSlotsByAddr(slots, ADDR_1);
    expect(result).toEqual([slots[0], slots[2]]);
  });
});
