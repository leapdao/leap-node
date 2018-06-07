import React from 'react';
import Slots from './slots'; // eslint-disable-line
import promisifyWeb3Call from './promisifyWeb3Call';
import getWeb3 from './getWeb3';
import { token as tokenAbi, bridge as bridgeAbi } from './abis';
import { tokenAddress, bridgeAddress } from './addrs';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: null,
    };
  }

  componentDidMount() {
    const { account } = this.props;
    const web3 = getWeb3();
    const token = web3.eth.contract(tokenAbi).at(tokenAddress);
    promisifyWeb3Call(token.balanceOf, account).then(balance => {
      this.setState({ balance });
    });

    const bridge = getWeb3(true)
      .eth.contract(bridgeAbi)
      .at(bridgeAddress);
    const allEvents = bridge.allEvents({ toBlock: 'latest' });
    allEvents.watch(() => {
      promisifyWeb3Call(token.balanceOf, account).then(balance => {
        this.setState({ balance });
      });
    });
  }

  render() {
    const { balance } = this.state;
    const { decimals, symbol } = this.props;
    return (
      <div>
        {balance && (
          <p>
            Balance: {Number(balance.div(decimals))} {symbol}
          </p>
        )}
        <Slots {...this.props} />
      </div>
    );
  }
}
