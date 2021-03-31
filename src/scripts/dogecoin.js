/* eslint-disable import/no-unresolved */
/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
const dogecore = require('bitcore-lib-doge')

const dogecoin = (function () {
  const generateWallet = () => {
    const privateKey = new dogecore.PrivateKey()

    return {
      address: privateKey.toAddress().toString(),
      privateKey: privateKey.toWIF(),
    }
  }

  const importPrivateKey = (privateKey) => {
    return new dogecore.PrivateKey(privateKey).toAddress().toString()
  }

  return {
    generateWallet,
    importPrivateKey,
  }
})()
