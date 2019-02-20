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

const exitHandlerContract = {
  methods: {
    erc20TokenCount: () => ({
      call: async () => erc20Tokens.length,
    }),
    nftTokenCount: () => ({
      call: async () => 0,
    }),
    tokens: i => ({
      call: async () => {
        return { addr: tokens[i] };
      },
    }),
  },
};

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
//     IERC20(tokenAddr).transfer(_receiver, _amount);
//   }
// }
const conditionScript = Buffer.from(
  '608060405234801561001057600080fd5b506004361061002e5760e060020a6000350463052853a98114610033575b600080fd5b610074600480360360a081101561004957600080fd5b5080359060208101359060ff60408201351690600160a060020a036060820135169060800135610076565b005b6040805160008082526020808301808552606060020a6001606060020a03193082021604905260ff87168385015260608301899052608083018890529251909260019260a080820193601f1981019281900390910190855afa1580156100e0573d6000803e3d6000fd5b5050604051601f190151915050600160a060020a0381167382e8c6cf42c8d1ff9594b17a3f50e94a12cc860f1461011657600080fd5b6040805160e060020a63a9059cbb028152600160a060020a03851660048201526024810184905290517311111111111111111111111111111111111111119163a9059cbb9160448083019260209291908290030181600087803b15801561017c57600080fd5b505af1158015610190573d6000803e3d6000fd5b505050506040513d60208110156101a657600080fd5b505050505050505056fea165627a7a72305820e1757fb3e7c575e92504f39a72d553b59b50c18933257a8a85e558b61ddd25620029',
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
          gasPrice: 100,
          script: conditionScript,
        }),
      ],
      [
        new Output(1993551400, `0x${receiver.toString('hex')}`, 1),
        new Output(3000000000, `0x${scriptHash.toString('hex')}`, 1),
      ]
    );

    const sig = condition.getConditionSig(PRIV);

    // msgData that satisfies the spending condition
    const vBuf = utils.setLengthLeft(utils.toBuffer(sig.v), 32);
    const amountBuf = utils.setLengthLeft(utils.toBuffer(1993551400), 32);
    const msgData =
      '0x052853a9' + // function called
      `${sig.r.toString('hex')}${sig.s.toString('hex')}${vBuf.toString(
        'hex'
      )}` + // signature
      `000000000000000000000000${receiver.toString('hex')}${amountBuf.toString(
        'hex'
      )}`; // outputs
    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, {
      exitHandlerContract,
      tokens: { erc20: [], erc721: [] },
    });
  });
});
