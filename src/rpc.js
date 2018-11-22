import { parseTransaction } from './utils/transactions';

class RPC {
  constructor(url) {
    this.url = url;
  }

  getHeaders = async (top, number) => {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify(['headers', number, top]),
    });

    const data = await response.json();
    return data[1].slice(1);
  };

  getNodeHeight = async () => {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify(['height']),
    });

    const data = await response.json();
    return data[1];
  };

  getProof = async (tree, key, topHash) => {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify(['proof', tree, key, topHash]),
    });

    const data = await response.json();
    return data[1];
  };

  getAccountState = async account => {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify(['account', account]),
    });

    const data = await response.json();
    return data[1];
  };

  createTx = async (type, amount, fee, from, to) => {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify([type, amount, fee, from, to]),
    });

    const data = await response.json();
    return data[1];
  };

  pushTx = async signedTx => {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify(['txs', [-6, signedTx]]),
    });

    const data = await response.json();
    return data[1];
  };

  getTransactions = async address => {
    const response = await fetch(
      `https://amoveo.exan.tech/explorer/api/v1/txlist?address=${address}`,
    );

    const data = await response.json();
    const transactions = Array.isArray(data.result) ? data.result : [];

    return transactions;
  };

  getPendingPool = async () => {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify(['txs']),
    });
    const data = await response.json();

    const transactions = data && Array.isArray(data[1]) ? data[1] : [];

    return transactions
      .filter(Array.isArray)
      .map(tx => ({ id: tx[2], tx: parseTransaction(tx[1]) }));
  };
}

export default RPC;
