/* global Web3 */
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

const bridgeAddress = '0x';
const tokenAddress = '0xa6794e7663add37e44ae6bb1e8544b8de1e238cb';

if (!window.web3) {
  alert('You need to instal MetaMask first');
}

const web3 = new Web3();
web3.setProvider(window.web3.currentProvider);

const bridge = web3.eth.contract(window.abis.bridge).at(bridgeAddress);
const token = web3.eth.contract(window.abis.token).at(tokenAddress);

Promise.all([
  promisifyWeb3Call(window.web3.eth.getAccounts),
  promisifyWeb3Call(token.decimals),
  promisifyWeb3Call(token.symbol),
]).then(([accounts, decimalsNum, symbol]) => {
  const decimals = new web3.BigNumber(10).pow(decimalsNum);
  const balanceNode = document.querySelector('#bal');
  const amountInput = document.querySelector('#amount');
  const submitButton = document.querySelector('#submit');

  promisifyWeb3Call(token.balanceOf, accounts[0]).then(balance => {
    balanceNode.innerText = `${Number(balance.div(decimals))} ${symbol}`;
  });

  submitButton.addEventListener('click', async () => {
    const amount = decimals.mul(amountInput.value);
    const approveTxHash = promisifyWeb3Call(
      token.approve.sendTransaction,
      bridgeAddress,
      amount,
      { from: accounts[0] }
    );
    console.log('approve', approveTxHash);
    const joinTxHash = promisifyWeb3Call(bridge.join.sendTransaction, amount, {
      from: accounts[0],
    });
    console.log('join', joinTxHash);
    alert('Everything is ok, hashes in console');
    amountInput.value = '0';
  });
});
