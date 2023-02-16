// --------web3----------
import Web3 from "web3";
import { KmsProvider } from "aws-kms-provider";
// let web3 = new Web3(Web3.givenProvider || "ws://some.local-or-remote.node:8546");
// var web3 = new Web3(new Web3.providers.HttpProvider('https://goerli.infura.io/v3/f178f39bf6804ae5bcc2a4ac7e0054a7') );
// var keyId = "arn:aws:kms:us-west-2:915269476108:key/0cd69a9f-b880-4c8c-b6b9-35d1adab9ce5"
var keyId = ["arn:aws:kms:us-west-2:915269476108:key/0cd69a9f-b880-4c8c-b6b9-35d1adab9ce5"
    , "arn:aws:kms:us-west-2:915269476108:key/5a29fc3b-41b6-4f99-96ca-5e5d4a030724"
    ,"arn:aws:kms:us-west-2:915269476108:key/ba117447-5583-470b-a75f-442cb80ccbb8"
    ,"arn:aws:kms:us-west-2:915269476108:key/be7f4a66-c0d4-4234-a0d3-def6e9041294"]
const endpoint = "https://goerli.infura.io/v3/f178f39bf6804ae5bcc2a4ac7e0054a7";
const provider = new KmsProvider(endpoint, { keyIds: keyId });
const web3 = new Web3(provider);
// import { ThirdwebSDK } from "@thirdweb-dev/sdk";
// import { AwsKmsWallet } from "@thirdweb-dev/sdk/evm/wallets";


import { config } from "dotenv";

config();
// --------web3----------

// ----------slack---------

import bolt from "@slack/bolt"; 
const { App } = bolt;
import slackConfig from './slack-config.json' assert  {type:'json'};

// const slackConfig = require('./slack-config.json');
// ----------slack---------

// ----------KMS------------
import AWS from 'aws-sdk';
AWS.config.update({ region: 'us-west-2' });
// Create a KMS client
const kms = new AWS.KMS();


// ----------KMS------------

// ---------dynamo--------------
import { ConditionFilterSensitiveLog, ContinuousBackupsDescriptionFilterSensitiveLog, DynamoDBClient } from "@aws-sdk/client-dynamodb"; // ES6 import
import dynamo_command from "@aws-sdk/lib-dynamodb"; // ES6 import
// // Bare-bones DynamoDB Client
const client = new DynamoDBClient({});

const { DynamoDBDocumentClient, PutCommand,DeleteCommand, UpdateCommand, GetCommand } = dynamo_command

const ddbDocClient = DynamoDBDocumentClient.from(client);
// ----------dynamo--------------


// sendETH
async function transaction(from, to, value) {
        
    try{
        
        const accounts = await web3.eth.getAccounts();
        console.log("accounts", accounts);

        console.log("from", typeof(from), "to", typeof(to), "value", typeof(value))

            // 送金する

        const receipt = await web3.eth.sendTransaction({
            from: from,
            to : to,
            value: web3.utils.toWei(value, "ether"),
        });
        
        console.log(receipt);
        return console.log('success!!!')
        // console.log(userinfo);
    } catch (err) {
        console.log(err);
        throw err

    } 
}

async function BalanceToPoint(address) {

    // const provider = new KmsProvider(endpoint, { keyIds: keyId });
    // const web3 = new Web3(provider);

    // const accounts = await web3.eth.getAccounts();
    // console.log("accounts", accounts);

    var balance = await web3.eth.getBalance(address);
    console.log("balance",balance );
    var ethBalance = web3.utils.fromWei(balance, 'ether');
    console.log("ethbalance",ethBalance );

    var point = ethBalance * 100000
    console.log("point",point);
    return point
}


async function GetAddress(userId) {
    var params = {
        TableName: 'test',
        Key: {
            'user_id': userId,
        //   ':created_at': '1544752292'
        }
    }
    try {
        const userinfo = await ddbDocClient.send(
            new GetCommand(params)
        );
        const userAddress = userinfo['Item']['address']
        const userPoint = userinfo['Item']['point']
        // console.log(userinfo['Item']);
        // ['address']
        return [userAddress, userPoint]
        
    } catch (err) {
        console.log(err);
        return err;
    }

}

async function UpdateUserInfo(userId, userAddress, now) {
    var params = {
        TableName:'test',
        Key: {
            "user_id": userId
            },
        //   ProjectionExpression: "#r",
            ExpressionAttributeNames: { "#p": "point" , "#u": "update_date" },
            ExpressionAttributeValues: {
            ":p": await BalanceToPoint(userAddress),
            ":u": now.toISOString(),
            },
            UpdateExpression: "set #p = :p, #u = :u",
        };
    try {
        const userinfo = await ddbDocClient.send(
            new UpdateCommand(params)
        );
        console.log(userinfo);
        return 'success!';
        
    } catch (err) {
        console.log(err);
        throw err
    }
}

async function CreateKey(userId){
    // Define the key alias
    const key_alias = userId;

    // Define the key description
    const key_description = 'KMS for thankyou point';

    // Define the key parameters
    const key_params = {
        Description: key_description,
        KeyUsage: 'SIGN_VERIFY',
        KeySpec: 'ECC_SECG_P256K1',
        Policy:[ "arn:aws:iam::915269476108:role/MiyaoLambdaRole",
                "arn:aws:iam::915269476108:role/ohohoh-HelloWorldFunctionRole-C9P9VT5QY9HO"]
    };
    try {
        const userKeyinfo = await kms.createKey(key_params)
        console.log(userKeyinfo);
        return  kms.createAlias({
            AliasName: "alias/"+key_alias,
            TargetKeyId: data.KeyMetadata.KeyId
        });
        
    } catch (err) {
        console.log(err);
        throw err
    }
}

const app = new App({
    token: slackConfig.SLACK_BOT_TOKEN,
    signingSecret: slackConfig.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: slackConfig.SLACK_APP_TOKEN
});


const ChannelId = "Your slack channnel id";

// ウォレットの作成 
// チャンネルに入ったらテキストが出るようにしたい。動作未確認

app.command('/wallet', async({ ack, body, client, logger }) => {
    await ack();
    console.log(body)
    const user = body['user_id'];
    console.log(user)
    try{
        const result = await client.views.open({
            // 適切な trigger_id を受け取ってから 3 秒以内に渡す
            trigger_id: body.trigger_id,
            // view の値をペイロードに含む
            view: {
                "type": "modal",
                "callback_id": "view_first",
                "title": {
                    "type": "plain_text",
                    "text": "Welcome to the team🎉",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Walletを作成する",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `<@${user}>さん、初めまして！`
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": "ここでは、「ありがとうポイント」をためることができます。あなたがどれだけ周囲の役に立ったのかという指標となります。コツコツためていきましょう✨",
                            "emoji": true
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": "ありがとうポイントをためるために、あなた専用のウォレットが必要となります。さっそく作ってみましょう！",
                            "emoji": true
                        }
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "plain_text",
                                "text": "wallet作成成功の通知まで数秒かかります。"
                            }
                        ]
                    }
                ]}
            // text: `Welcome to the team, <@${event.user.id}>! 🎉 You can introduce yourself in this channel.`
        });
        logger.info(result);
    }catch (error) {
        logger.error(error);
    }
});


// ウォレット作成通知
app.view('view_first', async ({ ack, body, view, client, logger }) => {
    // モーダルでのデータ送信リクエストを確認
    await ack();
  
    // 入力値を使ってやりたいことをここで実装 - ここでは DB に保存して送信内容の確認を送っている
  
    // block_id: block_1 という input ブロック内で action_id: input_a の場合の入力
    // const val = ;
    // const reciever = view['state']['values']['users-select-block']['users-action-id']['selected_users'];
    const userId = body['user']['id'];
    const userName = body['user']['username'];
    let now = new Date();
    now.setTime(now.getTime() + 1000*60*60*9);// JSTに変換
    console.log(body);
    console.log(now);
  
     // ウォレットに 1 つ以上のアカウントを生成します。ウォレットがすでに存在する場合、それらは上書きされません。

    // KMSを用いたウォレットの作成
    // 秘密鍵の管理




    const accounts = await web3.eth.getAccounts();
    console.log("accounts", accounts);
    var from = accounts[0]
    var to = accounts[2]
    console.log("from",from, "to",to)


    // ウォレットに0.0001ETHをテストアカウントから送信する。
    await transaction(from, to, "0.001");


    // var address = await address();
    // ユーザーに対して送信するメッセージ
    // web3.eth.getAccounts().then(console.log);

    const point = await BalanceToPoint(to);
    

    
    // DB に保存
    var params = {
        TableName:'test',
        Item: {
          'user_id': userId,
          'user_name': userName,
          'address' : to,
          'point': point,
          'registration_date': now.toISOString(),
          'update_date': now.toISOString()
        }
      };
    // console.log(params)
    try {
        const userinfo = await ddbDocClient.send(
          new PutCommand(params)
        );
        // console.log(userinfo);
        if (userinfo) {
            // DB への保存が成功
            await client.chat.postMessage({
                channel: userId,
                text: "walletの作成に成功しました！"
                });
        }
    } catch (err) {
        console.log(err);
        return err;
    }
});

// ポイント付与画面
// なぜか全体チャンネルに投稿されない
// 上限決めて何個か並列にスタンプを並べるとそれごとのポイントを付与したい
// その他の絵文字を表示させたいー＞無理そう
app.command('/point', async({ ack, body, client, logger }) => {
    await ack();

    try{
        const result = await client.views.open({
            // 適切な trigger_id を受け取ってから 3 秒以内に渡す
            trigger_id: body.trigger_id,
            // view の値をペイロードに含む
            view: {
                "type": "modal",
                "callback_id": "view_point",
                "title": {
                    "type": "plain_text",
                    "text": "「ありがとう」を伝えてみよう",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Submit",
                    "emoji": true
                },
                "close": {
                    "type": "plain_text",
                    "text": "Cancel",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "input",
                        "block_id": "users-select-block",
                        "element": {
                            "type": "users_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "一人のみを選択できます"
                            },
                            "action_id": "users-action-id"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "感謝したい人"
                        }
                    },
                    {
                        "type": "section",
                        "block_id": "thanksContent",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*「ありがとう」を伝えたい内容*"
                        },
                        "accessory": {
                            "type": "checkboxes",
                            "options": [
                                {
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": "手伝ってくれた。"
                                    },
                                    "value": "value-0"
                                },
                                {
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": "共有してくれた。"
                                    },
                                    "value": "value-1"
                                },
                                {
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": "頑張ってくれた。"
                                    },
                                    "value": "value-2"
                                }
                            ],
                            "action_id": "checkboxes-action"
                        }
                    },
                    {
                        "type": "input",
                        "optional" : true,
                        "block_id": "thanksOther",
                        "element": {
                            "type": "plain_text_input",
                            "action_id": "plain_text_input-action",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "例：アドバイスしてくださって、大変助かりました！"
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "その他",
                            "emoji": true
                        }
                    },
                    {
                        "type": "section",
                        "block_id": "thanksPoint",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*ありがとうポイントを選んでください*"
                        },
                        "accessory": {
                            "type": "radio_buttons",
                            "options": [
                                {
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": ":heart:"
                                    },
                                    "value": "10"
                                },
                                {
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": ":heart::heart:"
                                    },
                                    "value": "20"
                                },
                                {
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": ":heart::heart::heart:"
                                    },
                                    "value": "30"
                                }
                            ],
                            "action_id": "radio_buttons-action"
                        }
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "plain_text",
                                "text": "「送信」を押したら、相手のDMに投稿されます。この処理は数秒かかります。"
                            }
                        ]
                    }
                ]
            }
        });
        logger.info(result);
    }catch (error) {
        logger.error(error);
    }
});

// モーダルでのデータ送信リクエストを処理します
// ポイント受信通知
app.view('view_point', async ({ ack, body, view, client, logger }) => {
    // モーダルでのデータ送信リクエストを確認
    await ack();
  
    // 入力値を使ってやりたいことをここで実装 - ここでは DB に保存して送信内容の確認を送っている
    let now = new Date();
    now.setTime(now.getTime() + 1000*60*60*9);// JSTに変換
    console.log(body);
    console.log(now);
    // const val = ;
    const reciever = view['state']['values']['users-select-block']['users-action-id']['selected_user']; 
    const sender = body['user']['id'];
    const thanksCheck = view['state']['values']['thanksContent']['checkboxes-action']['selected_options'];
    // [0]['text']['text']
    var thanksOther = view['state']['values']['thanksOther']['plain_text_input-action']['value'];
    const givePoint = view['state']['values']['thanksPoint']['radio_buttons-action']['selected_option']['value'];
    const stamp = view['state']['values']['thanksPoint']['radio_buttons-action']['selected_option']['text']['text'];
    console.log('thanksCheck',thanksCheck);
    console.log('thanksOther', thanksOther);
    console.log('point', givePoint);
    console.log('stamp', stamp);
  
    var thanksCheckList = [];
    for (var i=0; i<thanksCheck.length; i++){
        thanksCheckList += thanksCheck[i]['text']['text'];
    }
    console.log('thanksCheckList', thanksCheckList);
    
    if (thanksOther == null){
        thanksOther = '';
    }
    console.log('thanksOther', thanksOther);

    // アドレス情報の取得
     
    var [from ,_]= await GetAddress(sender);
    var [to, _] = await GetAddress(reciever);
    console.log("from",from ,"to", to)

    // point情報

    var value = givePoint * 0.00001
    console.log(value)

   

    var n = 4 ;	// 小数点第n位まで残す
    value = Math.floor( value * Math.pow( 10, n ) ) / Math.pow( 10, n ) ;
    console.log(value)
    

    

    await transaction(from, to, String(value));

    
    const recieversumPoint = Math.floor(await BalanceToPoint(to));
    const sendersumPoint = Math.floor(await BalanceToPoint(from));

    

    try {
        var userInfoS = await UpdateUserInfo(sender, from, now);
        var userInfoR = await UpdateUserInfo(reciever, to, now);
        // console.log(userInfoR)
        if (userInfoS && userInfoR == 'success!') {
            // DB への保存が成功
            await client.chat.postMessage({
                channel: reciever,
                mrkdwn : true,
                text: `<@${sender}>から${givePoint}ポイント付与されました！あなたの合計ポイントは${recieversumPoint}ポイントです。 :white_check_mark: ${thanksCheckList}${thanksOther}${stamp}`
              });
            await client.chat.postMessage({
                channel: sender,
                mrkdwn : true,
                text: `<@${reciever}>に${givePoint}ポイント付与しました！あなたの合計ポイントは${sendersumPoint}ポイントです。 `
              });
        }
    } catch (err) {
        console.log(err);
        return err;
    }
    
    // DMに送る
    console.log("sender:", sender);
    console.log("reciever:", reciever);

    
    // ユーザーにメッセージを送信
    // try {
    //   await client.chat.postMessage({
    //     channel: reciever,
    //     mrkdwn : true,
    //     text: `<@${sender}>から${point}ポイント付与されました！あなたの合計ポイントは(Dynamo.user.point)ポイントです。 >:white_check_mark: ${thanksCheckList}${thanksOther}${stamp}`
    //   });
    // }
    // catch (error) {
    //   logger.error(error);
    // }
  
  });

  


/*
// ポイント消費画面　
// ポイントの残高を確認したい
// ポイントの残高より交換したいポイントが多ければ、エラーを返したい。
app.command('/withdraw', async({ ack, body, client, logger }) => {
    await ack();

    try{
        const result = await client.views.open({
            // 適切な trigger_id を受け取ってから 3 秒以内に渡す
            trigger_id: body.trigger_id,
            // view の値をペイロードに含む
            view: {
                "type": "modal",
                "callback_id": "withdraw_point",
                "title": {
                    "type": "plain_text",
                    "text": "ポイントを使う",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Submit",
                    "emoji": true
                },
                "close": {
                    "type": "plain_text",
                    "text": "Cancel",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "あなたのポイント： *(Dynamo.user.point)pt* "
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "multi_static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "複数選ぶこともできます",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "もぐら：10pt",
                                        "emoji": true
                                    },
                                    "value": "value-0"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "りんご:30pt",
                                        "emoji": true
                                    },
                                    "value": "value-1"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "どんぐり:150pt",
                                        "emoji": true
                                    },
                                    "value": "value-2"
                                }
                            ],
                            "action_id": "multi_static_select-action"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "交換したいもの",
                            "emoji": true
                        }
                    }
                ]
            }
        });
        logger.info(result);
    }catch (error) {
        logger.error(error);
    }
});

// ポイント消費通知
app.view('withdraw_point', async ({ ack, body, view, client, logger }) => {
    // モーダルでのデータ送信リクエストを確認
    await ack();
  
    // 入力値を使ってやりたいことをここで実装 - ここでは DB に保存して送信内容の確認を送っている
  
    // block_id: block_1 という input ブロック内で action_id: input_a の場合の入力
    // const val = ;
    // const reciever = view['state']['values']['users-select-block']['users-action-id']['selected_users'];
    const user = body['user']['id'];
    // console.log(body)
  
  
    // ユーザーに対して送信するメッセージ
    // let msg = '';

    // // DB に保存
    // const results = await db.set(user.input, val);
    // if (results) {
    //     // DB への保存が成功
    //     msg = `<@${message.user}>から10ポイント付与されました！あなたの合計ポイントは(Dynamo.user.point)ポイントです。`;
    //   } else {
    //     msg = 'There was an error with your submission';
    //   }
    
    // DMに送る
    console.log("user:", user);
    
    // ユーザーにメッセージを送信
    try {
      await client.chat.postMessage({
        channel: user,
        text: `(Dynamo.contents.name)を取得しました！あなたの合計ポイントは(Dynamo.user.point)ポイントです。`
      });
    }
    catch (error) {
      logger.error(error);
    }
  
  });
  */

// ユーザー削除画面
// Dynamoからユーザーの登録情報を消し去りたい
app.command('/delete', async({ ack, body, client, logger }) => {
    await ack();
    console.log(body)
    const user = body['user_id'];
    console.log(user)
    try{
        const result = await client.views.open({
            // 適切な trigger_id を受け取ってから 3 秒以内に渡す
            trigger_id: body.trigger_id,
            // view の値をペイロードに含む
            view: {
                "type": "modal",
                "callback_id": "delete_user",
                "title": {
                    "type": "plain_text",
                    "text": "Delete Wallet",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Walletを削除する",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `あなたのwalletを削除します。  :warning:実行してしまうとこの操作は取り消すことができません。`
                        }
                    }
                ]}
            // text: `Welcome to the team, <@${event.user.id}>! 🎉 You can introduce yourself in this channel.`
        });
        logger.info(result);
    }catch (error) {
        logger.error(error);
    }
});


// ユーザー削除通知
app.view('delete_user', async ({ ack, body, view, client, logger }) => {
    // モーダルでのデータ送信リクエストを確認
    await ack();
  
    // DBから情報を取得し、元のアカウントに送金、DBからデータを削除する。
  
    const userId = body['user']['id'];
    // const user = body['user']['id'];
    
    // DBからaddressとpointを取得
    var [from, point] = await GetAddress(userId);
    console.log("from",from, "point", point)

    // userのアカウントを取得
    const accounts = await web3.eth.getAccounts();
    console.log("accounts", accounts);

    var to = accounts[0]

    console.log("from",from, "to",to)


    // ウォレットに0.0001ETHをテストアカウントから送信する。
    var balance = point * 0.00001
    console.log(balance)

     // ガス代の取得(公式にはweiと書いてあるが、たぶんgweiで記載されている。)
    // var gasPrice = await web3.eth.getGasPrice();
    // gasPrice = web3.utils.fromWei(String(gasPrice), "gwei");
    // console.log(gasPrice);

    // var gasLimit = 21000;
    // var GAS_gwei = gasPrice * gasLimit;
    // let GAS_eth = GAS_gwei * 0.000000001 ;
    // console.log("GAS",GAS_eth)


    // var value = balance - GAS_eth
    // console.log("value",value)

    var n = 10 ;	// 小数点第n位まで残す
    var value = Math.floor( balance * Math.pow( 10, n ) ) / Math.pow( 10, n ) ;
    console.log("value",value)

    // 取引
    await transaction(from, to, String(value));

    var balance = await web3.eth.getBalance(from);
    var ethBalance = web3.utils.fromWei(balance, 'ether');
    console.log("ethbalance",ethBalance );




    // ユーザーに対して送信するメッセージ

    var params = {
        TableName:'test',
        Key: {
            'user_id': userId,
        }
        };
    try {
        const userinfo = await ddbDocClient.send(
            new DeleteCommand(params)
        );
        // console.log(userinfo);
        if (userinfo) {
            // DB への保存が成功
            await client.chat.postMessage({
                channel: userId,
                mrkdwn : true,
                text: `<@${userId}>のwalletを削除しました。`
                });
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
    
    // DMに送る
    
    // ユーザーにメッセージを送信
    // try {
    //   await client.chat.postMessage({
    //     channel: user,
    //     text: `削除しました。`
    //   });
    // }
    // catch (error) {
    //   logger.error(error);
    // }
  
  });

(async () => {
    // app起動
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();
