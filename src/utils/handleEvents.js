module.exports = handlers => async events => {
  for (const event of events) {
    if (handlers[event.event]) {
      const result = handlers[event.event](event);
      if (result && typeof result.then === 'function') {
        await result; // eslint-disable-line no-await-in-loop
      }
    }
  }
};
