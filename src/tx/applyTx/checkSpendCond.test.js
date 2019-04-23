const { Tx, Input, Outpoint, Output } = require('leap-core');
const utils = require('ethereumjs-util');
const checkSpendCond = require('./checkSpendCond');

const erc20Tokens = [
  '0x0000000000000000000000000000000000000000',
  '0x1111111111111111111111111111111111111111',
];
const tokens = {};
erc20Tokens.forEach((addr, i) => {
  tokens[i] = addr;
});

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

describe('checkSpendCond', () => {
  test('valid tx', async () => {
    // a depsoit to the above script tas been done
    const scriptHash = utils.ripemd160(conditionScript);
    const deposit = Tx.deposit(
      123,
      5000000000,
      `0x${scriptHash.toString('hex')}`,
      1
    );

    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const receiver = Buffer.from(
      '2222222222222222222222222222222222222222',
      'hex'
    );
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(deposit.hash(), 0),
          script: conditionScript,
        }),
      ],
      [
        new Output(1992076700, `0x${receiver.toString('hex')}`, 1),
        new Output(2999993600, `0x${scriptHash.toString('hex')}`, 1),
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

    const bridgeState = {
      tokens: {
        erc20: erc20Tokens,
        erc721: [],
      },
      minGasPrices: [100],
    };

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
});
