const { Tx, Input, Outpoint, Output } = require('leap-core');
const utils = require('ethereumjs-util');
const checkSpendCond = require('./checkSpendCond');
const {
  NFT_COLOR_BASE,
  NST_COLOR_BASE,
} = require('../../api/methods/constants');
const checkSpendingCondition = require('./../../api/methods/checkSpendingCondition');

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

const NFTCondition =
  '6080604052348015600f57600080fd5b5060043610602b5760e060020a6000350463d01a81e181146030575b600080fd5b605960048036036040811015604457600080fd5b50600160a060020a038135169060200135605b565b005b6040805160e060020a6323b872dd028152306004820152600160a060020a03841660248201526044810183905290517311111111111111111111111111111111111111119182916323b872dd9160648082019260009290919082900301818387803b15801560c857600080fd5b505af115801560db573d6000803e3d6000fd5b5050505050505056fea165627a7a723058206e658cc8b44fd3d32eef8c4222a0f8773e93bc6efa0fb08e4db77979dacc9e790029';

const NSTCondition =
  '6080604052348015600f57600080fd5b5060043610602b5760e060020a6000350463d3b7576c81146030575b600080fd5b605060048036036040811015604457600080fd5b50803590602001356052565b005b6040805160e060020a63a983d43f0281526004810184905260248101839052905173111111111111111111111111111111111111111191829163a983d43f9160448082019260009290919082900301818387803b15801560b157600080fd5b505af115801560c4573d6000803e3d6000fd5b5050505050505056fea165627a7a723058209d7c918824f80651fee7b4f8b99ed305e72e70fad4ff09430ebab4adf0eed3d40029';

const MultiCondition =
  '608060405234801561001057600080fd5b506004361061002e5760e060020a60003504635bac6c1e8114610033575b600080fd5b6100656004803603606081101561004957600080fd5b5080359060208101359060400135600160a060020a0316610067565b005b6040805160e060020a63a983d43f0281526004810185905260248101849052905173333333333333333333333333333333333333333391829163a983d43f9160448082019260009290919082900301818387803b1580156100c757600080fd5b505af11580156100db573d6000803e3d6000fd5b50506040805160e060020a6323b872dd028152306004820152600160a060020a038616602482015260448101889052905173555555555555555555555555555555555555555593508392506323b872dd9160648082019260009290919082900301818387803b15801561014d57600080fd5b505af1158015610161573d6000803e3d6000fd5b50506040805160e060020a6370a082310281523060048201529051731111111111111111111111111111111111111111935083925063a9059cbb91879184916370a08231916024808301926020929190829003018186803b1580156101c557600080fd5b505afa1580156101d9573d6000803e3d6000fd5b505050506040513d60208110156101ef57600080fd5b50516040805160e060020a63ffffffff8616028152600160a060020a03909316600484015260248301919091525160448083019260209291908290030181600087803b15801561023e57600080fd5b505af1158015610252573d6000803e3d6000fd5b505050506040513d602081101561026857600080fd5b50506040805160e060020a6370a08231028152306004820152905173222222222222222222222222222222222222222291829163a9059cbb91889184916370a08231916024808301926020929190829003018186803b1580156102ca57600080fd5b505afa1580156102de573d6000803e3d6000fd5b505050506040513d60208110156102f457600080fd5b50516040805160e060020a63ffffffff8616028152600160a060020a03909316600484015260248301919091525160448083019260209291908290030181600087803b15801561034357600080fd5b505af1158015610357573d6000803e3d6000fd5b505050506040513d602081101561036d57600080fd5b50505050505050505056fea165627a7a723058207e221fd58b2d5943b615bc77011474e47caa90f6b686409991d704d015ebec9c0029';

const MultiConditionAllowance =
  '608060405234801561001057600080fd5b506004361061002e5760e060020a60003504635bac6c1e8114610033575b600080fd5b6100656004803603606081101561004957600080fd5b5080359060208101359060400135600160a060020a0316610067565b005b6040805160e060020a6323b872dd028152600160a060020a03831660048201523060248201526044810185905290517355555555555555555555555555555555555555559182916323b872dd9160648082019260009290919082900301818387803b1580156100d557600080fd5b505af11580156100e9573d6000803e3d6000fd5b50506040805160e160020a636eb1769f028152600160a060020a03861660048201523060248201529051731111111111111111111111111111111111111111935060009250839163dd62ed3e916044808301926020929190829003018186803b15801561015557600080fd5b505afa158015610169573d6000803e3d6000fd5b505050506040513d602081101561017f57600080fd5b50516040805160e060020a6323b872dd028152600160a060020a038781166004830152306024830152604482018490529151929350908416916323b872dd916064808201926020929091908290030181600087803b1580156101e057600080fd5b505af11580156101f4573d6000803e3d6000fd5b505050506040513d602081101561020a57600080fd5b50506040805160e160020a636eb1769f028152600160a060020a0386166004820152306024820152905173222222222222222222222222222222222222222291829163dd62ed3e91604480820192602092909190829003018186803b15801561027257600080fd5b505afa158015610286573d6000803e3d6000fd5b505050506040513d602081101561029c57600080fd5b50516040805160e060020a6323b872dd028152600160a060020a038881166004830152306024830152604482018490529151929450908316916323b872dd916064808201926020929091908290030181600087803b1580156102fd57600080fd5b505af1158015610311573d6000803e3d6000fd5b505050506040513d602081101561032757600080fd5b50505050505050505056fea165627a7a723058206b2d9289ffe41ef706d920793144e5ddec39d3c8d74ef8bd4bf51ea02837a3fb0029';

const BreedingCondition =
  '6080604052348015600f57600080fd5b5060043610602b5760e060020a6000350463451da9f981146030575b600080fd5b605f60048036036060811015604457600080fd5b50803590600160a060020a0360208201351690604001356061565b005b6040805160e060020a63451da9f902815260048101859052600160a060020a038416602482015260448101839052905173333333333333333333333333333333333333333391829163451da9f99160648082019260009290919082900301818387803b15801560cf57600080fd5b505af115801560e2573d6000803e3d6000fd5b505050505050505056fea165627a7a7230582022038a27f6c269784e06d5e8dd55f5d146448b90cc1c08599f7160b1bc79c7390029';

const GameCondition =
  '608060405234801561001057600080fd5b506004361061002e5760e060020a6000350463ab66bead8114610033575b600080fd5b6100656004803603608081101561004957600080fd5b508035906020810135906040810135906060013560ff16610067565b005b60006100758583868661054c565b905060606100a27f2345222222222222222222222222222222222222222222222222222222222222610612565b905060606100af87610612565b905060006100bd8383610677565b90506100c9838361074e565b151561011a576040805160e560020a62461bcd0281526020600482015260156024820152605860020a74706c617965722068616e6473206e6f742073616d6502604482015290519081900360640190fd5b6040805160e060020a6370a0823102815230600482015290517312341111111111111111111111111111111111119160009183916370a08231916024808301926020929190829003018186803b15801561017357600080fd5b505afa158015610187573d6000803e3d6000fd5b505050506040513d602081101561019d57600080fd5b50516040805160e060020a6323b872dd028152600160a060020a0389811660048301523060248301526005840460448301529151929350908416916323b872dd916064808201926020929091908290030181600087803b15801561020057600080fd5b505af1158015610214573d6000803e3d6000fd5b505050506040513d602081101561022a57600080fd5b50506040805160e060020a6370a082310281523060048201529051600160a060020a038416916370a08231916024808301926020929190829003018186803b15801561027557600080fd5b505afa158015610289573d6000803e3d6000fd5b505050506040513d602081101561029f57600080fd5b50519050821515610441576040805160e060020a63a9059cbb02815273345633333333333333333333333333333333333360048201526005600684040260248201529051600160a060020a0384169163a9059cbb9160448083019260209291908290030181600087803b15801561031557600080fd5b505af1158015610329573d6000803e3d6000fd5b505050506040513d602081101561033f57600080fd5b50506040805160e060020a6370a082310281523060048201529051600160a060020a038416916370a08231916024808301926020929190829003018186803b15801561038a57600080fd5b505afa15801561039e573d6000803e3d6000fd5b505050506040513d60208110156103b457600080fd5b50516040805160e060020a63a9059cbb028152600160a060020a0389811660048301526024820184905291519293509084169163a9059cbb916044808201926020929091908290030181600087803b15801561040f57600080fd5b505af1158015610423573d6000803e3d6000fd5b505050506040513d602081101561043957600080fd5b506105409050565b82600214156104ad5781600160a060020a031663a9059cbb87836040518363ffffffff1660e060020a0281526004018083600160a060020a0316600160a060020a0316815260200182815260200192505050602060405180830381600087803b15801561040f57600080fd5b6040805160e060020a63a9059cbb0281527334563333333333333333333333333333333333336004820152602481018390529051600160a060020a0384169163a9059cbb9160448083019260209291908290030181600087803b15801561051357600080fd5b505af1158015610527573d6000803e3d6000fd5b505050506040513d602081101561053d57600080fd5b50505b50505050505050505050565b6000808560405160200180807f19457468657265756d205369676e6564204d6573736167653a0a333200000000815250601c0182815260200191505060405160208183030381529060405280519060200120905060018186868660405160008152602001604052604051808581526020018460ff1660ff1681526020018381526020018281526020019450505050506020604051602081039080840390855afa1580156105fd573d6000803e3d6000fd5b5050604051601f190151979650505050505050565b60408051600a8082526101608201909252606091602082016101408038833901905050905060005b600a81101561067157815161ffff6010830260020a8504169083908390811061065f57fe5b6020908102909101015260010161063a565b50919050565b60008080805b600581101561072157848181518110151561069457fe5b9060200190602002015186600583018151811015156106af57fe5b90602001906020020151116106c55760006106c8565b60015b60ff168301925085600582018151811015156106e057fe5b9060200190602002015185828151811015156106f857fe5b906020019060200201511161070e576000610711565b60015b60ff16919091019060010161067d565b5080821161073f5780821061073757600061073a565b60025b610742565b60015b60ff1695945050505050565b6000606061075b84610803565b9050606061076884610803565b905060005b60058110156107f757818181518110151561078457fe5b90602001906020020151838281518110151561079c57fe5b60209081029091010151146107ef576040805160e560020a62461bcd02815260206004820152600e6024820152609060020a6d68616e6473206e6f742073616d6502604482015290519081900360640190fd5b60010161076d565b50600195945050505050565b60606108128260006004610816565b5090565b81818082141561082757505061094f565b600085600286860305860181518110151561083e57fe5b9060200190602002015190505b818313610925575b80868481518110151561086257fe5b90602001906020020151101561087d57600190920191610853565b858281518110151561088b57fe5b906020019060200201518110156108a8576000199091019061087d565b8183136109205785828151811015156108bd57fe5b9060200190602002015186848151811015156108d557fe5b9060200190602002015187858151811015156108ed57fe5b906020019060200201888581518110151561090457fe5b6020908102909101019190915252600190920191600019909101905b61084b565b8185121561093857610938868684610816565b8383121561094b5761094b868486610816565b5050505b50505056fea165627a7a72305820fff8bc5e39ef79a391122b4afc041e9298095e7f3440832ac3c04f95ce445e6a0029';

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace.replace('0x', ''));
}

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';

/*
pragma solidity ^0.5.2;
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract SpendingCondition {
  address constant tokenAddr = 0x1111111111111111111111111111111111111111;
  function fulfil(
    address _receiver, // output
    uint256 _amount    // output
  ) public {
    // do transfer
    IERC20 token = IERC20(tokenAddr);
    uint256 diff = token.balanceOf(address(this)) - _amount;
    token.transfer(_receiver, _amount);
    if (diff > 0) {
      token.transfer(address(this), diff);
    }
  }
}
*/
const conditionScript = Buffer.from(
  '608060405234801561001057600080fd5b506004361061002e5760e060020a6000350463d01a81e18114610033575b600080fd5b61005f6004803603604081101561004957600080fd5b50600160a060020a038135169060200135610061565b005b6040805160e060020a6370a08231028152306004820152905173111111111111111111111111111111111111111191600091849184916370a0823191602480820192602092909190829003018186803b1580156100bd57600080fd5b505afa1580156100d1573d6000803e3d6000fd5b505050506040513d60208110156100e757600080fd5b50516040805160e060020a63a9059cbb028152600160a060020a03888116600483015260248201889052915193909203935084169163a9059cbb916044808201926020929091908290030181600087803b15801561014457600080fd5b505af1158015610158573d6000803e3d6000fd5b505050506040513d602081101561016e57600080fd5b505060008111156101f8576040805160e060020a63a9059cbb028152306004820152602481018390529051600160a060020a0384169163a9059cbb9160448083019260209291908290030181600087803b1580156101cb57600080fd5b505af11580156101df573d6000803e3d6000fd5b505050506040513d60208110156101f557600080fd5b50505b5050505056fea165627a7a72305820b6375cb3c7f659844afea0adf999ea78d73fd047f5823fbe1447f8051fe0189b0029',
  'hex'
);

// PRIV matches spenderAddr hardcoded in script
// const PRIV =
//  '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';

async function expectToThrow(func, args) {
  let err;

  try {
    await func.apply(args);
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
        new Output(3007923300, `0x${scriptHash.toString('hex')}`, 0),
        new Output(1992076700, `0x${receiver.toString('hex')}`, 0),
        // gas change
        new Output(
          6989874974,
          deposit2.outputs[0].address,
          deposit2.outputs[0].color
        ),
      ]
    );

    // msgData that satisfies the spending condition
    const amountBuf = utils.setLengthLeft(utils.toBuffer(1992076700), 32);
    const msgData =
      '0xd01a81e1' + // function called
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

    // check the checkSpendingCondition API call
    condition.signAll(PRIV_1);
    bridgeState.currentState = state;

    let apiResult = await checkSpendingCondition(bridgeState, condition.hex());
    expect(apiResult.outputs).toEqual(condition.outputs);

    // test the error-case
    const outs = condition.outputs;

    condition.outputs = [];
    condition.signAll(PRIV_1);
    apiResult = await checkSpendingCondition(bridgeState, condition.hex());
    expect(apiResult.outputs).toEqual(outs);
    expect(apiResult.error.startsWith('Error: outputs do not match computation results')).toEqual(true);
  });

  test('Spending Condition: NFT', async () => {
    const nftAddr = erc721Tokens[0];
    const script = Buffer.from(
      NFTCondition.replace(
        '1111111111111111111111111111111111111111',
        nftAddr.replace('0x', '')
      ),
      'hex'
    );
    const scriptHash = utils.ripemd160(script);
    const NFTDeposit = Tx.deposit(
      123, // depositId
      nftAddr,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NFT_COLOR_BASE
    );
    const leapDeposit = Tx.deposit(
      1230, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0
    );
    const state = {
      unspent: {
        [new Outpoint(
          NFTDeposit.hash(),
          3
        ).hex()]: NFTDeposit.outputs[0].toJSON(),
        [new Outpoint(
          leapDeposit.hash(),
          0
        ).hex()]: leapDeposit.outputs[0].toJSON(),
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
          prevout: new Outpoint(leapDeposit.hash(), 0),
          script,
        }),
        new Input({
          prevout: new Outpoint(NFTDeposit.hash(), 3),
        }),
      ],
      [
        new Output(nftAddr, `0x${receiver.toString('hex')}`, NFT_COLOR_BASE),
        // gas change returned
        new Output(
          4993380102,
          leapDeposit.outputs[0].address,
          leapDeposit.outputs[0].color
        ),
      ]
    );

    const tokenId =
      '0000000000000000000000005555555555555555555555555555555555555555';
    const msgData =
      '0xd01a81e1000000000000000000000000' + // function called
      `${receiver.toString('hex') + tokenId}`;

    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);

    condition.outputs.push(
      new Output(4000000, `0x${scriptHash.toString('hex')}`, 0)
    );
    await expectToThrow(checkSpendCond, [state, condition, bridgeState]);
    condition.outputs.pop();

    // remove LEAP input for gas
    condition.inputs.pop();
    await expectToThrow(checkSpendCond, [state, condition, bridgeState]);
  });

  test('Spending Condition: NFT no input for gas', async () => {
    const nftAddr = erc721Tokens[0];
    const script = Buffer.from(
      NFTCondition.replace(
        '1111111111111111111111111111111111111111',
        nftAddr.replace('0x', '')
      ),
      'hex'
    );
    const scriptHash = utils.ripemd160(script);
    const NFTDeposit = Tx.deposit(
      123, // depositId
      nftAddr,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NFT_COLOR_BASE
    );
    const leapDeposit = Tx.deposit(
      1230, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      1
    );
    const state = {
      unspent: {
        [new Outpoint(
          NFTDeposit.hash(),
          3
        ).hex()]: NFTDeposit.outputs[0].toJSON(),
        [new Outpoint(
          leapDeposit.hash(),
          0
        ).hex()]: leapDeposit.outputs[0].toJSON(),
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
        new Output(
          4995187904,
          leapDeposit.outputs[0].address,
          leapDeposit.outputs[0].color
        ),
      ]
    );

    const tokenId =
      '0000000000000000000000005555555555555555555555555555555555555555';
    const msgData =
      '0xd01a81e1000000000000000000000000' + // function called
      `${receiver.toString('hex') + tokenId}`;

    condition.inputs[0].setMsgData(msgData);

    await expectToThrow(checkSpendCond, [state, condition, bridgeState]);
  });

  test('Spending Condition: NST', async () => {
    const nstAddr = erc1948Tokens[0];
    const tokenId =
      '0x0000000000000000000000005555555555555555555555555555555555555555';
    const tokenData =
      '0x00000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00005';
    const script = Buffer.from(
      NSTCondition.replace(
        '1111111111111111111111111111111111111111',
        nstAddr.replace('0x', '')
      ),
      'hex'
    );
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
      0
    );

    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
        [new Outpoint(
          leapDeposit.hash(),
          3
        ).hex()]: leapDeposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 3),
          script,
        }),
        new Input({
          prevout: new Outpoint(deposit.hash(), 0),
        }),
      ],
      [
        new Output(
          tokenId,
          `0x${scriptHash.toString('hex')}`,
          NST_COLOR_BASE,
          tokenData
        ),
        // gas change returned
        new Output(
          4995187904,
          leapDeposit.outputs[0].address,
          leapDeposit.outputs[0].color
        ),
      ]
    );

    const msgData =
      '0xd3b7576c' + // function called
      `${tokenId.replace('0x', '') + tokenData.replace('0x', '')}`;

    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);
  });

  test('Spending Condition: MultiCondition', async () => {
    const tokenId =
      '0x0000000000000000000000005555555555555555555555555555555555555555';
    const tokenData =
      '0x00000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00005';
    const receiver = '0x82e8C6Cf42C8D1fF9594b17A3F50e94a12cC860f'.toLowerCase();
    const script = Buffer.from(MultiCondition, 'hex');
    const scriptHash = utils.ripemd160(script);

    // to pay for gas
    const leapDeposit = Tx.deposit(
      1, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0
    );
    // to transfer token1
    const token1Deposit = Tx.deposit(
      2, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0
    );
    // to transfer token2
    const token2Deposit = Tx.deposit(
      3, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      1
    );
    const nftDeposit = Tx.deposit(
      4, // depositId
      tokenId,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NFT_COLOR_BASE
    );
    const nstDeposit = Tx.deposit(
      5, // depositId
      tokenId,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NST_COLOR_BASE,
      '0x0000000000000000000000005555555555555555555555555555555555554444' // tokenData
    );

    const state = {
      unspent: {
        [new Outpoint(
          leapDeposit.hash(),
          0
        ).hex()]: leapDeposit.outputs[0].toJSON(),
        [new Outpoint(
          token1Deposit.hash(),
          0
        ).hex()]: token1Deposit.outputs[0].toJSON(),
        [new Outpoint(
          token2Deposit.hash(),
          0
        ).hex()]: token2Deposit.outputs[0].toJSON(),
        [new Outpoint(
          nftDeposit.hash(),
          0
        ).hex()]: nftDeposit.outputs[0].toJSON(),
        [new Outpoint(
          nstDeposit.hash(),
          0
        ).hex()]: nstDeposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 0),
          script,
        }),
        new Input({
          prevout: new Outpoint(token1Deposit.hash(), 0),
        }),
        new Input({
          prevout: new Outpoint(token2Deposit.hash(), 0),
        }),
        new Input({
          prevout: new Outpoint(nftDeposit.hash(), 0),
        }),
        new Input({
          prevout: new Outpoint(nstDeposit.hash(), 0),
        }),
      ],
      [
        new Output(
          tokenId,
          `0x${scriptHash.toString('hex')}`,
          NST_COLOR_BASE,
          tokenData
        ),
        new Output(tokenId, `0x${receiver.replace('0x', '')}`, NFT_COLOR_BASE),
        new Output(5000000000, `0x${receiver.replace('0x', '')}`, 0),
        new Output(5000000000, `0x${receiver.replace('0x', '')}`, 1),
        new Output(4986820980, `0x${scriptHash.toString('hex')}`, 0),
      ]
    );
    condition.signAll(PRIV_1);
    const msgData =
      '0x5bac6c1e' + // function called
      `${tokenId.replace('0x', '') +
        tokenData.replace('0x', '')}000000000000000000000000${receiver.replace(
        '0x',
        ''
      )}`;

    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);
    await checkSpendCond(state, Tx.fromRaw(condition.toRaw()), bridgeState);
  });

  test('Spending Condition: MultiCondition with approval', async () => {
    const tokenId =
      '0x0000000000000000000000005555555555555555555555555555555555555555';
    const tokenData =
      '0x00000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00005';
    const receiver = ADDR_1.toLowerCase();
    const script = Buffer.from(MultiConditionAllowance, 'hex');
    const scriptHash = utils.ripemd160(script);
    const owner = receiver;

    // to pay for gas
    const leapDeposit = Tx.deposit(
      1, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0
    );
    // to transfer token1
    const token1Deposit = Tx.deposit(
      2, // depositId
      5000000000,
      owner,
      0
    );
    // to transfer token2
    const token2Deposit = Tx.deposit(
      3, // depositId
      5000000000,
      owner,
      1
    );
    const nftDeposit = Tx.deposit(
      4, // depositId
      tokenId,
      owner,
      NFT_COLOR_BASE
    );
    const nstDeposit = Tx.deposit(
      5, // depositId
      tokenId,
      owner,
      NST_COLOR_BASE,
      '0x0000000000000000000000005555555555555555555555555555555555554444' // tokenData
    );

    const state = {
      unspent: {
        [new Outpoint(
          leapDeposit.hash(),
          0
        ).hex()]: leapDeposit.outputs[0].toJSON(),
        [new Outpoint(
          token1Deposit.hash(),
          0
        ).hex()]: token1Deposit.outputs[0].toJSON(),
        [new Outpoint(
          token2Deposit.hash(),
          0
        ).hex()]: token2Deposit.outputs[0].toJSON(),
        [new Outpoint(
          nftDeposit.hash(),
          0
        ).hex()]: nftDeposit.outputs[0].toJSON(),
        [new Outpoint(
          nstDeposit.hash(),
          0
        ).hex()]: nstDeposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // a spending condition transaction that spends the deposit is created
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 0),
          script,
        }),
        new Input({
          prevout: new Outpoint(token1Deposit.hash(), 0),
        }),
        new Input({
          prevout: new Outpoint(token2Deposit.hash(), 0),
        }),
        new Input({
          prevout: new Outpoint(nftDeposit.hash(), 0),
        }),
        // new Input({
        //  prevout: new Outpoint(nstDeposit.hash(), 0),
        // }),
      ],
      [
        /*
         new Output(
          tokenId,
          `0x${scriptHash.toString('hex')}`,
          NST_COLOR_BASE,
          tokenData
        ),
        */
        new Output(tokenId, `0x${scriptHash.toString('hex')}`, NFT_COLOR_BASE),
        new Output(5000000000, `0x${scriptHash.toString('hex')}`, 0),
        new Output(5000000000, `0x${scriptHash.toString('hex')}`, 1),
        new Output(4989275592, `0x${scriptHash.toString('hex')}`, 0),
      ]
    );
    condition.signAll(PRIV_1);
    const msgData =
      '0x5bac6c1e' + // function called
      `${tokenId.replace('0x', '') +
        tokenData.replace('0x', '')}000000000000000000000000${receiver.replace(
        '0x',
        ''
      )}`;

    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);
    await checkSpendCond(state, Tx.fromRaw(condition.toRaw()), bridgeState);
  });

  test('Breeding Condition', async () => {
    const queenId =
      '0x0000000000000000000000005555555555555555555555555555555555555555';
    const receiver = ADDR_1.toLowerCase();
    const script = Buffer.from(BreedingCondition, 'hex');
    const scriptHash = utils.ripemd160(script);

    // to pay for gas
    const leapDeposit = Tx.deposit(
      1, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0
    );
    const queenDeposit = Tx.deposit(
      5, // depositId
      queenId,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      NST_COLOR_BASE,
      '0x0000000000000000000000000000000000000000000000000000000000000001' // queen counter
    );

    const state = {
      unspent: {
        [new Outpoint(
          leapDeposit.hash(),
          0
        ).hex()]: leapDeposit.outputs[0].toJSON(),
        [new Outpoint(
          queenDeposit.hash(),
          0
        ).hex()]: queenDeposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // predict worker id
    const buffer = Buffer.alloc(64, 0);
    buffer.write(queenId.replace('0x', ''), 0, 'hex');
    buffer.writeUInt32BE(1, 60);
    const predictedId = utils.keccak256(buffer).toString('hex');

    // a spending condition transaction that spends the deposit is created
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 0),
          script,
        }),
        new Input({
          prevout: new Outpoint(queenDeposit.hash(), 0),
        }),
      ],
      [
        new Output(
          queenId,
          `0x${scriptHash.toString('hex')}`,
          NST_COLOR_BASE,
          '0x0000000000000000000000000000000000000000000000000000000000000002'
        ),
        new Output(
          `0x${predictedId}`,
          receiver,
          NST_COLOR_BASE,
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        ),
        new Output(4987781468, `0x${scriptHash.toString('hex')}`, 0),
      ]
    );
    const msgData =
      '0x451da9f9' + // function called
      `${queenId.replace('0x', '')}000000000000000000000000${receiver.replace(
        '0x',
        ''
      )}0000000000000000000000000000000000000000000000000000000000000000`;

    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);
  });

  test('Game Condition', async () => {
    const cards =
      '0x0000000000000000000000000105040603070208010901050206030704080409';
    const player = ADDR_1.toLowerCase();

    let tmp = GameCondition;

    tmp = replaceAll(
      tmp,
      '1234111111111111111111111111111111111111',
      '1111111111111111111111111111111111111111'
    );
    // cards
    tmp = replaceAll(
      tmp,
      '2345222222222222222222222222222222222222222222222222222222222222',
      cards
    );

    const script = Buffer.from(tmp, 'hex');
    const scriptHash = utils.ripemd160(script);

    // to pay for gas
    const leapDeposit = Tx.deposit(
      1, // depositId
      100000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0
    );
    const leap1Deposit = Tx.deposit(
      2, // depositId
      5000000000,
      `0x${scriptHash.toString('hex')}`, // owner (spending condition)
      0
    );
    const leap2Deposit = Tx.deposit(
      3, // depositId
      1000000000,
      player,
      0
    );

    const state = {
      unspent: {
        [new Outpoint(
          leapDeposit.hash(),
          0
        ).hex()]: leapDeposit.outputs[0].toJSON(),
        [new Outpoint(
          leap1Deposit.hash(),
          0
        ).hex()]: leap1Deposit.outputs[0].toJSON(),
        [new Outpoint(
          leap2Deposit.hash(),
          0
        ).hex()]: leap2Deposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    // sign cards
    const permutation =
      '0x0000000000000000000000000000000000000000000002060307040801050409';
    const hash = utils.hashPersonalMessage(
      Buffer.from(permutation.replace('0x', ''), 'hex')
    );
    const sig = utils.ecsign(
      hash,
      Buffer.from(PRIV_1.replace('0x', ''), 'hex')
    );

    // predict winner

    // a spending condition transaction that spends the deposit is created
    const condition = Tx.spendCond(
      [
        new Input({
          prevout: new Outpoint(leapDeposit.hash(), 0),
          script,
        }),
        new Input({
          prevout: new Outpoint(leap1Deposit.hash(), 0),
        }),
        new Input({
          prevout: new Outpoint(leap2Deposit.hash(), 0),
        }),
      ],
      [
        new Output(6000000000, player, 0),
        new Output(91487526, `0x${scriptHash.toString('hex')}`, 0),
      ]
    );
    condition.signAll(PRIV_1);
    const msgData =
      '0xab66bead' + // function called
      `${permutation.replace('0x', '')}${sig.r.toString('hex')}${sig.s.toString(
        'hex'
      )}00000000000000000000000000000000000000000000000000000000000000${sig.v.toString(
        16
      )}`;
    condition.inputs[0].setMsgData(msgData);

    await checkSpendCond(state, condition, bridgeState);
  });
});
