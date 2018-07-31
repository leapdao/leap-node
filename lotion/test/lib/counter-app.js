const lotion = require('../../index.js');

lotion({ initialState: { count: 0 } })
  .use(state => {
    state.count += 1;
  })
  .listen(3000)
  .then(({ GCI }) => {
    console.log(`@GCI: ${GCI}`);
  });
