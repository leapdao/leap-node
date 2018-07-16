const { Tx, Input, Outpoint, Output } = require('parsec-lib');
const { promisify } = require('util');

const checkCompResp = require('./checkCompResp');
const runComputation = require('../../computation/runComputation');
const Db = require('../../api/db');
const rimraf = promisify(require('rimraf'));

const CONTRACT_ADDR_1 = '0x258daf43d711831b8fd59137f42030784293e9e6';
const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

const { prepareForCompRequest } = require('./checkCompReq.test');

describe('checkCompResp', () => {
  let db;
  test('valid tx', async () => {
    const { state: initialState, tx: deploymentTx } = prepareForCompRequest();

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

    delete initialState.unspent[compOutpoint.hex()];
    delete initialState.unspent[spentOutpoint.hex()];
    const state = {
      balances: {
        0: {
          [CONTRACT_ADDR_1]: 100,
          [ADDR_1]: 400,
        },
      },
      unspent: Object.assign(initialState.unspent, {
        [new Outpoint(compReq.hash(), 0)]: compOutput.toJSON(),
        [new Outpoint(compReq.hash(), 1)]: changeOutput.toJSON(),
      }),
      storageRoots: initialState.storageRoots,
    };

    db = Db('./testDb');
    const compResp = await runComputation(state, compReq, {
      db: db.source,
    });
    checkCompResp(state, compResp);
  });

  afterEach(async () => {
    if (db) {
      db.source.close();
      await rimraf('./testDb');
    }
  });
});
