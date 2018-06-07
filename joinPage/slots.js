import React, { Fragment } from 'react'; // eslint-disable-line
import getWeb3 from './getWeb3';
import promisifyWeb3Call from './promisifyWeb3Call';
import { bridge as bridgeAbi, token as tokenAbi } from './abis';
import { bridgeAddress, tokenAddress } from './addrs';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

const readSlots = (web3, bridge) => {
  return promisifyWeb3Call(bridge.epochLength)
    .then(epochLength => {
      const proms = [];
      for (let slotId = 0; slotId < epochLength; slotId += 1) {
        proms.push(promisifyWeb3Call(bridge.slots, slotId));
      }

      return Promise.all(proms);
    })
    .then(slots =>
      slots.map(
        ([
          owner,
          stake,
          signer,
          activationEpoch,
          newOwner,
          newStake,
          newSigner,
        ]) => ({
          owner,
          stake,
          signer,
          activationEpoch,
          newOwner,
          newStake,
          newSigner,
        })
      )
    );
};

export default class Slots extends React.Component {
  constructor(props) {
    super(props);

    const signerAddr = window.localStorage.getItem('signerAddr');
    this.state = {
      slots: [],
      stakes: {},
      signerAddr,
    };
    this.renderSlot = this.renderSlot.bind(this);
    this.handleSignerChange = this.handleSignerChange.bind(this);
  }

  componentDidMount() {
    this.refreshSlots();
    const web3 = getWeb3(true);
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);
    const allEvents = bridge.allEvents({ toBlock: 'latest' });
    allEvents.watch(() => {
      this.refreshSlots();
    });
  }

  refreshSlots() {
    const web3 = getWeb3();
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);
    readSlots(web3, bridge).then(slots => {
      this.setState({ slots });
    });
  }

  setStake(i, stake) {
    const { decimals } = this.props;
    const { BigNumber } = getWeb3();
    const slot = this.state.slots[i];
    const minStake = BigNumber.max(slot.stake, slot.newStake).mul(1.05);

    this.setState(state => {
      if (stake) {
        return {
          stakes: Object.assign({}, state.stakes, {
            [i]: Math.max(Number(minStake.div(decimals)), Number(stake)),
          }),
        };
      }

      return {
        stakes: Object.assign({}, state.stakes, {
          [i]: undefined,
        }),
      };
    });
  }

  handleBet(slotId) {
    const { decimals, account } = this.props;
    const { signerAddr } = this.state;
    const { BigNumber } = getWeb3();
    const stake = new BigNumber(this.state.stakes[slotId]).mul(decimals);
    const web3 = getWeb3(true);
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);
    const token = web3.eth.contract(tokenAbi).at(tokenAddress);

    promisifyWeb3Call(token.approve.sendTransaction, bridgeAddress, stake, {
      from: account,
    })
      .then(approveTxHash => {
        console.log('approve', approveTxHash); // eslint-disable-line
        return promisifyWeb3Call(
          bridge.bet.sendTransaction,
          slotId,
          stake,
          signerAddr,
          { from: account }
        );
      })
      .then(betTxHash => {
        console.log('bet', betTxHash); // eslint-disable-line
        this.setStake(slotId, undefined);
      });
  }

  renderSlot(slot, i) {
    const { symbol, decimals, balance } = this.props;
    const { signerAddr, stakes } = this.state;
    const isFree = slot.owner === EMPTY_ADDRESS;
    const isOwned = slot.signer === signerAddr;
    const willChange = slot.newSigner !== EMPTY_ADDRESS;
    const { BigNumber } = getWeb3();
    const minStake = BigNumber.max(slot.stake, slot.newStake).mul(1.05);
    const minValue = minStake.div(decimals).toNumber();
    const bal = balance.div(decimals).toNumber();
    const currentValuesStyle = {
      display: 'block',
      textDecoration: willChange ? 'line-through' : 'none',
      color: willChange ? '#999' : '#000',
    };
    const cellStyle = {
      verticalAlign: 'top',
      paddingRight: 10,
      paddingBottom: 10,
      paddingTop: 10,
      borderBottom: '1px solid #ccc',
    };

    return (
      <tr key={i}>
        <td style={cellStyle}>
          {i}
          <br />
          {isOwned && '(owner)'}
        </td>
        {isFree && (
          <Fragment>
            <td style={cellStyle} colSpan={4} />
          </Fragment>
        )}
        {!isFree && (
          <Fragment>
            <td style={cellStyle}>
              <span style={currentValuesStyle}>{slot.owner}</span>
              {willChange && <span>{slot.newOwner}</span>}
            </td>
            <td style={cellStyle}>
              <span style={currentValuesStyle}>{slot.signer}</span>
              {willChange && <span>{slot.newSigner}</span>}
            </td>
            <td style={cellStyle}>
              <span style={currentValuesStyle}>
                {slot.stake.div(decimals).toNumber()} {symbol}
              </span>
              {willChange && (
                <span>
                  {slot.newStake.div(decimals).toNumber()} {symbol}
                </span>
              )}
            </td>
            <td style={cellStyle}>{slot.activationEpoch.toNumber()}</td>
          </Fragment>
        )}
        <td style={cellStyle}>
          <input
            value={stakes[i] || ''}
            onChange={e => {
              this.setStake(i, e.target.value);
            }}
          />{' '}
          {symbol}{' '}
          <button
            disabled={!stakes[i] || !signerAddr || stakes[i] > bal}
            onClick={() => this.handleBet(i)}
          >
            Bet
          </button>
          <br />
          {minValue > 0 && <span style={{ fontSize: 11 }}> >= {minValue}</span>}
        </td>
      </tr>
    );
  }

  handleSignerChange(e) {
    const signerAddr = e.target.value.trim();
    window.localStorage.setItem('signerAddr', signerAddr);
    this.setState({
      signerAddr,
    });
  }

  render() {
    const { slots, signerAddr } = this.state;
    const headerStyle = {
      textAlign: 'left',
      paddingRight: 10,
    };
    return (
      <div>
        <h2>Slots</h2>
        <p>
          Signer address:{' '}
          <input
            value={signerAddr}
            onChange={this.handleSignerChange}
            style={{ width: 250 }}
          />
        </p>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>ID</th>
              <th style={headerStyle}>Owner</th>
              <th style={headerStyle}>Signer</th>
              <th style={headerStyle}>Stake</th>
              <th style={headerStyle}>Act. epoch</th>
              <th style={headerStyle} />
            </tr>
          </thead>
          <tbody>{slots.map(this.renderSlot)}</tbody>
        </table>
      </div>
    );
  }
}
