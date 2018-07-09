const { Tx, Input, Outpoint, Output } = require('parsec-lib');

const checkCompReq = require('./checkCompReq');

const CONTRACT_ADDR_1 = '0x258daf43d711831b8fd59137f42030784293e9e6';
const CONTRACT_ADDR_2 = '0x238daf43d711831b8fd59137f42030784293e9e6';
const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';

describe('checkCompReq', () => {
  const prepareForCompRequest = () => {
    // const state = getInitialState();
    // applyTx(state, deposit, defaultDepositMock);

    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const fakeDeploy = Tx.transfer(
      [new Input(outpoint)],
      [
        new Output({
          value: 0,
          address: CONTRACT_ADDR_1,
          color: 0,
          storageRoot: PRIV_1,
        }),
        new Output(500, ADDR_1, 0),
      ]
    ).signAll(PRIV_1);
    const state = {
      unspent: {
        [new Outpoint(
          fakeDeploy.hash(),
          0
        ).hex()]: fakeDeploy.outputs[0].toJSON(),
        [new Outpoint(
          fakeDeploy.hash(),
          1
        ).hex()]: fakeDeploy.outputs[1].toJSON(),
      },
      storageRoots: {
        [CONTRACT_ADDR_1]: PRIV_1,
      },
    };

    return { state, tx: fakeDeploy };
  };

  test('successful computation request tx', () => {
    const { state, tx: deploymentTx } = prepareForCompRequest();

    const compOutpoint = new Outpoint(deploymentTx.hash(), 0);
    const spentOutpoint = new Outpoint(deploymentTx.hash(), 1);
    const compOutput = new Output({
      value: 100,
      color: 0,
      address: CONTRACT_ADDR_1,
      gasPrice: 0,
      msgData: '0x1234',
    });
    const changeOutput = new Output(400, ADDR_1, 0);
    const compReq = Tx.compRequest(
      [new Input(compOutpoint), new Input(spentOutpoint)],
      [compOutput, changeOutput]
    );
    checkCompReq(state, compReq);
  });

  test('computation request tx with wrong contract address', () => {
    const { state, tx: deploymentTx } = prepareForCompRequest();

    const compOutpoint = new Outpoint(deploymentTx.hash(), 0);
    const spentOutpoint = new Outpoint(deploymentTx.hash(), 1);
    const compOutput = new Output({
      value: 100,
      color: 0,
      address: CONTRACT_ADDR_2,
      gasPrice: 0,
      msgData: '0x1234',
    });
    const changeOutput = new Output(400, ADDR_1, 0);
    const compReq = Tx.compRequest(
      [new Input(compOutpoint), new Input(spentOutpoint)],
      [compOutput, changeOutput]
    );
    expect(() => {
      checkCompReq(state, compReq);
    }).toThrow('Input and output contract address mismatch');
  });

  test('computation request tx with non-computation input', () => {
    const { state, tx: deploymentTx } = prepareForCompRequest();

    const compOutpoint = new Outpoint(deploymentTx.hash(), 0);
    const spentOutpoint = new Outpoint(deploymentTx.hash(), 1);
    const compOutput = new Output({
      value: 100,
      color: 0,
      address: CONTRACT_ADDR_2,
      gasPrice: 0,
      msgData: '0x1234',
    });
    const changeOutput = new Output(400, ADDR_1, 0);
    const compReq = Tx.compRequest(
      [new Input(spentOutpoint), new Input(compOutpoint)],
      [compOutput, changeOutput]
    );
    expect(() => {
      checkCompReq(state, compReq);
    }).toThrow(
      'Unknown input. It should be deployment or computation response output'
    );
  });
});
