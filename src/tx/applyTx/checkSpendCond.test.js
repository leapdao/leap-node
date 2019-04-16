const { Tx, Input, Outpoint, Output } = require('leap-core');
const utils = require('ethereumjs-util');
const checkSpendCond = require('./checkSpendCond');
const { NFT_COLOR_BASE, NST_COLOR_BASE } = require('../../api/methods/constants');

const erc20Tokens = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
];
const erc1948Tokens = [
  '0x3333333333333333333333333333333333333333',
  '0x4444444444444444444444444444444444444444',
];
const erc721Tokens = [
  '0x5555555555555555555555555555555555555555',
  '0x6666666666666666666666666666666666666666',
];

const bridgeState = {
  tokens: {
    erc20: erc20Tokens,
    erc721: erc721Tokens,
    erc1948: erc1948Tokens,
  },
  minGasPrices: [100],
};

const NFTCondition = '6080604052348015600f57600080fd5b5060043610602b5760e060020a6000350463d01a81e181146030575b600080fd5b605960048036036040811015604457600080fd5b50600160a060020a038135169060200135605b565b005b6040805160e060020a6323b872dd028152306004820152600160a060020a03841660248201526044810183905290517311111111111111111111111111111111111111119182916323b872dd9160648082019260009290919082900301818387803b15801560c857600080fd5b505af115801560db573d6000803e3d6000fd5b5050505050505056fea165627a7a723058206e658cc8b44fd3d32eef8c4222a0f8773e93bc6efa0fb08e4db77979dacc9e790029';

const NSTCondition = '6080604052348015600f57600080fd5b5060043610602b5760e060020a6000350463d3b7576c81146030575b600080fd5b605060048036036040811015604457600080fd5b50803590602001356052565b005b6040805160e060020a63a983d43f0281526004810184905260248101839052905173111111111111111111111111111111111111111191829163a983d43f9160448082019260009290919082900301818387803b15801560b157600080fd5b505af115801560c4573d6000803e3d6000fd5b5050505050505056fea165627a7a723058209d7c918824f80651fee7b4f8b99ed305e72e70fad4ff09430ebab4adf0eed3d40029';

// a script exists that can only be spent by spenderAddr defined in script
//
// pragma solidity ^0.5.2;
// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

// contract SpendingCondition {
//   address constant tokenAddr = 0x1111111111111111111111111111111111111111;
//   address constant spenderAddr = 0x82e8C6Cf42C8D1fF9594b17A3F50e94a12cC860f;

//   function fulfil(
//     bytes32 _r,        // signature
//     bytes32 _s,        // signature
//     uint8 _v,          // signature
//     address _receiver, // output
//     uint256 _amount    // output
//   ) public {
//     // check signature
//     address signer = ecrecover(bytes32(bytes20(address(this))) >> 96, _v, _r, _s);
//     require(signer == spenderAddr);

//     // do transfer
//     IERC20 token = IERC20(tokenAddr);
//     uint256 diff = token.balanceOf(address(this)) - _amount;
//     token.transfer(_receiver, _amount);
//     if (diff > 0) {
//       token.transfer(signer, diff);
//     }
//   }
// }
const conditionScript = Buffer.from(
  '608060405234801561001057600080fd5b5060043610610047577c01000000000000000000000000000000000000000000000000000000006000350463052853a9811461004c575b600080fd5b61009a600480360360a081101561006257600080fd5b5080359060208101359060ff6040820135169073ffffffffffffffffffffffffffffffffffffffff606082013516906080013561009c565b005b60408051600080825260208083018085526c010000000000000000000000006bffffffffffffffffffffffff193082021604905260ff87168385015260608301899052608083018890529251909260019260a080820193601f1981019281900390910190855afa158015610114573d6000803e3d6000fd5b5050604051601f19015191505073ffffffffffffffffffffffffffffffffffffffff81167382e8c6cf42c8d1ff9594b17a3f50e94a12cc860f1461015757600080fd5b604080517f70a08231000000000000000000000000000000000000000000000000000000008152306004820152905173111111111111111111111111111111111111111191600091859184916370a0823191602480820192602092909190829003018186803b1580156101c957600080fd5b505afa1580156101dd573d6000803e3d6000fd5b505050506040513d60208110156101f357600080fd5b5051604080517fa9059cbb00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff898116600483015260248201899052915193909203935084169163a9059cbb916044808201926020929091908290030181600087803b15801561027357600080fd5b505af1158015610287573d6000803e3d6000fd5b505050506040513d602081101561029d57600080fd5b5050600081111561034a57604080517fa9059cbb00000000000000000000000000000000000000000000000000000000815230600482015260248101839052905173ffffffffffffffffffffffffffffffffffffffff84169163a9059cbb9160448083019260209291908290030181600087803b15801561031d57600080fd5b505af1158015610331573d6000803e3d6000fd5b505050506040513d602081101561034757600080fd5b50505b505050505050505056fea165627a7a72305820e9428f6a563bc6943b4ced90c2be537e90ee8bffea1498ae74c032a3f66f5baa0029',
  'hex'
);

// PRIV matches spenderAddr hardcoded in script
const PRIV =
  '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';

async function expectToThrow(func) {
  let err;

  try {
    await func();
  } catch (e) {
    err = e;
  }

  if (!err) {
    throw new Error('expected to throw');
  }
}

describe('checkSpendCond', () => {
  test('valid tx', async () => {
    // a deposit to the above script has been done
    const scriptHash = utils.ripemd160(conditionScript);
    const deposit = Tx.deposit(
      123,
      5000000000,
      `0x${scriptHash.toString('hex')}`,
      // LEAP
      0
    );
    const deposit2 = Tx.deposit(
      1204,
      7000000000,
      `0x${scriptHash.toString('hex')}`,
      // LEAP
      0
    );

    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
        [new Outpoint(deposit2.hash(), 3).hex()]: deposit2.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const receiver = Buffer.from(
      '9999999999999999999999999999999999999999',
      'hex'
    );
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(deposit2.hash(), 3),
          script: conditionScript,
        }),
        new Input({
          prevout: new Outpoint(deposit.hash(), 0),
        }),
      ],
      [
        new Output(1992076700, `0x${receiver.toString('hex')}`, 0),
        new Output(2999993600, `0x${scriptHash.toString('hex')}`, 0),
      ]
    );

    const sig = condition.getConditionSig(PRIV);

    // msgData that satisfies the spending condition
    const vBuf = utils.setLengthLeft(utils.toBuffer(sig.v), 32);
    const amountBuf = utils.setLengthLeft(utils.toBuffer(1992076700), 32);
    const msgData =
      '0x052853a9' + // function called
      `${sig.r.toString('hex')}${sig.s.toString('hex')}${vBuf.toString(
        'hex'
      )}` + // signature
      `000000000000000000000000${receiver.toString('hex')}${amountBuf.toString(
        'hex'
      )}`; // outputs
    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);

    await checkSpendCond(state, condition, bridgeState, {
      network: { noSpendingConditions: false },
    });

    expect(
      checkSpendCond(state, condition, bridgeState, {
        network: { noSpendingConditions: true },
      })
    ).rejects.toEqual(
      new Error('Spending Conditions are not supported on this network')
    );
  });

  test('Spending Condition: NFT', async () => {
    const nftAddr = erc721Tokens[0];
    const script = Buffer.from(NFTCondition.replace('1111111111111111111111111111111111111111', nftAddr.replace('0x', '')), 'hex');
    const scriptHash = utils.ripemd160(script);
    const NFTDeposit = Tx.deposit(
      123, // depositId
      nftAddr,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NFT_COLOR_BASE,
    );
    const leapDeposit = Tx.deposit(
      1230, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0,
    );
    const state = {
      unspent: {
        [new Outpoint(NFTDeposit.hash(), 3).hex()]: NFTDeposit.outputs[0].toJSON(),
        [new Outpoint(leapDeposit.hash(), 0).hex()]: leapDeposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const receiver = Buffer.from(
      '9999999999999999999999999999999999999999',
      'hex'
    );
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(NFTDeposit.hash(), 3),
          script,
        }),
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 0),
        }),
      ],
      [
        new Output(nftAddr, `0x${receiver.toString('hex')}`, NFT_COLOR_BASE),
      ]
    );

    const tokenId = '0000000000000000000000005555555555555555555555555555555555555555';
    const msgData = '0xd01a81e1000000000000000000000000' + // function called
      `${receiver.toString('hex') + tokenId}`;

    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);

    let err;

    condition.outputs.push(new Output(4000000, `0x${scriptHash.toString('hex')}`, 0));
    await expectToThrow(async () => await checkSpendCond(state, condition, bridgeState));
    condition.outputs.pop();

    // remove LEAP input for gas
    condition.inputs.pop();
    await expectToThrow(async () => await checkSpendCond(state, condition, bridgeState));
  });

  test('Spending Condition: NFT no input for gas', async () => {
    const nftAddr = erc721Tokens[0];
    const script = Buffer.from(NFTCondition.replace('1111111111111111111111111111111111111111', nftAddr.replace('0x', '')), 'hex');
    const scriptHash = utils.ripemd160(script);
    const NFTDeposit = Tx.deposit(
      123, // depositId
      nftAddr,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NFT_COLOR_BASE,
    );
    const leapDeposit = Tx.deposit(
      1230, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      1,
    );
    const state = {
      unspent: {
        [new Outpoint(NFTDeposit.hash(), 3).hex()]: NFTDeposit.outputs[0].toJSON(),
        [new Outpoint(leapDeposit.hash(), 0).hex()]: leapDeposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const receiver = Buffer.from(
      '9999999999999999999999999999999999999999',
      'hex'
    );
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(NFTDeposit.hash(), 3),
          script,
        }),
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 0),
        }),
      ],
      [
        new Output(nftAddr, `0x${receiver.toString('hex')}`, NFT_COLOR_BASE),
      ]
    );

    const tokenId = '0000000000000000000000005555555555555555555555555555555555555555';
    const msgData = '0xd01a81e1000000000000000000000000' + // function called
      `${receiver.toString('hex') + tokenId}`;

    condition.inputs[0].setMsgData(msgData);

    await expectToThrow(async () => await checkSpendCond(state, condition, bridgeState));
  });

  test('Spending Condition: Breeding/NST', async () => {
    const nstAddr = erc1948Tokens[0];
    const tokenId = '0x0000000000000000000000005555555555555555555555555555555555555555';
    const tokenData = '0x00000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00005';
    const script = Buffer.from(NSTCondition.replace('1111111111111111111111111111111111111111', nstAddr.replace('0x', '')), 'hex');
    const scriptHash = utils.ripemd160(script);

    const deposit = Tx.deposit(
      123, // depositId
      tokenId,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NST_COLOR_BASE,
      '0x0000000000000000000000005555555555555555555555555555555555554444' // tokenData
    );
    // to pay for gas
    const leapDeposit = Tx.deposit(
      1230, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0,
    );

    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
        [new Outpoint(leapDeposit.hash(), 3).hex()]: leapDeposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const receiver = Buffer.from(
      '9999999999999999999999999999999999999999',
      'hex'
    );
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(deposit.hash(), 0),
          script,
        }),
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 3),
        }),
      ],
      [
        new Output(tokenId, `0x${scriptHash.toString('hex')}`, NST_COLOR_BASE, tokenData),
      ]
    );

    const msgData = '0xd3b7576c' + // function called
      `${tokenId.replace('0x', '') + tokenData.replace('0x', '')}`;
 
    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);
  });
});
