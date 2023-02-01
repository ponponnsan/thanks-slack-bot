// import Web3 from "web3";
// let web3 = new Web3(new Web3.providers.HttpProvider('https://goerli.infura.io/v3/f178f39bf6804ae5bcc2a4ac7e0054a7') );

// // web3.jsをインポートします
// // import Web3 from 'web3';



// // Create a new wallet
// const newWallet = web3.eth.accounts.create();
// const address =newWallet.address
// const privateKey = newWallet.privateKey
// console.log("Address: " + newWallet.address);
// console.log("Private Key: " + newWallet.privateKey);


// const from = "0x185560f8ff7c8c0f4d8a837f0f0c5e110236c48b"; // 取引先のアドレス
// const value = "1000000"; // 1ETH
// const gasPrice = "20000000000"; // 20 Gwei
// const gasLimit = "21000"; // 21000
// const data = "0x"; // 取引データ

// web3.eth.sendTransaction({
//   from: from,
//   to: address,
//   value: value,
//   gasPrice: gasPrice,
//   gas: gasLimit,
//   data: data,
//   nonce: await web3.eth.getTransactionCount(from),
//   chainId: await web3.eth.net.getId()
// }, (err, transactionHash) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Transaction hash:", transactionHash);
//   }
// });

// // 秘密鍵を使って署名する
// const signedTransaction = await newWallet.signTransaction({
//   to: address,
//   value: value,
//   gasPrice: gasPrice,
//   gas: gasLimit,
//   data: data,
//   nonce: web3.eth.getTransactionCount(from),
//   chainId: web3.eth.net.getId()
// });

// // トランザクションを送信する
// const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
// console.log("Transaction receipt:", receipt);







// Encrypt the private key
// const password = "mypassword";
// const keystore = web3.eth.accounts.encrypt(newWallet.privateKey, password);
// console.log(keystore);

// // Send a transaction
// const sender = "0x4FFDDb28d9648f85E29d05f4c7f7864CC4102eCe"
// // const recipient = "";
// const amount = "0.00001";
// const transaction = {
//   from: sender,
//   to: newWallet.address,
//   value: web3.utils.toWei(amount, "ether")
// };
// web3.eth.sendTransaction(transaction)
// .then(console.log)
// .catch(console.error);


import AWS from 'aws-sdk';

// Initialize the AWS SDK
AWS.config.update({
  region: 'us-west-2'
});

// Create a KMS client
const kms = new AWS.KMS();

// Define the key alias
const key_alias = 'OHOHOH';

// Define the key description
const key_description = 'My KMS Key with storeID';

// Define the key parameters
const key_params = {
  Description: key_description,
  KeyUsage: 'SIGN_VERIFY',
  KeySpec: 'ECC_SECG_P256K1'
  // XksKeyId: key_alias
};


kms.createKey(key_params).promise()
  .then(data => {console.log(data); return kms.createAlias({
    AliasName: "alias/"+key_alias,
    TargetKeyId: data.KeyMetadata.KeyId
  }).promise();})
  .catch(err => console.error(err));

// const test = async () =>{
//   const res  = await kms.createKey(key_params)
//   return res
// };


// const res = await test()

// console.log(tmp)