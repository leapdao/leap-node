const getColors = require('./getColors');
const { NFT_COLOR_BASE, NST_COLOR_BASE } = require('./constants');

const erc20Tokens = [
  '0x258daf43d711831b8fd59137f42030784293e9e6',
  '0x25e70d10ae0e481975ad8fa30f4e67653c444a05',
];
const erc721Tokens = [
  '0x1111af43d711831b8fd59137f42030784293e9e6',
  '0x2222af43d711831b8fd59137f42030784293e9e6',
];
const erc1948Tokens = [
  '0x2111af43d711831b8fd59137f42030784293e9e6',
  '0x3111af43d711831b8fd59137f42030784293e9e6',
];
const tokens = {};
erc20Tokens.forEach((addr, i) => {
  tokens[i] = addr;
});
erc721Tokens.forEach((addr, i) => {
  tokens[NFT_COLOR_BASE + i] = addr;
});
erc1948Tokens.forEach((addr, i) => {
  tokens[NST_COLOR_BASE + i] = addr;
});

exports.erc20Tokens = erc20Tokens;
exports.erc721Tokens = erc721Tokens;
exports.erc1948Tokens = erc1948Tokens;

describe('getColors', () => {
  test('ERC20 colors', async () => {
    const colors = await getColors(
      { tokens: { erc20: erc20Tokens, erc721: erc721Tokens } },
      false
    );
    expect(colors.length).toBe(2);
    expect(colors[0]).toBe(erc20Tokens[0].toLowerCase());
    expect(colors[1]).toBe(erc20Tokens[1].toLowerCase());
  });

  test('ERC20 colors cache', async () => {
    const tokensCache = { erc20: erc20Tokens, erc721: erc721Tokens };
    const colors = await getColors({ tokens: tokensCache }, false);
    expect(tokensCache.erc20.map(c => c.toLowerCase())).toEqual(
      erc20Tokens.map(c => c.toLowerCase())
    );
    expect(tokensCache.erc20.map(c => c.toLowerCase())).toEqual(
      colors.map(c => c.toLowerCase())
    );
  });

  test('ERC721 colors', async () => {
    const colors = await getColors(
      { tokens: { erc20: erc20Tokens, erc721: erc721Tokens } },
      true
    );
    expect(colors.length).toBe(2);
    expect(colors[0]).toBe(erc721Tokens[0].toLowerCase());
    expect(colors[1]).toBe(erc721Tokens[1].toLowerCase());
  });

  test('ERC721 colors cache', async () => {
    const tokensCache = { erc20: erc20Tokens, erc721: erc721Tokens };
    const colors = await getColors({ tokens: tokensCache }, true);
    expect(tokensCache.erc721.map(c => c.toLowerCase())).toEqual(
      erc721Tokens.map(c => c.toLowerCase())
    );
    expect(tokensCache.erc721.map(c => c.toLowerCase())).toEqual(
      colors.map(c => c.toLowerCase())
    );
  });

  test('ERC1948 colors', async () => {
    const colors = await getColors(
      { tokens: { erc20: erc20Tokens, erc721: erc721Tokens, erc1948: erc1948Tokens } },
      false,
      true
    );
    expect(colors.length).toBe(2);
    expect(colors[0]).toBe(erc1948Tokens[0].toLowerCase());
    expect(colors[1]).toBe(erc1948Tokens[1].toLowerCase());
  });

  test('ERC1948 colors cache', async () => {
    const tokensCache = { erc20: erc20Tokens, erc721: erc721Tokens, erc1948: erc1948Tokens };
    const colors = await getColors({ tokens: tokensCache }, false, true);
    expect(tokensCache.erc1948.map(c => c.toLowerCase())).toEqual(
      erc1948Tokens.map(c => c.toLowerCase())
    );
    expect(tokensCache.erc1948.map(c => c.toLowerCase())).toEqual(
      colors.map(c => c.toLowerCase())
    );
  });
});
