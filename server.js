const express = require('express');

const getBalanceAccount = require('./ethjs/getBalanceAccount');
const DAI = require('./test/DAI');
const daiToZkDai = require('./test/daiToZk');


const app = express()

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/', (req,res) => {
    res.send('Saru')
})

app.get('/ethBalance', (req,res) => {
    getBalanceAccount.getBalance(req.query.accountIndex, (bal) => {
        res.send(bal);
    })
})
app.get('/ethBalanceDai', (req,res) => {
    DAI.getBalance(req.query.accountIndex, (bal) => {
        res.send(bal);
    })
})

app.get('/ethToDai', (req,res) => {
    DAI.mintDAI(req.query.amount, (txHash) => {
        res.send(txHash);
    })
})

app.get('/ethToDai2', (req,res) => {
    DAI.mintDAI2(req.query.amount, (txHash) => {
        res.send(txHash);
    })
})

app.get('/daiToZkDai', (req,res) => {
    daiToZkDai.convertToZk(req.query.amount, (note) => {
        res.send(note);
    })
})
app.get('/daiToZkDai2', (req,res) => {
    daiToZkDai.convertToZk3(req.query.amount, (note) => {
        res.send(note);
    })
})
app.get('/ZkDaiTock', (req,res) => {
    daiToZkDai.convertToZk2(req.query.amount, (note) => {
        res.send(note);
    })
})

app.get('/ZkDaiTock2', (req,res) => {
    daiToZkDai.convertToZk4(req.query.amount, (note) => {
        res.send(note);
    })
})

app.get('/addDai', (req,res) => {
    DAI.mintDAI(req.query.amount, (tx) => {
        res.send(tx);
    })
})
app.get('/recoverDAI', (req,res) => {
    DAI.minDAI(req.query.amount, (tx) => {
        res.send(tx);
    })
})
app.listen(3000, () => {
    console.log(`Server Started at 3000`);
})