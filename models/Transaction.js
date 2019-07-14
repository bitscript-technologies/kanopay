const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./User');

const transactionSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
    account_id: String,
    money_transferred: Number,
    time: {
        type: Date,
        default: Date.now
    },
    load: {
        type: Boolean,
        default: false
    }
});

transactionSchema.statics.transfer = function (sender, recipient, amount, cb) {
    User.findOne({ phone_number: recipient }).then(recipient_info => {
        if (recipient_info === null) cb(`Unable to process transaction as ${recipient} does not have a KanoPay account.`);
        else {
            User.findOne({ phone_number: sender }).then(sender_info => {
                if (sender_info.balance < amount) cb(`You do not have enough credits to transfer credits to ${recipient}.`);
                else {
                    sender_info.balance-=amount;
                    sender_info.save();
                    recipient_info.balance+=amount;
                    recipient_info.save();
                    this.model('Transaction').create({
                        sender: sender_info,
                        recipient: recipient_info,
                        money_transferred: amount,
                    });
                    axios.post(`https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/3855/requests?access_token=${recipient_info.access_token}`, {
                        address: recipient_info.phone_number,
                        message: `You have received ${amount} pesos from ${sender_info.name} (${sender}). Your new balance is ${recipient_info.balance} pesos.`
                    });
                    cb(`You have successfully transfered ${amount} pesos to ${recipient_info.name} (${recipient}). Your new balance is ${sender_info.balance} pesos.`);
                }
            });
        }
    });
}

transactionSchema.statics.load = function (sender, recipient, amount, cb) {
    User.findOne({ phone_number: recipient }).then(recipient_info => {
        if (recipient_info === null) cb(`Unable to process transaction as ${recipient} does not have a KanoPay account.`);
        else {
            User.findOne({ phone_number: sender }).then(sender_info => {
                sender_info.load_balance+=amount;
                sender_info.save();
                recipient_info.balance+=amount;
                recipient_info.save();
                this.model('Transaction').create({
                    sender: sender_info,
                    recipient: recipient_info,
                    money_transferred: amount,
                    load: true
                });
                axios.post(`https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/3855/requests?access_token=${recipient_info.access_token}`, {
                    address: recipient_info.phone_number,
                    message: `You have received ${amount} pesos from ${sender_info.name} (${sender}). Your new balance is ${recipient_info.balance} pesos.`
                });
                cb(`You have successfully transfered ${amount} pesos to ${recipient_info.name} (${recipient}). Your new balance is ${sender_info.balance} pesos${sender_info.verified ? " while you currently owe PHP"+sender_info.load_balance : ""}.`);
            });
        }
    });
}

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;