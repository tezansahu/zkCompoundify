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

function addRole() {
    roles += 1;
    document.getElementById('here').insertAdjacentHTML('beforeend',
    `
    <div class="row form-group">
        <div class="col-6"><input type="text" id="role${roles}#name" placeholder="Role" class="form-control"></div>
        <div class="col-6"><input type="text" id="role${roles}#address" placeholder="Account Address" class="form-control"></div>
    </div>`);
}

function roleComplete(){
    for(let i=1;i<=roles;i++){
        console.log(document.getElementById(`role${i}#name`).value);
        rolesArray.push(document.getElementById(`role${i}#name`).value);
        rolesAddressMappingArray.push({role: document.getElementById(`role${i}#name`).value, address: document.getElementById(`role${i}#address`).value})
    }
}


function addStage(){
    stages += 1;
    let options = '';
    for(let i=0; i<rolesArray.length;i++){
        options += `<option value="${rolesArray[i]}">${rolesArray[i]}</option>`
    }
    document.getElementById('hereStage').insertAdjacentHTML('beforeend',
    `<div class="row form-group">
    <div class="col-6"><input type="text" id="stage${stages}#name" placeholder="Stage" class="form-control"></div> 
    <div class="col-12 col-md-6">
                <select id="roleList#${stages}" class="form-control">
                    <option>Select Signer</option>
                    ${options}
                </select>
            </div> </div>`);
}

function stageComplete(){
    for(let i=1;i<=stages;i++){
        console.log(document.getElementById(`stage${i}#name`).value);
        stagesArray.push(document.getElementById(`stage${i}#name`).value);
        let selector = document.getElementById(`roleList#${i}`);
        console.log(selector[selector.selectedIndex].value);
        stageRoleMappingArray.push({stage: document.getElementById(`stage${i}#name`).value, signer: selector[selector.selectedIndex].value})
    }
}

function showContract(){
    let createRoles ='';
    let createStages = '';
    let contractModifiers = '';
    let getStage = '';
    let allFunctions = '';
    for(let i=1;i<=roles;i++){
        createRoles += 'address public ' + `${document.getElementById(`role${i}#name`).value}` + '=' + `${document.getElementById(`role${i}#address`).value}` + ';';
        contractModifiers += `modifier is${document.getElementById(`role${i}#name`).value}(){
            require(msg.sender == ${document.getElementById(`role${i}#name`).value});
            _;
        } `
    }
    contractCode += `
    pragma solidity ^0.5.0;

    contract SupplyChain{
        ${createRoles}
    }`;
    for(let i=0;i<stagesArray.length;i++){
        if((i+1) == stagesArray.length){
            createStages += `${stagesArray[i]}`
        }else{
            createStages += `${stagesArray[i]},`
        }
        getStage += `if(uint(stage) == ${i}){
            return ("${stagesArray[i]}");
        } `;
        allFunctions += `function ${stagesArray[i]}()
        atStage(Stages.${stagesArray[i]})
        is${stageRoleMappingArray[i].signer}
        transitionNext
        public {}` 
    }

    document.getElementById('contractSpace').innerHTML = `
        pragma solidity ^0.5.0;

        contract SupplyChain{
            uint public productID = 0;
            ${createRoles}
            enum Stages{
                ${createStages},
                Done
            }
            Stages public stage;

            modifier atStage(Stages _stage){
                require(stage == _stage);
                _;
            }

            modifier transitionNext() {
                _;
                stage = Stages(uint(stage) + 1);
            }

            ${contractModifiers}

            function getStage() public view returns(string memory){
                ${getStage}
                if(uint(stage) == ${stages}){
                    return ("Done");
                }
            }
            
            ${allFunctions}
        }
    `;
    contractFCode = `
    pragma solidity ^0.5.0;

    contract SupplyChain{
        uint public productID = 0;
        ${createRoles}
        enum Stages{
            ${createStages},
            Done
        }
        Stages public stage;

        modifier atStage(Stages _stage){
            require(stage == _stage);
            _;
        }

        modifier transitionNext() {
            _;
            stage = Stages(uint(stage) + 1);
        }

        ${contractModifiers}

        function getStage() public view returns(string memory){
            ${getStage}
            if(uint(stage) == ${stages}){
                return ("Done");
            }
        }
        
        ${allFunctions}
    }
`;
        var editor = ace.edit("editor");
        editor.renderer.setShowGutter(true);
        editor.getSession().setUseWorker(false);
        editor.setTheme("ace/theme/monokai");
        editor.session.setMode("ace/mode/javascript");
        let data = js_beautify(contractFCode);
        editor.insert(data);
}

function deployContract(){
    let fCode = encodeURIComponent(contractFCode);
    let url = `http://localhost:3000/deployContract?code=${fCode}`;
    doCall(url, (res)=>{
        console.log(JSON.parse(res).contractAddress);
        console.log(JSON.parse(res).abi)
        console.log(JSON.parse(res).txID);
        document.getElementById('resHere').innerHTML += `<div class="sufee-alert alert with-close alert-success alert-dismissible fade show">
        <span class="badge badge-pill badge-success">Success: Deployment Completed</span><br>
        <b>Contract Address:</b> ${JSON.parse(res).contractAddress}
        <br>
        <b>Transaction Hash:</b> ${JSON.parse(res).txID}
    </div>`
        contractFirebase(JSON.parse(res).contractAddress, JSON.parse(res).abi);
        
    })
}

function contractFirebase(contractAddress, contractABI){
    // Initialize Firebase
  firebase.database().ref('supplychain/').push({
    name: document.getElementById('supplyChainName').value,
    contractAddress: contractAddress,
    contractABI: JSON.stringify(contractABI),
    contractCode: encodeURIComponent(contractFCode),
    productID: 0,
    productCount: 0,
    roles: JSON.stringify(rolesArray),
    stages: JSON.stringify(stagesArray),
    roleMapping: JSON.stringify(rolesAddressMappingArray),
    stageMapping: JSON.stringify(stageRoleMappingArray)
  });
}

function getSupplyChain(){
    firebase.database().ref('/supplychain/').once('value').then(function(snapshot) {
        snapshot.forEach((snap) => {
            document.getElementById('mainWindow2').innerHTML += `<div class="col-md-12">
                <div class="card border border-primary">
                    <div class="card-header">
                        <strong class="card-title">${snap.val().name}</strong>
                    </div>
                    <div class="card-body">
                    <button type="button" class="btn btn-warning m-l-10 m-b-10">Product Count <span class="badge badge-light">${snap.val().productCount}</span></button>
                    <button type="button" class="btn btn-outline-success" id="${snap.key}" onclick="addProductUI(this.id)"><i class="fa fa-magic"></i>&nbsp; Create New Product</button>
                    <div id="${snap.key}#div"></div>
                    <div id="${snap.key}#menu"></div>
                    <div id="${snap.key}qr"></div>
                    </div>
                </div>
            </div>`; 
            // document.getElementById('prodCardBody').innerHTML += `<br>Supply Chain Name: ${snap.val().name}`;
            // document.getElementById('prodCardBody').innerHTML += `<br>Product Count: ${snap.val().productCount}<br>`
            // document.getElementById('prodCardBody').innerHTML += `<button id="${snap.key}" onclick="addProductUI(this.id)">Create New Product</button><br>`;
            // document.getElementById('prodCardBody').innerHTML += `<div id="${snap.key}#div"></div>`;
            let count = 0;
            let tableValue = '';
            firebase.database().ref('/supplychain/'+snap.key+'/products').once('value').then(function(prodSnap) {
                prodSnap.forEach((proSnap) => {
                    count += 1;
                    if(!proSnap.val().reportMsg){
                        tableValue += `<tr>
                            <td class="serial">${count}.</td>
                            <td> ${proSnap.val().productID} </td>
                            <td>  <span class="name">${proSnap.val().contractAddress}</span> </td>
                            <td> <span class="product">${proSnap.val().currentStage}</span> </td>
                            <td>
                                <button id="${snap.key}#${proSnap.key}" onclick="getCurStatus(this.id)" type="button" class="btn btn-outline-success btn-sm">Status</button>
                            </td>
                            <td>
                                <button type="button" class="btn btn-outline-success" id="${snap.key}#${proSnap.key}#qr"  onclick="getQR(this.id)"><i class="fa fa-qrcode"></i>&nbsp; Show QR Code</button>
                            </td>
                        </tr>`;
                    }else{
                        tableValue += `<tr>
                            <td class="serial">${count}.</td>
                            <td> ${proSnap.val().productID}</td>
                            <td>  <span class="name">${proSnap.val().contractAddress}</span> <span class="badge badge-danger"><i class="fa fa-bug"></i> Reported</span>  </td>
                            <td> <span class="product">${proSnap.val().currentStage}</span> </td>
                            <td>
                                <button id="${snap.key}#${proSnap.key}" onclick="showReport(this.id)" type="button" class="btn btn-outline-success btn-sm">Recall Report</button>
                            </td>
                            <td>
                                <button type="button" class="btn btn-outline-success" id="${snap.key}#${proSnap.key}#qr"  onclick="getQR(this.id)"><i class="fa fa-qrcode"></i>&nbsp; Show QR Code</button>
                            </td>
                        </tr>`;
                    }
                    
                    //document.getElementById(snap.key + '#div').innerHTML += `<br>Product ${count}: ${proSnap.val().productID} <button id="${snap.key}#${proSnap.key}" onclick="getCurStatus(this.id)">Status</button>`;
                    
                })
                document.getElementById(snap.key + '#div').innerHTML += `<div style="margin-top: 20px" class="col-lg-12">
                <div class="card">
                    <div class="card-header">
                        <strong class="card-title">Product Table</strong>
                    </div>
                    <div class="table-stats order-table ov-h">
                        <table class="table ">
                            <thead>
                                <tr>
                                    <th class="serial">#</th>
                                    <th>ID</th>
                                    <th>Contract Address</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th>Show QR Code</th>

                                </tr>
                            </thead>
                            <tbody>
                                ${tableValue}
                            </tbody>
                        </table>
                    </div> <!-- /.table-stats -->
                </div>
            </div>`;
            })
        })
      });
}
getSupplyChain();
function getQR(id){
    let keys = id.split('#');
    let qrContent = keys[0] + '#' + keys[1];
    console.log(qrContent);
    let encodedQRData = encodeURIComponent(qrContent);
    document.getElementById('qrHere').innerHTML = `<img id='qrCode' 
    src="https://api.qrserver.com/v1/create-qr-code/?data=${encodedQRData}&amp;size=100x100" 
    alt="" 
    title="${encodedQRData}" 
    width="200" 
    height="200" /><br><br><button type="button" style="width: 200px" class="btn btn-outline-success" onclick="alert('Printing...')"><i class="fa fa-print"></i>&nbsp; Print</button>`;
    var modal = document.getElementById('myModal');
    modal.style.display = "block";
    window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
    }
}
function addProductUI(firebaseKey){
    document.getElementById(firebaseKey).insertAdjacentHTML('afterend',`<div style="margin-top: 10px">
    <input id="pIDText" placeholder="Enter Product ID" type="text" class="form-group form-control" aria-required="true" aria-invalid="false" />
    <button type="button" class="form-group btn btn-outline-success" onclick="addProduct('${firebaseKey}')""><i class="fa fa-plus-square"></i>&nbsp; Add Product</button>
    </div>`);
}
function addProduct(firebaseKey){
    pID = document.getElementById('pIDText').value;
    firebase.database().ref(`/supplychain/${firebaseKey}`).once('value').then((snapshot)=>{
        let contractCode = decodeURIComponent(snapshot.val().contractCode);
        let resCode = contractCode.replace('uint public productID = 0',`uint public productID = ${pID}`);
        let resCodeEncoded = encodeURIComponent(resCode);
        let url = `http://localhost:3000/deployContract?code=${resCodeEncoded}`;
        doCall(url, (res)=>{
            console.log(JSON.parse(res).contractAddress);
            console.log(JSON.parse(res).abi)
            console.log(JSON.parse(res).txID);
            swal({
                title: "Product Created",
                text: `Contract Address: ${JSON.parse(res).contractAddress}`,
                icon: "success",
                button: "Alrighty",
              });
            contractFirebaseProduct(JSON.parse(res).contractAddress, 
            JSON.parse(res).abi, 
            firebaseKey, 
            snapshot.val().productCount,
            resCodeEncoded,
            pID,
            JSON.parse(res).txID);
        })
    })
}

function contractFirebaseProduct(contractAddress, contractABI, firebaseKey, productCount,resCodeEncoded, pID, txHash){
    firebase.database().ref(`/tx`).push({
        txHash: txHash
    })
    firebase.database().ref(`supplychain/`+ firebaseKey).update({
        productCount: productCount + 1
    });
    firebase.database().ref(`supplychain/${firebaseKey}/products`).push({
        contractCode: resCodeEncoded,
        productID: pID,
        contractAddress: contractAddress,
        contractABI: JSON.stringify(contractABI),
        currentStage: 0
    })
}

function getCurStatus(id){
    let keys = id.split('#');
    let stagesArray;
    document.getElementById(keys[0] + '#menu').innerHTML = '';
    firebase.database().ref(`supplychain/${keys[0]}`).once('value').then(function(snappy) {
        // console.log(JSON.parse(snappy.val().stages).length);
        stagesArray = JSON.parse(snappy.val().stages);
        console.log(stagesArray);
        firebase.database().ref(`supplychain/${keys[0]}/products/${keys[1]}`).once('value').then(function(snapshot) {
            // console.log(snapshot.val().productID);
            let url = `http://localhost:3000/getCurStatus?contractAddress=${snapshot.val().contractAddress}&contractABI=${snapshot.val().contractABI}`;
            doCall(url, (res)=>{
                let stagesUI ='';
                console.log(res);
                if(stagesArray.indexOf(`${res}`) > -1){
                    console.log(stagesArray.indexOf(`${res}`))
                    for(let i=0; i<stagesArray.length; i++){
                        if(i <= stagesArray.indexOf(`${res}`)){
                            stagesUI += `<li data-step ="${i}" class="active">${stagesArray[i]}</li>`
                        }else{
                            stagesUI += `<li data-step ="${i}">${stagesArray[i]}</li>`
                        }
                    }
                    stagesUI += `<li data-step="${stagesArray.length}">Done</li>`
                    document.getElementById(keys[0] + '#menu').innerHTML = `<div class="row">                                      
                    <section class="col-xlg-4">
                        <ul class="progress">
                        ${stagesUI}
                        </ul>
                    </section>
                </div>`;
                }else{
                    console.log(`Completed`);
                    for(let i=0; i<stagesArray.length; i++){
                        stagesUI += `<li data-step ="${i}" class="active">${stagesArray[i]}</li>`
                    }
                    stagesUI += `<li data-step="${stagesArray.length}" class="active">Done</li>`
                    document.getElementById(keys[0] + '#menu').innerHTML = `<div class="row">                                      
                    <section class="col-xlg-4">
                        <ul class="progress">
                        ${stagesUI}
                        </ul>
                    </section>
                </div>`;
                }
            })
        })
    })
    
}

function showReport(id){
    let keys = id.split('#');
    let stagesArray;
    document.getElementById(keys[0] + '#menu').innerHTML = '';
    firebase.database().ref(`supplychain/${keys[0]}`).once('value').then(function(snappy) {
        // console.log(JSON.parse(snappy.val().stages).length);
        stagesArray = JSON.parse(snappy.val().stages);
        console.log(stagesArray);
        firebase.database().ref(`supplychain/${keys[0]}/products/${keys[1]}`).once('value').then(function(snapshot) {
            // console.log(snapshot.val().productID);
            let url = `http://localhost:3000/getCurStatus?contractAddress=${snapshot.val().contractAddress}&contractABI=${snapshot.val().contractABI}`;
            doCall(url, (res)=>{
                let stagesUI ='';
                console.log(res);
                if(stagesArray.indexOf(`${res}`) > -1){
                    console.log(stagesArray.indexOf(`${res}`))
                    for(let i=0; i<stagesArray.length; i++){
                        if(i <= stagesArray.indexOf(`${res}`)){
                            stagesUI += `<li data-step ="${i}" class="active">${stagesArray[i]}</li>`
                        }else{
                            stagesUI += `<li data-step ="${i}">${stagesArray[i]}</li>`
                        }
                    }
                    stagesUI += `<li data-step="${stagesArray.length}">Done</li>`
                    document.getElementById(keys[0] + '#menu').innerHTML += `<div class="row">                                      
                    <section class="col-xlg-4">
                        <ul class="progress">
                        ${stagesUI}
                        </ul>
                    </section>
                </div>`;
                }else{
                    console.log(`Completed`);
                    for(let i=0; i<stagesArray.length; i++){
                        stagesUI += `<li data-step ="${i}" class="active">${stagesArray[i]}</li>`
                    }
                    stagesUI += `<li data-step="${stagesArray.length}" class="active">Done</li>`
                    document.getElementById(keys[0] + '#menu').innerHTML += `<div class="row">                                      
                    <section class="col-xlg-4">
                        <ul class="progress">
                        ${stagesUI}
                        </ul>
                    </section>
                </div>`;
                }
            })
        })
    })
    firebase.database().ref(`supplychain/${keys[0]}/products/${keys[1]}`).once('value').then(function(snapshot) {
        document.getElementById(keys[0] + '#menu').innerHTML += `<div class="col-md-4">
        <div class="card bg-danger">
            <div class="card-body">
                <blockquote class="blockquote mb-0">
                    <p class="text-light"><b>Timestamp</b>: ${snapshot.val().reportMsg.timestamp}</p>
                    <p class="text-light"><b>Reporter</b>: ${snapshot.val().reportMsg.signer}</p>
                    <p class="text-light"><b>Report Details</b>: ${snapshot.val().reportMsg.msg}</p>
                    
                </blockquote>
            </div>
        </div>
    </div>`;        
    })
}
//helper functions

function getRoleAddress(role){
    let roleF = rolesAddressMappingArray.find((ele)=>{
        return ele.role == role;
    })
    console.log(roleF);
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