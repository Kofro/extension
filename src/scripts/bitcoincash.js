/* eslint-disable import/no-unresolved */
/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
const bitcorecash = require('bitcore-lib-cash')

const bitcoincash = (function () {
  const generateWallet = () => {
    const privateKey = new bitcorecash.PrivateKey()

    return {
      address: privateKey.toAddress().toString(),
      privateKey: privateKey.toWIF(),
    }
  }

  const importPrivateKey = (privateKey) => {
    return new bitcorecash.PrivateKey(privateKey).toAddress().toString()
  }

  return {
    generateWallet,
    importPrivateKey,
  }
})()
