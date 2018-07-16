const Trie = require('merkle-patricia-tree');
const VM = require('ethereumjs-vm');
const { Tx, Type, Input, Outpoint, Output } = require('parsec-lib');

module.exports = async (state, tx, { db }) => {
  if (tx.type === Type.COMP_REQ) {
    const code =
      '6080604052348015600f57600080fd5b5060008081548092919060010191905055507f3443590b7333fb7cfd5e65585c8a4c4100c345929865db522919623bf37e58086000546040518082815260200191505060405180910390a10000a165627a7a7230582071206ed7d8676484d16815a72900312a93bfa89fd68bd2e28ec0544d385ea9b60029';
    const stateTrie = new Trie(db);
    const vm = new VM({ state: stateTrie });
    const [fOutput] = tx.outputs;

    const comp = new Promise((resolve, reject) => {
      vm.runCode(
        {
          code: Buffer.from(code, 'hex'),
          data: Buffer.from('', 'hex'),
          account: fOutput.address,
          gasLimit: Buffer.from('ffffff', 'hex'),
          address: tx.inputs[1].signer,
        },
        (err, res) => {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        }
      );
    });
    const result = await comp;
    const storageRoot = result.runState.contract.stateRoot;
    return Tx.compResponse(
      [new Input(new Outpoint(tx.hash(), 0))],
      [
        new Output({
          storageRoot: `0x${storageRoot.toString('hex')}`,
          address: fOutput.address,
          color: fOutput.color,
          value: state.balances[fOutput.color][fOutput.address] + fOutput.value,
        }),
      ]
    );
  }

  throw new Error('Only computation request allowed');
};
