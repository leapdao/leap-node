const debug = require('debug')('getProof');
const { helpers, Output, Outpoint, Tx } = require('leap-core');
const { periodOfTheBlock } = require('./helpers/helpers');
const { bufferToHex } = require('ethereumjs-util');
const Web3 = require('web3');

const web3 = new Web3('http://node1.testnet.leapdao.org:8645');
const txHash = "0xd235fbcab35e153852ff28c0cc1c402d0e9a53fba464ea4e1d3d4a7fabf5b25a";

async function run() {    
    const latestBlockNumber = (await web3.eth.getBlock('latest')).number;
    debug("Latest Block number: ", latestBlockNumber);
    const latestSubmittedBlock = latestBlockNumber - latestBlockNumber % 32;
    debug("Latest submitted block number: ", latestSubmittedBlock);
    const txData = await web3.eth.getTransaction(txHash);
    debug("txData: ");
    debug(txData);
    const txBlock = txData.blockNumber;
    if (latestSubmittedBlock <= txBlock) {
        throw new Error("Block with transaction is not yet submitted in period");
    };
    const period = await periodOfTheBlock(web3, txBlock);
    debug("Period:");
    debug(period);
    console.log("------Proof------");
    const proof = period.proof(Tx.fromRaw(txData.raw));
    console.log(proof);
    console.log("-----------------");
    
    const prevHash = bufferToHex(Tx.fromRaw(txData.raw).inputs[0].prevout.hash);
    const prevTxData = await web3.eth.getTransaction(prevHash);
    debug("Previous txData: ");
    debug(prevTxData);
    const prevTxBlock = prevTxData.blockNumber;
    const prevPeriod = await periodOfTheBlock(web3, prevTxBlock);
    debug("Previous Period:");
    debug(prevPeriod);
    console.log("------Previous Proof------");
    const prevProof = period.proof(Tx.fromRaw(prevTxData.raw));
    console.log(prevProof);
    console.log("-----------------");
}

run();