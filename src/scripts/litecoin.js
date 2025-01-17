/* eslint-disable new-cap */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-unresolved */
/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
const litecore = require('bitcore-lib-ltc')

const litecoin = (function () {
  const generateWallet = () => {
    const privateKey = new litecore.PrivateKey()

    return {
      address: privateKey.toAddress().toString(),
      privateKey: privateKey.toWIF(),
    }
  }

  const importPrivateKey = (privateKey) => {
    return new litecore.PrivateKey(privateKey).toAddress().toString()
  }

  const createTransaction = (outputs, to, amount, fee, changeAddress, privateKey) => {
    const transaction = new litecore.Transaction()
      .from(outputs)
      .to(to, amount)
      .fee(fee)
      .change(changeAddress)
      .sign(privateKey)

    return {
      raw: transaction.toString(),
      hash: transaction.toObject().hash,
    }
  }

  const getTransactionSize = (outputs) => {
    return new litecore.Transaction().from(outputs).toString().length
  }

  const getFee = (outputs, to, amount, changeAddress, feePerByte) => {
    try {
      const txSize = new litecore.Transaction()
        .from(outputs)
        .to(to, amount)
        .change(changeAddress)
        .toString().length

      return txSize * 2 * feePerByte
    } catch (err) {
      return getTransactionSize(outputs) * 3
    }
  }

  const isAddressValid = (address) => {
    try {
      const getAddress = new litecore.Address.fromString(address)
      return getAddress.toString().toLowerCase() === address.toLowerCase()
    } catch (err) {
      return false
    }
  }

  return {
    generateWallet,
    importPrivateKey,
    createTransaction,
    getFee,
    isAddressValid,
  }
})()
