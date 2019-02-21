const executeCall = require('./executeCall');
const {
  erc20Tokens,
  erc721Tokens,
  exitHandlerContract,
} = require('./getColors.test');
const { NFT_COLOR_BASE } = require('./constants');

const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const signatures = {
  tokenOfOwnerByIndex: '0x2f745c59000000000000000000000000',
  balanceOf: '0x70a08231000000000000000000000000',
  unsupported: '0x00000000000000000000000000000000', // represents any unsupported method
};
const tokens = { erc20: [], erc721: [] };

describe('executeCall', () => {
  test('tag != latest', async () => {
    let error;
    try {
      await executeCall(null, null, 'pending');
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('Only call for latest block is supported');
  });

  test('tokenOfOwnerByIndex', async () => {
    const callData = `${signatures.tokenOfOwnerByIndex}${A1.replace(
      '0x',
      ''
    )}${(0).toString(16).padStart(64, '0')}`;
    const tx = {
      data: callData,
      to: erc721Tokens[0],
    };

    const response = await executeCall(
      {
        exitHandlerContract,
        tokens,
        currentState: {
          balances: {
            [NFT_COLOR_BASE]: {
              [A1]: ['1'],
            },
          },
        },
      },
      tx,
      'latest'
    );
    expect(response).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );
  });

  test('tokenOfOwnerByIndex: index overflow', async () => {
    const callData = `${signatures.tokenOfOwnerByIndex}${A1.replace(
      '0x',
      ''
    )}${(0).toString(16).padStart(64, '0')}`;
    const tx = {
      data: callData,
      to: erc721Tokens[0],
    };

    let error;
    try {
      await executeCall(
        {
          exitHandlerContract,
          tokens,
          currentState: {
            balances: {},
          },
        },
        tx,
        'latest'
      );
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('Index overflow');
  });

  test('tokenOfOwnerByIndex: erc20color', async () => {
    const tx = {
      data: signatures.tokenOfOwnerByIndex,
      to: erc20Tokens[0],
    };

    let error;
    try {
      await executeCall(
        {
          exitHandlerContract,
          tokens,
          currentState: {
            balances: {},
          },
        },
        tx,
        'latest'
      );
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('Only for NFT');
  });

  test('balanceOf: erc20color', async () => {
    const tx = {
      data: `${signatures.balanceOf}${A1.replace('0x', '')}`,
      to: erc20Tokens[0],
    };

    const response = await executeCall(
      {
        exitHandlerContract,
        tokens,
        currentState: {
          balances: {
            0: {
              [A1]: 2000000000000000000,
            },
          },
        },
      },
      tx,
      'latest'
    );
    expect(response).toBe(
      '0x0000000000000000000000000000000000000000000000001bc16d674ec80000'
    );
  });

  test('balanceOf: empty erc20color', async () => {
    const tx = {
      data: `${signatures.balanceOf}${A1.replace('0x', '')}`,
      to: erc20Tokens[0],
    };

    const response = await executeCall(
      {
        exitHandlerContract,
        tokens,
        currentState: {
          balances: {},
        },
      },
      tx,
      'latest'
    );
    expect(response).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('balanceOf: erc721color', async () => {
    const tx = {
      data: `${signatures.balanceOf}${A1.replace('0x', '')}`,
      to: erc721Tokens[0],
    };

    const response = await executeCall(
      {
        exitHandlerContract,
        tokens,
        currentState: {
          balances: {
            [NFT_COLOR_BASE]: {
              [A1]: ['0000'],
            },
          },
        },
      },
      tx,
      'latest'
    );
    expect(response).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );
  });

  test('balanceOf: empty erc721color', async () => {
    const tx = {
      data: `${signatures.balanceOf}${A1.replace('0x', '')}`,
      to: erc721Tokens[0],
    };

    const response = await executeCall(
      {
        exitHandlerContract,
        tokens,
        currentState: {
          balances: {},
        },
      },
      tx,
      'latest'
    );
    expect(response).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    );
  });

  test('Unsupported method', async () => {
    const tx = {
      data: `${signatures.unsupported}`,
      to: erc20Tokens[0],
    };
    let error;
    try {
      await executeCall(null, tx, 'latest');
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('Method call 0x00000000 is not supported');
  });
});
