const mongoose = require('mongoose');
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
                    cb(`You have successfully transfered ${amount} pesos to ${recipient_info.name} (${recipient}).`);
                }
            });
        }
    });
}

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;