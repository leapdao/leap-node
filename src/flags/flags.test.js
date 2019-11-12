const flagsFactory = require('./flagsFactory');

const makeFlags = flagsFactory(['test_flag', 'test_flag_2']);

describe('Feature flags', () => {
  it('should be true by default', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState, {});

    expect(flags.test_flag).toBe(true);
  });

  it('should be false if configured height not reached yet', () => {
    const bridgeState = { blockHeight: 5 };
    const flags = makeFlags(bridgeState, {
      test_flag: 10,
    });

    expect(flags.test_flag).toBe(false);
  });

  it('should be true if configured height reached', () => {
    const bridgeState = { blockHeight: 10 };
    const flags = makeFlags(bridgeState, {
      test_flag: 10,
    });

    expect(flags.test_flag).toBe(true);
  });

  it('should change value after height change', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState, {
      test_flag: 10,
    });

    expect(flags.test_flag).toBe(false);
    bridgeState.blockHeight = 10;
    expect(flags.test_flag).toBe(true);
  });

  it('should throw on unknown flag', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState);
    expect(() => {
      const value = flags.unknown_flag; // eslint-disable-line no-unused-vars
    }).toThrow('Unknown feature flag unknown_flag');
  });

  it('should throw on attempt to set a flag value', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState);
    expect(() => {
      flags.test_flag = true;
    }).toThrow('Flags are read-only: test_flag');
  });

  it('should serialize flag values', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState, {
      test_flag: 10,
    });

    bridgeState.blockHeight = 0;
    expect(JSON.parse(JSON.stringify(flags))).toEqual({
      test_flag: false,
      test_flag_2: true,
    });

    bridgeState.blockHeight = 10;
    expect(JSON.parse(JSON.stringify(flags))).toEqual({
      test_flag: true,
      test_flag_2: true,
    });
  });
});
