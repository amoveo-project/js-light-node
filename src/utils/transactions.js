export function parseTransaction(tx) {
  let data = {
    type: tx[0],
    from: tx[1],
    nonce: tx[2],
    fee: tx[3],
    to: tx[4],
    amount: null,
    extra: null,
  };

  if (tx[0] === 'create_acc_tx') {
    data = { ...data, amount: tx[5] };
  } else if (tx[0] === 'spend') {
    data = { ...data, amount: tx[5] };
  } else if (tx[0] === 'delete_acc_tx') {
    // no actions
  } else if (tx[0] === 'nc') {
    data = {
      ...data,
      to: tx[2],
      fee: tx[3],
      nonce: tx[4],
      extra: {
        bal1: tx[5],
        bal2: tx[6],
        delay: tx[7],
        id: tx[8],
      },
    };
  } else if (tx[0] === 'csc') {
    data = {
      ...data,
      to: null,
      extra: {
        scriptpubkey: tx[4],
        scriptsig: tx[5],
      },
    };
  } else if (tx[0] === 'cs') {
    data = {
      ...data,
      to: null,
      extra: {
        scriptpubkey: tx[4],
        scriptsig: tx[5],
      },
    };
  } else if (tx[0] === 'ctc') {
    data = {
      ...data,
      to: tx[2],
      fee: tx[3],
      nonce: tx[4],
      amount: tx[6],
      extra: {
        id: tx[5],
      },
    };
  } else if (tx[0] === 'timeout') {
    data = {
      ...data,
      to: null,
      extra: {
        cid: tx[4],
        spk_aid1: tx[5],
        spk_aid2: tx[6],
      },
    };
  } else if (tx[0] === 'oracle_new') {
    data = {
      ...data,
      to: null,
      extra: {
        // todo: could be problems with utf-8 decoding
        question: tx[4] && decodeURIComponent(escape(window.atob(tx[4]))),
        start: tx[5],
        id: tx[6],
        difficulty: tx[7],
        governance: tx[8],
        governance_amount: tx[9],
      },
    };
  } else if (tx[0] === 'oracle_bet') {
    data = {
      ...data,
      amount: tx[6],
      extra: {
        type: tx[5],
      },
    };
  } else if (tx[0] === 'oracle_close') {
    // no actions
  } else if (tx[0] === 'unmatched') {
    // no actions
  } else if (tx[0] === 'oracle_winnings') {
    // no actions
  } else if (tx[0] === 'coinbase') {
    data = { ...data, to: null };
  }

  return data;
}
