import React from 'react'; // eslint-disable-line
import ReactDOM from 'react-dom';

import * as abis from './abis';
import App from './app'; // eslint-disable-line
import getWeb3 from './getWeb3';
import promisifyWeb3Call from './promisifyWeb3Call';
import { tokenAddress } from './addrs';

if (!window.web3) {
  alert('You need to instal MetaMask first');
}

const token = getWeb3()
  .eth.contract(abis.token)
  .at(tokenAddress);

Promise.all([
  promisifyWeb3Call(window.web3.eth.getAccounts),
  promisifyWeb3Call(token.decimals),
  promisifyWeb3Call(token.symbol),
]).then(([accounts, decimals, symbol]) => {
  const web3 = getWeb3();
  ReactDOM.render(
    <App
      account={accounts[0]}
      decimals={new web3.BigNumber(10).pow(decimals)}
      symbol={symbol}
    />,
    document.getElementById('app')
  );
});
