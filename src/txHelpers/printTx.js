const { Type } = require('parsec-lib');
const { range } = require('../utils');

const printOutput = (output, sign) =>
  `${output.address} (${sign}${output.value}, ${output.color})`;

module.exports = (state, tx) => {
  switch (tx.type) {
    case Type.DEPOSIT: {
      return `deposit: ${printOutput(tx.outputs[0], '+')}`;
    }
    case Type.EXIT: {
      return `exit`;
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
    case Type.CONSOLIDATE: {
      return `consolidate: ${tx.outputs[0].address}, color: ${
        tx.outputs[0].color
      }`;
    }
    case Type.VALIDATOR_LOGOUT: {
      return `validatorLogout: slotId: ${tx.options.slotId}, activationEpoch: ${
        tx.options.activationEpoch
      }, newSigner: ${tx.options.newSigner}, eventsCount: ${
        tx.options.eventsCount
      }`;
    }
    default:
      return undefined;
  }
};
