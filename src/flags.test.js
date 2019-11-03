const makeFlags = require('./flags');

describe('Feature flags', () => {
  it('should be true by default', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState, {});

    expect(flags.spend_cond_not_touched).toBe(true);
  });

  it('should be false if configured height not reached yet', () => {
    const bridgeState = { blockHeight: 5 };
    const flags = makeFlags(bridgeState, {
      spend_cond_not_touched: 10,
    });

    expect(flags.spend_cond_not_touched).toBe(false);
  });

  it('should be true if configured height reached', () => {
    const bridgeState = { blockHeight: 10 };
    const flags = makeFlags(bridgeState, {
      spend_cond_not_touched: 10,
    });

    expect(flags.spend_cond_not_touched).toBe(true);
  });

  it('should change value after height change', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState, {
      spend_cond_not_touched: 10,
    });

    expect(flags.spend_cond_not_touched).toBe(false);
    bridgeState.blockHeight = 10;
    expect(flags.spend_cond_not_touched).toBe(true);
  });

  it('should throw on unknown flag', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState);
    expect(() => {
      const value = flags.unknown_flag; // eslint-disable-line no-unused-vars
    }).toThrow('Unknow feature flag unknown_flag');
  });

  it('should throw on attempt to set a flag value', () => {
    const bridgeState = { blockHeight: 0 };
    const flags = makeFlags(bridgeState);
    expect(() => {
      flags.spend_cond_not_touched = true;
    }).toThrow('Flags are read-only: spend_cond_not_touched');
  });
});
