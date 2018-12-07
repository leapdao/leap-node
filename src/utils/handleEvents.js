module.exports = handlers => {
  Object.keys(handlers).forEach(key => {
    if (key[0].toUpperCase() !== key[0]) {
      throw new Error('Event name should start with a capital letter');
    }
  });

  return async events => {
    for (const event of events) {
      // istanbul ignore next
      if (event.event === undefined) {
        console.warn('Unknown event. ABI can be outdated');
      }

      if (handlers[event.event]) {
        const result = handlers[event.event](event);
        if (result && typeof result.then === 'function') {
          await result; // eslint-disable-line no-await-in-loop
        }
      }
    }
  };
};
