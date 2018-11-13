const { Tx, Input, Outpoint, Output } = require('leap-core');
const utils = require('ethereumjs-util');
const checkSpendCond = require('./checkSpendCond');

// a script exists that can only be spent by spenderAddr defined in script
//
// pragma solidity ^0.4.24;
// import "./IERC20.sol";
// contract SpendCondition {
//     address constant spenderAddr = 0x82e8c6cf42c8d1ff9594b17a3f50e94a12cc860f;
//     function fullfil(bytes32 _r, bytes32 _s, uint8 _v,      // signature
//         address _tokenAddr,                               // inputs
//         address _receiver, uint256 _amount) public {  // outputs
//         // check signature
//         address signer = ecrecover(bytes32(address(this)), _v, _r, _s);
//         require(signer == spenderAddr);
//         // do transfer
//         IERC20 token = IERC20(_tokenAddr);
//         token.transfer(_receiver, _amount);
//     }
// }
const conditionScript = Buffer.from(
  '6080604052600436106100405763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166331b3c80e8114610045575b600080fd5b34801561005157600080fd5b5061008860043560243560ff6044351673ffffffffffffffffffffffffffffffffffffffff6064358116906084351660a43561008a565b005b604080516000808252602080830180855230905260ff881683850152606083018a90526080830189905292519092839260019260a08083019392601f19830192908190039091019086865af11580156100e7573d6000803e3d6000fd5b5050604051601f19015192505073ffffffffffffffffffffffffffffffffffffffff82167382e8c6cf42c8d1ff9594b17a3f50e94a12cc860f1461012a57600080fd5b50604080517fa9059cbb00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8581166004830152602482018590529151869283169163a9059cbb9160448083019260209291908290030181600087803b1580156101a457600080fd5b505af11580156101b8573d6000803e3d6000fd5b505050506040513d60208110156101ce57600080fd5b505050505050505050505600a165627a7a72305820ff22a508030475240dd61744c3007ea9eb1ec4305eea6eca7d1ab695ececac8e0029',
  'hex'
);

// PRIV matches spenderAddr hardcoded in script
const PRIV =
  '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';

describe('checkSpendCond', () => {
  test('valid tx', () => {
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
    };

    // a token contract exists at address, it has the color 1
    const tokenAddr = Buffer.from(
      '1111111111111111111111111111111111111111',
      'hex'
    );

    // a spending condition transaction that spends the deposit is created
    const receiver = Buffer.from(
      '2222222222222222222222222222222222222222',
      'hex'
    );
    const amount = 4993673500; // rest is spent on gas
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(deposit.hash(), 0),
          gasPrice: 100,
          script: conditionScript,
        }),
      ],
      [new Output(amount, `0x${receiver.toString('hex')}`, 1)]
    );

    const sig = condition.getConditionSig(PRIV);

    // msgData that satisfies the spending condition
    const vBuf = utils.setLengthLeft(utils.toBuffer(sig.v), 32);
    const amountBuf = utils.setLengthLeft(utils.toBuffer(amount), 32);
    condition.inputs[0].setMsgData(
      '0x31b3c80e' + // function called
      `${sig.r.toString('hex')}${sig.s.toString('hex')}${vBuf.toString(
        'hex'
      )}` + // signature
      `000000000000000000000000${tokenAddr.toString('hex')}` + // inputs
        `000000000000000000000000${receiver.toString(
          'hex'
        )}${amountBuf.toString('hex')}` // outputs
    );

    checkSpendCond(state, condition);
  });
});
