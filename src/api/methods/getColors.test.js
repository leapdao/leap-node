const getColors = require('./getColors');
const { NFT_COLOR_BASE } = require('./constants');

const erc20Tokens = [
  '0x258DaF43D711831b8FD59137F42030784293e9E6',
  '0x25e70D10AE0E481975aD8fA30f4e67653c444A05',
];
const erc721Tokens = [
  '0x1111aF43D711831b8FD59137F42030784293e9E6',
  '0x2222aF43D711831b8FD59137F42030784293e9E6',
];
const tokens = {};
erc20Tokens.forEach((addr, i) => {
  tokens[i] = addr;
});
erc721Tokens.forEach((addr, i) => {
  tokens[NFT_COLOR_BASE + i] = addr;
});

const exitHandlerContract = {
  methods: {
    erc20TokenCount: () => ({
      call: async () => erc20Tokens.length,
    }),
    nftTokenCount: () => ({
      call: async () => erc721Tokens.length,
    }),
    tokens: i => ({
      call: async () => {
        return { addr: tokens[i] };
      },
    }),
  },
};

exports.erc20Tokens = erc20Tokens;
exports.erc721Tokens = erc721Tokens;
exports.exitHandlerContract = exitHandlerContract;

describe('getColors', () => {
  test('ERC20 colors', async () => {
    const colors = await getColors(
      { exitHandlerContract, tokens: { erc20: [], erc721: [] } },
      false
    );
    expect(colors.length).toBe(2);
    expect(colors[0]).toBe(erc20Tokens[0].toLowerCase());
    expect(colors[1]).toBe(erc20Tokens[1].toLowerCase());
  });

  test('ERC20 colors cache', async () => {
    const tokensCache = { erc20: [], erc721: [] };
    const colors = await getColors(
      { exitHandlerContract, tokens: tokensCache },
      false
    );
    expect(tokensCache.erc20.map(c => c.toLowerCase())).toEqual(
      erc20Tokens.map(c => c.toLowerCase())
    );
    expect(tokensCache.erc20.map(c => c.toLowerCase())).toEqual(
      colors.map(c => c.toLowerCase())
    );
  });

  test('ERC721 colors', async () => {
    const colors = await getColors(
      { exitHandlerContract, tokens: { erc20: [], erc721: [] } },
      true
    );
    expect(colors.length).toBe(2);
    expect(colors[0]).toBe(erc721Tokens[0].toLowerCase());
    expect(colors[1]).toBe(erc721Tokens[1].toLowerCase());
  });

  test('ERC721 colors cache', async () => {
    const tokensCache = { erc20: [], erc721: [] };
    const colors = await getColors(
      { exitHandlerContract, tokens: tokensCache },
      true
    );
    expect(tokensCache.erc721.map(c => c.toLowerCase())).toEqual(
      erc721Tokens.map(c => c.toLowerCase())
    );
    expect(tokensCache.erc721.map(c => c.toLowerCase())).toEqual(
      colors.map(c => c.toLowerCase())
    );
  });
});
