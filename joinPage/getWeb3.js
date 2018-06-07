import Web3 from 'web3';

let web3;
let injectedWeb3;

export default (injected = false) => {
  if (!injected && !web3) {
    web3 = new Web3();
    web3.setProvider(
      new web3.providers.HttpProvider('https://rinkeby.infura.io')
    );
  }

  if (!injected && !injectedWeb3) {
    injectedWeb3 = new Web3();
    injectedWeb3.setProvider(window.web3.currentProvider);
  }

  return injected ? injectedWeb3 : web3;
};
