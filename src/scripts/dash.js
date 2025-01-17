/* eslint-disable new-cap */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable import/no-unresolved */
/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
const dash = (function () {
  const generateWallet = () => {
    const privateKey = new window.dashcore.PrivateKey()

    return {
      address: privateKey.toAddress().toString(),
      privateKey: privateKey.toWIF(),
    }
  }

  const importPrivateKey = (privateKey) => {
    return new window.dashcore.PrivateKey(privateKey).toAddress().toString()
  }

  const createTransaction = (outputs, to, amount, fee, changeAddress, privateKey) => {
    const transaction = new window.dashcore.Transaction()
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

  const getFee = (outputs, to, amount, changeAddress, feePerByte) => {
    const txSize = new window.dashcore.Transaction()
      .from(outputs)
      .to(to, amount)
      .change(changeAddress)
      .toString().length

    return txSize * 2 * feePerByte
  }

  const isAddressValid = (address) => {
    try {
      const getAddress = new window.dashcore.Address.fromString(address)
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
