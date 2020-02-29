let balance = 0;
let url = "http://127.0.0.1:3000";

var firebaseConfig = {
    apiKey: "AIzaSyDHwQaL6e7qZB3VyLjrP3ubvjpRSiSttXw",
    authDomain: "zkcompound.firebaseapp.com",
    databaseURL: "https://zkcompound.firebaseio.com",
    projectId: "zkcompound",
    storageBucket: "zkcompound.appspot.com",
    messagingSenderId: "754864470993",
    appId: "1:754864470993:web:f58e9101a1d21a27d77ef0",
    measurementId: "G-ST7HQ6D56C"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

function getBal(){
    theUrl = "http://127.0.0.1:3000/ethBalance?accountIndex=1"
    doCall(theUrl, (res) => {
        document.getElementById('ethBalance').innerHTML = `<span class="count">${(res / 1000000000000000000).toFixed(8)}</span>`;
        document.getElementById('usdBalance').innerHTML = ((res * 200) / 100000000000000000000).toFixed(2);
    })
}
function getBalDai(){
    theUrl = "http://127.0.0.1:3000/ethBalanceDai?accountIndex=1"
    doCall(theUrl, (res) => {
        let a = res.toString();
        document.getElementById('daiBal').innerHTML = `<span class="count">${a.slice(a.length - 6)}</span>`;
    })
}

function populateDAI(){
    let ethVal = document.getElementById('ethToDaiEth').value;
    let daiVal = ethVal * 200;
    document.getElementById('ethToDaiDai').value = daiVal;
}

function conEthToDai(){
    let daiVal = document.getElementById('ethToDaiDai').value;
    doCall(`${url}/ethToDai?amount=${daiVal}`, (res) => {
        console.log(res);
    })
}

function conDaiToZk() {
    let daiVal = document.getElementById('daiToZkDaiDai').value;
    doCall(`${url}/daiToZkDai?amount=${daiVal}`, (res) => {
        firebase.database().ref('daiToZkDai').push({
            note: (res),
            value: daiVal,
            spent: 0
        });
    })
}
function zktoc(amount) {
    //let daiVal = document.getElementById('daiToZkDaiDai').value;
    doCall(`${url}/ZkDaiTock?amount=${amount}`, (res) => {
        firebase.database().ref('czk').push({
            note: (res),
            value: amount,
            withdraw: 0
        });
    })
}

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
getBal();
getBalDai();

function zkDAIExp(){
    var starCountRef = firebase.database().ref('daiToZkDai');
    starCountRef.on('value', function(snapshot) {
        snapshot.forEach(snap => {
            // console.log(JSON.parse(snap.val().note)[0])
            document.getElementById('notifiactionManagerzkDai').innerHTML += `   <li>
                    <div class="msg-received msg-container">
                            <div class="avatar">
                                <img src="images/dai.JPG" alt="">
                                <!-- <div class="send-time">12.11 pm</div> -->
                            </div>
                            <div class="msg-box">
                                <div class="inner-box">
                                    <div class="name">
                                        <b>
                                        Note Hash: </b>${JSON.parse(snap.val().note)[0].noteHash}
                                    </div>
                                    <div class="meg" style="overflow:scroll; height:100px; width: 800px">
                                        <b>Value</b> : <button id="${snap.val().value}" class="btn btn-primary m-l-10 m-b-10" onclick="alert(this.id)">View</button><br>
                                        <br>
                                        <b>Status</b> : ${snap.val().spent == 0 ? `<span style="color: white;
                                        padding: 10px;
                                        text-transform: uppercase;
                                        font-weight: normal;
                                        background: #00c292;
                                    " class="badge badge-complete">Unspent</span>` : `<span style="color: white;
                                    padding: 10px;
                                    text-transform: uppercase;
                                    font-weight: normal;
                                    background: #fb9678;
                                " class="badge badge-pending">Spent</span>`}<br>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <!-- /.msg-sent -->
                </li>`;   
        });
    });
}
zkDAIExp();

function lend(){
    let cnf = false;
    let val=0;
    var starCountRef = firebase.database().ref('daiToZkDai');
    starCountRef.on('value', function(snapshot) {
        snapshot.forEach(snap => {
            if(JSON.parse(snap.val().note)[0].noteHash == document.getElementById('lendHash').value &&
            snap.val().spent == 0){
                cnf = true;
                val = snap.val().value;
                var starCountRef2 = firebase.database().ref('daiToZkDai/'+snap.key);
                starCountRef2.update({
                    spent: 1
                })
            }
        });
    });
    if(cnf){
        alert('Done')
        zktoc(val);
    }else{
        alert('Already Spent')
    }
}
function czkDAIExp(){
    var starCountRef = firebase.database().ref('czk');
    starCountRef.on('value', function(snapshot) {
        snapshot.forEach(snap => {
            // console.log(JSON.parse(snap.val().note)[0])
            document.getElementById('notifiactionManagercZkDai').innerHTML += `   <li>
                    <div class="msg-received msg-container">
                            <div class="avatar">
                                <img src="images/cdai.JPG" alt="">
                                <!-- <div class="send-time">12.11 pm</div> -->
                            </div>
                            <div class="msg-box">
                                <div class="inner-box">
                                    <div class="name">
                                        <b>
                                        Note Hash: </b>${JSON.parse(snap.val().note)[0].noteHash}
                                    </div>
                                    <div class="meg" style="overflow:scroll; height:100px; width: 800px">
                                        <b>Value</b> : <button id="${snap.val().value}" class="btn btn-primary m-l-10 m-b-10" onclick="alert(this.id)">View</button><br>
                                        <br>
                                        <b>Withdraw</b> : ${snap.val().withdraw == 0 ? `<span style="color: white;
                                        padding: 10px;
                                        text-transform: uppercase;
                                        font-weight: normal;
                                        background: #00c292;
                                    " class="badge badge-complete" id="${snap.key}#${snap.val().value}" onclick="withdraw(this.id)">Unspent</span>` : `<span style="color: white;
                                    padding: 10px;
                                    text-transform: uppercase;
                                    font-weight: normal;
                                    background: #fb9678;
                                " class="badge badge-pending">Spent</span>`}<br>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <!-- /.msg-sent -->
                </li>`;   
        });
    });
}
czkDAIExp();

function withdraw(key){
    let keyD = key.split('#');
    let value = keyD[1];
    doCall(`${url}/addDai?amount=${value}`, (res) => {
        firebase.database().ref('czk/'+keyD[0]).update({
            withdraw: 1
        });
    })
}