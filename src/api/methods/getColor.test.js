const getColor = require('./getColor');
const { NFT_COLOR_BASE } = require('./constants');

const { erc20Tokens, erc721Tokens, contract } = require('./getColors.test');

describe('getColor', () => {
  test('erc20 color', async () => {
    expect(await getColor({ contract }, erc20Tokens[0])).toBe('0x0');
    expect(await getColor({ contract }, erc20Tokens[1])).toBe('0x1');
  });

  test('erc721 color', async () => {
    expect(await getColor({ contract }, erc721Tokens[0])).toBe(
      `0x${NFT_COLOR_BASE.toString(16)}`
    );
    expect(await getColor({ contract }, erc721Tokens[1])).toBe(
      `0x${(NFT_COLOR_BASE + 1).toString(16)}`
    );
  });

  test('non-existent color', async () => {
    let error;
    try {
      await getColor(
        { contract },
        '0x25e70D10AE0E481975aD8fA30f4e67653c441111'
      );
    } catch (err) {
      error = err.message;
    }

    expect(error).toBe('Unknown token address');
  });
});
