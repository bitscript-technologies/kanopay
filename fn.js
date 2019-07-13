require('dotenv').config()
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

module.exports = (message, number, cb) => {
    User.getUser(number, (err, user) => {
        if (user === null) {
            if (message.toUpperCase() === "START") {
                User.createUser(number);
                cb(`Welcome to KanoPay: Press 1 for English o 2 para sa Tagalog.`);
            } else {
                cb(`It looks like you've tried to message the KanoPay service however you do not have an account on file. Please reply with START to create an account.`);
            }
        } else {
            switch(user.state_msg) {
                case "START":
                    if (Number(message) === 1) {
                        User.setLanguage("English", number);
                        cb(`English has been selected. What is your name?`);
                    } else if (Number(message) === 2) {
                        User.setLanguage("Filipino", number);
                        cb(`Filipino has been selected. What is your name?`);
                    } else {
                        cb(`It looks like you've entered an invalid command. Please try again.\n\nWelcome to KanoPay: Press 1 for English o 2 para sa Tagalog.`);
                    }
                    break;
                case "START_1":
                    User.setName(message, number);
                    cb(`Hi ${message}! Nice to meet you! Before we continue further, I need to know where do you live. Which city do you currently reside in?`);
                    break;
                case "START_2":
                    User.setCity(message, number);
                    cb(`I see. Which province do you live in?`);
                    break;
                case "START_3":
                    User.setProvince(message, number);
                    cb(`Thank you! You've been successfully registered for KanoPay. To access the main menu, send this number a message with the keyword "MENU". Have a great day!!!`);
                    break;
                case "MENU":
                    switch(message.split(" ")[0].toUpperCase()) {
                        case "MENU":
                            cb(`Hi ${user.name}! You currently have ${user.balance || (0).toFixed(2)} pesos in your account.
                                PAY - Pay your bill
                                SEARCH - Searches nearest Sari-Sari Store
                                TRANSACTIONS - Shows recent transactions
                                ${user.verified ? "TRANSFER <number> <amount> - Transfer money to a Customer" : "UPGRADE - Upgrade to a Merchant Account"}
                            `);
                            break;
                        case "SEARCH":
                            cb(`Search functionality coming soon...`);
                            break;
                        case "TRANSACTIONS":
                            let s = "Recent Transactions:\n";
                            User.findOne({phone_number: number}).then(user => {
                                Transaction.find({$or:[{sender: user}, {recipient: user}]}).populate(['sender', 'recipient']).then(async res => {
                                    await res.forEach(x => {
                                        s+=`From (${x.sender.phone_number === number ? ("You") : x.sender.phone_number}) To (${x.recipient.phone_number === number ? ("You") : x.recipient.phone_number}): ${x.money_transferred} pesos\n\n`;
                                    });
                                    cb(s);
                                });
                            });
                            break;
                        case "TRANSFER":
                            if (user.verified) {
                                let recipient = message.split(" ")[1].toUpperCase();
                                let amount = Number(message.split(" ")[2].toUpperCase());
                                Transaction.transfer(number, recipient, amount, cb);
                            } else cb(`Invalid keyword. The following keywords are available for you: PAY, SEARCH, TRANSACTIONS, and ${user.verified ? "TRANSFER" : "UPGRADE"}.`);
                            break;
                        case "UPGRADE":
                            cb(`Upgrade functionality coming soon`);
                            break;
                        default:
                            cb(`Invalid keyword. The following keywords are available for you: PAY, SEARCH, TRANSACTIONS, and ${user.verified ? "TRANSFER" : "UPGRADE"}.`);
                            break;
                    }
                    break;
            }
        }
    });
}
