const getCode = require('./getCode');
const { INVALID_PARAMS } = require('./constants');
const BYTECODES = require('../../tx/applyTx/ercBytecode.js');

const CODE_ERC20 = `0x${BYTECODES.ERC20_BYTECODE.toString('hex')}`;
const CODE_ERC721 = `0x${BYTECODES.ERC721_BYTECODE.toString('hex')}`;
const CODE_ERC1948 = `0x${BYTECODES.ERC1948_BYTECODE.toString('hex')}`;

const {
  erc20Tokens,
  erc721Tokens,
  erc1948Tokens,
} = require('./getColors.test');

const tokens = {
  erc20: erc20Tokens,
  erc721: erc721Tokens,
  erc1948: erc1948Tokens,
};

describe('getCode', () => {
  test('ERC20', async () => {
    expect(await getCode({ tokens }, erc20Tokens[0], 'latest')).toBe(
      CODE_ERC20
    );
    expect(await getCode({ tokens }, erc20Tokens[1], 'latest')).toBe(
      CODE_ERC20
    );
  });

  test('ERC721', async () => {
    expect(await getCode({ tokens }, erc721Tokens[0], 'latest')).toBe(
      CODE_ERC721
    );
    expect(await getCode({ tokens }, erc721Tokens[1], 'latest')).toBe(
      CODE_ERC721
    );
  });

  test('ERC1948', async () => {
    expect(await getCode({ tokens }, erc1948Tokens[0], 'latest')).toBe(
      CODE_ERC1948
    );
    expect(await getCode({ tokens }, erc1948Tokens[1], 'latest')).toBe(
      CODE_ERC1948
    );
  });

  test('Invoking without block tag = latest', async () => {
    let errCode;
    let errMsg;
    try {
      await getCode({ tokens }, erc20Tokens[0], '0xff');
    } catch (err) {
      errCode = err.code;
      errMsg = err.message;
    }

    expect(errCode).toBe(INVALID_PARAMS);
    expect(errMsg).toBe('Only call for latest block is supported');
  });

  test('Invoking with non-existent contract address', async () => {
    let errCode;
    let errMsg;
    try {
      await getCode(
        { tokens },
        '0x25e70D10AE0E481975aD8fA30f4e67653c441111',
        'latest'
      );
    } catch (err) {
      errCode = err.code;
      errMsg = err.message;
    }

    expect(errCode).toBe(INVALID_PARAMS);
    expect(errMsg).toBe('Contract not found');
  });
});
