let roles = 0;
let stages = 0;
let contractCode = '';

let rolesArray = [];
let rolesAddressMappingArray = [];

let stageRoleMappingArray = [];
let stagesArray = [];
let contractFCode = '';

let walletAddress = [];


var config = {
    apiKey: "AIzaSyD63ZSQxaJ3RfBGbDLxu2Yl6EeYYw2KbfE",
    authDomain: "vesablockchain.firebaseapp.com",
    databaseURL: "https://vesablockchain.firebaseio.com",
    projectId: "vesablockchain",
    storageBucket: "vesablockchain.appspot.com",
    messagingSenderId: "865109885347"
};
firebase.initializeApp(config);
firebase.database().ref('wallets').on('value', (snapshot) => {
    snapshot.forEach(snap => {
        walletAddress.push(snap.val().address);
    })
})


//         <div class="col-6"><input type="text" id="role${roles}#address" placeholder="Account Address" class="form-control"></div>
function addRole() {
    let walletOption = '';
    roles += 1;

    for(let i=0; i<walletAddress.length;i++){
        walletOption += `<option value="${walletAddress[i]}">${walletAddress[i]}</option>`
    }
    document.getElementById('here').insertAdjacentHTML('beforeend',
    `
    <div class="row form-group">
        <div class="col-6"><input type="text" id="role${roles}#name" placeholder="Role" class="form-control"></div>
        <div class="col-12 col-md-6">
                <select id="role${roles}#address" class="form-control">
                    <option>Account Address</option>
                    ${walletOption}
                </select>
            </div> 
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
        swal({
            title: "Supply Chain Created",
            text: `Contract Address: ${JSON.parse(res).contractAddress}
                    Transaction Hash:${JSON.parse(res).txID}`,
            icon: "success",
            button: "Alrighty",
        });
    //     document.getElementById('resHere').innerHTML += `<div class="sufee-alert alert with-close alert-success alert-dismissible fade show">
    //     <span class="badge badge-pill badge-success">Success: Deployment Completed</span><br>
    //     <b>Contract Address:</b> ${JSON.parse(res).contractAddress}
    //     <br>
    //     <b>Transaction Hash:</b> ${JSON.parse(res).txID}
    // </div>`
        contractFirebase(JSON.parse(res).contractAddress, JSON.parse(res).abi, JSON.parse(res).txID);
        
    })
}

function contractFirebase(contractAddress, contractABI, txHash){
    // Initialize Firebase
    firebase.database().ref(`/tx`).push({
        txHash: txHash
    })
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
            document.getElementById('supplyChain').innerHTML += `<br>Supply Chain Name: ${snap.val().name}`;
            document.getElementById('supplyChain').innerHTML += `<br>Product Count: ${snap.val().productCount}<br>`
            document.getElementById('supplyChain').innerHTML += `<button id="${snap.key}" onclick="addProductUI(this.id)">Create New Product</button><br>`;
            document.getElementById('supplyChain').innerHTML += `<div id="${snap.key}#div"></div>`;
            let count = 0;
            firebase.database().ref('/supplychain/'+snap.key+'/products').once('value').then(function(prodSnap) {
                prodSnap.forEach((proSnap) => {
                    count += 1;
                    document.getElementById(snap.key + '#div').innerHTML += `<br>Product ${count}: ${proSnap.val().productID} <button id="${snap.key}#${proSnap.key}" onclick="getCurStatus(this.id)">Status</button>`;
                })
            })
        })
      });
}
//getSupplyChain();

function addProductUI(firebaseKey){
    document.getElementById(firebaseKey).insertAdjacentHTML('afterend',`<div><input type="text" id="pIDText" placeholder="Enter Product ID" /><button onclick="addProduct('${firebaseKey}')">Add Product</button></div>`);
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
            contractFirebaseProduct(JSON.parse(res).contractAddress, 
            JSON.parse(res).abi, 
            firebaseKey, 
            snapshot.val().productCount,
            resCodeEncoded,
            pID);
        })
    })
}

function contractFirebaseProduct(contractAddress, contractABI, firebaseKey, productCount,resCodeEncoded, pID){
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
    firebase.database().ref(`supplychain/${keys[0]}/products/${keys[1]}`).once('value').then(function(snapshot) {
        // console.log(snapshot.val().productID);
        let url = `http://localhost:3000/getCurStatus?contractAddress=${snapshot.val().contractAddress}&contractABI=${snapshot.val().contractABI}`;
        doCall(url, (res)=>{
            console.log(res);
        })
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