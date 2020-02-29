let roles = 1;
let stages = 0;
let contractCode = '';

let rolesArray = [];
let rolesAddressMappingArray = [];

let stageRoleMappingArray = [];
let stagesArray = [];
let contractFCode = '';

var config = {
    apiKey: "AIzaSyD63ZSQxaJ3RfBGbDLxu2Yl6EeYYw2KbfE",
    authDomain: "vesablockchain.firebaseapp.com",
    databaseURL: "https://vesablockchain.firebaseio.com",
    projectId: "vesablockchain",
    storageBucket: "vesablockchain.appspot.com",
    messagingSenderId: "865109885347"
};
firebase.initializeApp(config);


function txExp(){
    firebase.database().ref('/tx').once('value').then(function(snapshot) {
        snapshot.forEach(snap => {
            console.log(snap.val().txHash);
            let url = `http://localhost:3000/getTxReceipt?txHash=${snap.val().txHash}`;
            doCall(url, (res) => {
                console.log(res);
                if(res){
                    let tx = JSON.parse(res);
                    document.getElementById('notifiactionManager').innerHTML += `   <li>
                    <div class="msg-received msg-container">
                            <div class="avatar">
                                <img src="images/tezan.jpg" alt="">
                                <!-- <div class="send-time">12.11 pm</div> -->
                            </div>
                            <div class="msg-box">
                                <div class="inner-box">
                                    <div class="name">
                                        <b>
                                        Transaction Hash: </b>${snap.val().txHash}
                                    </div>
                                    <div class="meg" style="overflow:scroll; height:100px; width: 800px">
                                        <b>Block Hash</b> : ${tx.blockHash}<br>
                                        <b>Block Number</b> : ${tx.blockNumber}<br>
                                        <b>Nonce</b> : ${tx.nonce}<br>
                                        <b>Gas Used</b> : ${tx.gas}<br>
                                        <b>Gas Price</b> : ${tx.gasPrice}<br>
                                        <b>From</b> : ${tx.from}<br>
                                        <b>To</b> : ${tx.to}<br>
                                        <b>Input Data</b> : ${tx.input}<br>
    
                                        </div>
                                </div>
                            </div>
                        </div>
                    <!-- /.msg-sent -->
                </li>`;   
                }
            })
        })
    })
}
txExp();
//helper functions

function doCall(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}