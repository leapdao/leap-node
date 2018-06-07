const promisifyWeb3Call = (method, ...args) =>
  new Promise((resolve, reject) => {
    method(...args, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

export default promisifyWeb3Call;
