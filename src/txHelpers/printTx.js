const { Type } = require('leap-core');
const { range } = require('../utils');

const printOutput = (output, sign) =>
  `${output.address} (${sign}${output.value}, ${output.color})`;

module.exports = (state, tx) => {
  const txString = (() => {
    switch (tx.type) {
      case Type.DEPOSIT: {
        return `deposit: ${printOutput(tx.outputs[0], '+')}`;
      }
      case Type.EPOCH_LENGTH: {
        return `epochLength: ${tx.options.epochLength}`;
      }
      case Type.MIN_GAS_PRICE: {
        return `minGasPrice: ${tx.options.minGasPrice}`;
      }
      case Type.EXIT: {
        return `exit: ${tx.inputs[0].prevout.getUtxoId()}`;
      }
      case Type.TRANSFER: {
        const inputStrings = tx.inputs
          .map(inp => state.unspent[inp.prevout.hex()])
          .map(o => printOutput(o, '−'));
        const outputStrings = tx.outputs.map(o => printOutput(o, '+'));
        const emptyInput = ' '.repeat(inputStrings[0].length);
        const balance = range(
          0,
          Math.max(inputStrings.length, outputStrings.length) - 1
        )
          .map(i => {
            const inp = inputStrings[i] || emptyInput;
            const out = outputStrings[i] || '';
            return `${inp}\t→\t${out}`;
          })
          .join('\n');
        return `transfer:\n ${balance}`;
      }
      case Type.VALIDATOR_JOIN: {
        return `validatorJoin: slotId: ${tx.options.slotId}, tenderKey: ${
          tx.options.tenderKey
        }, signerAddr: ${tx.options.signerAddr}, eventsCount: ${
          tx.options.eventsCount
        }`;
      }
      case Type.VALIDATOR_LOGOUT: {
        return `validatorLogout: slotId: ${
          tx.options.slotId
        }, activationEpoch: ${tx.options.activationEpoch}, newSigner: ${
          tx.options.newSigner
        }, eventsCount: ${tx.options.eventsCount}`;
      }
      default:
        return undefined;
    }
  })();

  return `${txString}\n${tx.hash()}`;
};
