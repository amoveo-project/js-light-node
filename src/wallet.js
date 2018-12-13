import { defaultMinerFee } from './config';
import { treeNumber2Value } from './utils/format';

export default class Wallet {
  constructor(rpc, merkle, headers, keys, events) {
    this.rpc = rpc;
    this.tree = merkle;
    this.headers = headers;
    this.keys = keys;
    this.events = events;

    this._pendingTimeout = null;
    this._pendingTxIds = [];
  }

  getBalance(pubkey = undefined) {
    pubkey = pubkey || this.keys.getPublicKey();
    return this.tree.request_proof('accounts', pubkey);
  }

  getAccountState = async (receiver, minerFee = undefined) => {
    if (minerFee === undefined) minerFee = defaultMinerFee;

    const state = await this.rpc.getAccountState(receiver);

    const govFeeVar = state === 'empty' ? 14 : 15;
    const result = await this.tree.request_proof('governance', govFeeVar);

    return { fee: treeNumber2Value(result[2]) + minerFee, state };
  };

  createTxProposal = async (origin, receiver, amount, minerFee = undefined) => {
    if (minerFee === undefined) minerFee = defaultMinerFee;

    if (minerFee < 9) {
      throw new Error(
        'miner fee specified is less than default min_tx_fee (9 sat)',
      );
    }

    const { fee: minimalFee, state } = await this.getAccountState(receiver, 0);
    const fee = minimalFee + minerFee;

    let currentBalance;
    try {
      currentBalance = await this.getBalance(origin);
      currentBalance = currentBalance[1];
    } catch (e) {
      currentBalance = 0;
    }

    if (currentBalance < fee + amount) {
      throw new Error(
        `Amount + fee = ${fee +
          amount} exceeds available balance ${currentBalance}`,
      );
    }

    let txType;
    if (state === 'empty') {
      txType = 'create_account_tx';
    } else {
      txType = 'spend_tx';
    }

    const tx = await this.rpc.createTx(txType, amount, fee, origin, receiver);

    return { tx, fee };
  };

  sendMoney = async (receiver, amount, minerFee = undefined) => {
    const origin = this.keys.getPublicKey();

    const { tx, fee } = await this.createTxProposal(
      origin,
      receiver,
      amount,
      minerFee,
    );
    console.debug(tx, fee);

    if (tx[5] !== amount) {
      throw Error('amount has changed');
    } else if (tx[3] !== fee) {
      throw Error('fee has changed');
    } else if (tx[4] !== receiver) {
      throw Error('receiver has changed');
    }

    const signed = this.keys.signTransaction(tx);
    console.debug(signed);

    return this.rpc.pushTx(signed);
  };

  getTransactions = (address = this.keys.getPublicKey()) =>
    this.rpc.getTransactions(address);

  getPendingTransactions = async publicAddress => {
    let address = publicAddress;

    if (!address) {
      try {
        address = this.keys.getPublicKey();
      } catch (e) {
        address = '';
      }
    }

    if (!address) {
      return [];
    }

    const poolTxs = await this.rpc.getPendingPool();
    const filteredPoolTxs = poolTxs.filter(
      item => item.tx.from === address || item.tx.to === address,
    );

    return filteredPoolTxs;
  };

  resetPendingCache = () => {
    this._pendingTxIds = [];
  };

  syncPendingTransactions = async () => {
    let poolTxs = [];

    try {
      poolTxs = await this.getPendingTransactions();
    } catch (e) {
      throw new Error("Can't get pending transactions");
    }

    const poolTxIds = poolTxs.map(item => item.id);

    const removedTxIds = this._pendingTxIds.filter(
      item => !poolTxIds.includes(item),
    );

    poolTxs.forEach(poolTx => {
      const isAlreadyStored = this._pendingTxIds.includes(poolTx.id);

      if (isAlreadyStored) {
        return;
      }

      this.events.emit('VEO_ADD_PENDING_TRANSACTION', poolTx);
    });

    removedTxIds.forEach(removedTxId => {
      this.events.emit('VEO_REMOVE_PENDING_TRANSACTION', { id: removedTxId });
    });

    this._pendingTxIds = poolTxIds;
  };

  startPendingSync() {
    if (!this._pendingTimeout) {
      this._pendingTimeout = setInterval(this.syncPendingTransactions, 20000);
    }

    this.syncPendingTransactions();
  }

  stopPendingSync() {
    clearInterval(this._pendingTimeout);
    this._pendingTimeout = null;
  }
}
