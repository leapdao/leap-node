const { Tx, Input, Outpoint, Output } = require('leap-core');

const pulse = require('./pulse');
const getUnspent = require('../api/methods/getUnspent');
const { NFT_COLOR_BASE } = require('../api/methods/constants');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const PRIV =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const HEARTBEAT_COLOR = NFT_COLOR_BASE + 112;
const HEARTBEAT_VALUE =
  '0x0000000000000000000000000000000000000000000000000000000000001234';

const tx = Tx.transfer(
  [
    new Input(
      new Outpoint(
        '0x7777777777777777777777777777777777777777777777777777777777777777',
        0
      )
    ),
  ],
  [new Output(HEARTBEAT_VALUE, ADDR, HEARTBEAT_COLOR)]
).signAll(PRIV);

const out0 = new Outpoint(tx.hash(), 0).hex();
const unspent = [
  {
    outpoint: out0,
    output: tx.outputs[0].toJSON(),
  },
];

jest.mock('../api/methods/getUnspent');

const sender = {
  sendDelayed: jest.fn(() => null),
  send: jest.fn(() => null),
};

const bridgeStateMock = {
  account: {
    address: ADDR,
    privateKey: PRIV,
  },
  config: {
    heartbeatColor: HEARTBEAT_COLOR,
  },
};

describe('Heartbeat', () => {
  test('If no Heartbeat NFT is found in UTXO, ignore and move along', async () => {
    getUnspent.mockImplementation(() => []);
    await pulse(bridgeStateMock, sender);
    expect(sender.send).not.toBeCalled();
  });

  test('If Heartbeat NFT is found in UTXO, pulse to signal liveliness', async () => {
    getUnspent.mockImplementation(() => unspent);
    await pulse(bridgeStateMock, sender);
    expect(sender.send).toBeCalled();
  });
});
