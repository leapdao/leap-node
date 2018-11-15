const getAuctionedByAddr = require('./getAuctionedByAddr');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0xc5a72c0bf9f59ed5a1d2ac9f29bd80c55279d2d3';

describe('getAuctionedByAddr', () => {
  test('Find auctioned slots by address', () => {
    const slots = [
      {
        id: 0,
        newSigner: ADDR_1,
      },
      {
        id: 1,
        newSigner: ADDR_2,
      },
      {
        id: 2,
        newSigner: ADDR_1,
      },
    ];
    const result = getAuctionedByAddr(slots, ADDR_1);
    expect(result).toEqual([slots[0], slots[2]]);
  });
});
