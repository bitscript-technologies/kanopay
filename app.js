require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');
const argon2 = require('argon2');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Partner = require('./models/Partner');
const GLOBE_APP_KEY = process.env.GLOBE_APP_KEY;
const GLOBE_APP_SECRET= process.env.GLOBE_APP_SECRET;
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

app.use(require('cors')());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    return res.send("KaioPay API Server");
});

app.get('/redirect', (req, res) => {
    let access_token = req.query.access_token;
    let subscriber_number = req.query.subscriber_number;
    User.createUser(subscriber_number, access_token);
    axios.post(`https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/3855/requests?access_token=${access_token}`, {
        address: subscriber_number,
        message: "Welcome to KanoPay: Press 1 for English o 2 para sa Tagalog."
    });
    return res.send();
});

app.post('/sms', (req, res) => {
    let num = req.body.inboundSMSMessageList.inboundSMSMessage[0].senderAddress.split("+63")[1];
    require('./fn')(req.body.inboundSMSMessageList.inboundSMSMessage[0].message, num, msg => {
        User.getUser(num, (err, user) => {
            console.log(num, msg);
            axios.post(`https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/3855/requests?access_token=${user.access_token}`, {
                address: num,
                message: msg
            });
        });
    });
    return res.send();
});

app.get('/:cell', (req, res) => {
    User.findOne({phone_number: req.params.cell}).then(user => {
        console.log(user);
        if (user === null) return res.json({ error: "KanoPay user not found." });
        Transaction.find({$or:[{sender: user}, {recipient: user}]}).populate(['sender', 'recipient', 'partner']).then(transactions => {
            user.transactions = transactions;
            res.json([user, transactions]);
        });
    });
});

app.post('/partner', async (req, res) => {
    let pass = await argon2.hash(req.body.password);
    Partner.create({
        name: req.body.name,
        username: req.body.username,
        password: pass,
        code: req.body.code
    }).then(() => res.send());
});

app.listen(process.env.PORT || 3000);
