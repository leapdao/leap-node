jest.mock('fs');

const fs = require('fs');
const { readPrivKey, writePrivKey } = require('./privKey');

describe('privKey utils', () => {
  describe('readPrivKey', () => {
    test('from privateKey cli arg', async () => {
      fs.exists.mockImplementationOnce((_, cb) => cb(null, true));
      fs.readFile.mockImplementationOnce((_, cb) => cb(null, '0x000'));

      const config = {};
      await readPrivKey({}, config, {
        privateKey: 'path/to/.priv',
      });
      expect(config.privKey).toBe('0x000');
    });

    test('from lotion path', async () => {
      fs.exists.mockImplementationOnce((_, cb) => cb(null, true));
      fs.readFile.mockImplementationOnce((_, cb) => cb(null, '0x000'));

      const config = {};
      await readPrivKey(
        {
          lotionPath: () => '~/.lotion/networks/net',
        },
        config,
        {}
      );
      expect(config.privKey).toBe('0x000');
    });

    test('not exists', async () => {
      fs.exists.mockImplementationOnce((_, cb) => cb(null, false));
      fs.exists.mockImplementationOnce((_, cb) => cb(null, false));

      const config = {};
      await readPrivKey(
        {
          lotionPath: () => '~/.lotion/networks/net',
        },
        config,
        { privateKey: 'path/to/.priv' }
      );
      expect(config.privKey).toBe(undefined);
    });
  });

  describe('writePrivKey', () => {
    fs.writeFile.mockImplementation((_1, _2, cb) => cb(null, ''));
    test('not write if from cliArg', async () => {
      fs.exists.mockImplementationOnce((_, cb) => cb(null, true));
      await writePrivKey(
        {
          lotionPath: () => '~/.lotion/networks/net',
        },
        { privateKey: 'path/to/.priv' },
        '0x0000'
      );
      expect(fs.writeFile.mock.calls.length).toBe(0);
    });

    test('not write if exists in lotion path', async () => {
      fs.exists.mockImplementationOnce((_, cb) => cb(null, true));
      await writePrivKey(
        {
          lotionPath: () => '~/.lotion/networks/net',
        },
        {},
        '0x0000'
      );
      expect(fs.writeFile.mock.calls.length).toBe(0);
    });

    test('write in other cases', async () => {
      fs.exists.mockImplementationOnce((_, cb) => cb(null, false));
      await writePrivKey(
        {
          lotionPath: () => '~/.lotion/networks/net',
        },
        {},
        '0x0000'
      );
      expect(fs.writeFile.mock.calls.length).toBe(1);
      expect(fs.writeFile.mock.calls[0][0]).toBe(
        '~/.lotion/networks/net/.priv'
      );
      expect(fs.writeFile.mock.calls[0][1]).toBe('0x0000');
    });
  });
});
