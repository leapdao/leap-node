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
//   address constant spenderAddr = 0x82e8C6Cf42C8D1fF9594b17A3F50e94a12cC860f;

//   function fulfil(bytes32 _r, bytes32 _s, uint8 _v,      // signature
//     address _tokenAddr,                               // inputs
//     address _receiver, uint256 _amount) public {  // outputs
//     // check signature
//     address contractAddr = address(this);
//     address signer = ecrecover(bytes32(bytes20(contractAddr)), _v, _r, _s);
//     require(signer == spenderAddr);
//     // do transfer
//     IERC20 token = IERC20(_tokenAddr);
//     uint256 diff = token.balanceOf(contractAddr) - _amount;
//     token.transfer(_receiver, _amount);
//     if (diff > 0) {
//       token.transfer(contractAddr, diff);
//     }
//   }
// }
const conditionScript = Buffer.from(
  '608060405234801561001057600080fd5b506004361061002e5760e060020a6000350463c84e1a778114610033575b600080fd5b61007e600480360360c081101561004957600080fd5b5080359060208101359060ff60408201351690600160a060020a03606082013581169160808101359091169060a00135610080565b005b6040805160008082526020808301808552606060020a308082026001606060020a0319169190910490915260ff891684860152606084018b9052608084018a90529351919260019260a08083019392601f198301929081900390910190855afa1580156100f1573d6000803e3d6000fd5b5050604051601f190151915050600160a060020a0381167382e8c6cf42c8d1ff9594b17a3f50e94a12cc860f1461012757600080fd5b600085905060008482600160a060020a03166370a08231866040518263ffffffff1660e060020a0281526004018082600160a060020a0316600160a060020a0316815260200191505060206040518083038186803b15801561018857600080fd5b505afa15801561019c573d6000803e3d6000fd5b505050506040513d60208110156101b257600080fd5b50516040805160e060020a63a9059cbb028152600160a060020a038a81166004830152602482018a9052915193909203935084169163a9059cbb916044808201926020929091908290030181600087803b15801561020f57600080fd5b505af1158015610223573d6000803e3d6000fd5b505050506040513d602081101561023957600080fd5b505060008111156102d45781600160a060020a031663a9059cbb85836040518363ffffffff1660e060020a0281526004018083600160a060020a0316600160a060020a0316815260200182815260200192505050602060405180830381600087803b1580156102a757600080fd5b505af11580156102bb573d6000803e3d6000fd5b505050506040513d60208110156102d157600080fd5b50505b5050505050505050505056fea165627a7a723058206a6bdb89a200658901def5b1623c4b3b8f23e08595efdb9c87b65f4b0fa9a3200029',
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
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(deposit.hash(), 0),
          gasPrice: 100,
          script: conditionScript,
        }),
      ],
      [
        new Output(1991834800, `0x${receiver.toString('hex')}`, 1),
        new Output(3000000000, `0x${scriptHash.toString('hex')}`, 1),
      ]
    );

    const sig = condition.getConditionSig(PRIV);

    // msgData that satisfies the spending condition
    const vBuf = utils.setLengthLeft(utils.toBuffer(sig.v), 32);
    const amountBuf = utils.setLengthLeft(utils.toBuffer(1991834800), 32);
    const msgData =
      '0xc84e1a77' + // function called
      `${sig.r.toString('hex')}${sig.s.toString('hex')}${vBuf.toString(
        'hex'
      )}` + // signature
      `000000000000000000000000${tokenAddr.toString('hex')}` + // inputs
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
