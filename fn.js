require('dotenv').config()
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Partner = require('./models/Partner');

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
            switch(user.state_msg.split(" ")[0]) {
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
                            cb(`Hi ${user.name}! You currently have ${user.balance || (0).toFixed(2)} pesos in your account${user.verified ? " while you currently owe PHP"+user.load_balance : ""}.
PAY - Pay your bill
TRANSACTIONS - Shows recent transactions
TRANSFER <number> <amount> - Transfer money to a User
${user.verified ? "LOAD <number> <amount> - Top-up money to a User" : ""}`);
                            break;
                        case "PAY":
                            Partner.find({}).then(async partners => {
                                console.log(partners);
                                let s = `To pay to the following providers, enter the number code associated to them:\n`;
                                await partners.forEach(x => {
                                    s+=`${x.code} for ${x.name}\n`;
                                });
                                await User.findOne({phone_number: number}, (err, user) => {
                                    user.state_msg = "PAY_1";
                                    user.save();
                                    cb(s);
                                });
                            });
                            break;
                        case "TRANSACTIONS":
                            let s = "Recent Transactions:";
                            User.findOne({phone_number: number}).then(user => {
                                Transaction.find({$or:[{sender: user}, {recipient: user}]}).populate(['sender', 'recipient', 'partner']).then(async res => {
                                    await res.forEach(x => {
                                        if (x.recipient) s+=`\n\nFrom (${x.sender.phone_number === number ? ("You") : x.sender.phone_number}) To (${x.recipient.phone_number === number ? ("You") : x.recipient.phone_number}): ${x.money_transferred} pesos`;
                                        else s+=`\n\nFrom (${x.sender.phone_number === number ? ("You") : x.sender.phone_number}) To ${x.partner.name} (${x.account_id}): ${x.money_transferred} pesos`;
                                    });
                                    cb(s);
                                });
                            });
                            break;
                        case "TRANSFER":
                            let recipient = message.split(" ")[1].toUpperCase();
                            let amount = Number(message.split(" ")[2].toUpperCase());
                            Transaction.transfer(number, recipient, amount, cb);
                            break;
                        case "LOAD":
                            if (user.verified) {
                                let recipient = message.split(" ")[1].toUpperCase();
                                let amount = Number(message.split(" ")[2].toUpperCase());
                                Transaction.load(number, recipient, amount, cb);
                            } else cb(`Invalid keyword. The following keywords are available for you: PAY, TRANSACTIONS,${user.verified ? " LOAD <number> <amount>," : ""} and TRANSFER <number> <amount>.`);
                            break;
                        default:
                            cb(`Invalid keyword. The following keywords are available for you: PAY, TRANSACTIONS,${user.verified ? " LOAD <number> <amount>," : ""} and TRANSFER <number> <amount>.`);
                            break;
                    }
                    break;
                case "PAY_1":
                    if (message.toUpperCase() !== "MENU") {
                        Partner.findOne({code: Number(message)}).then(partner => {
                            if (partner !== null) {
                                User.findOne({phone_number: number}, (err, user) => {
                                    user.state_msg = `PAY_2 ${message}`;
                                    user.save();
                                    cb(`${partner.name} selected. Please reply with your account number for ${partner.name}.`);
                                });
                            } else cb('Invalid code. Please try again. Or reply with "MENU" to go back to the main menu.');
                        })
                    } else {
                        User.findOne({phone_number: number}, (err, user) => {
                            user.state_msg = `MENU`;
                            user.save();
                            cb(`Hi ${user.name}! You currently have ${user.balance || (0).toFixed(2)} pesos in your account${user.verified ? " while you currently owe PHP"+user.load_balance : ""}.
PAY - Pay your bill
TRANSACTIONS - Shows recent transactions
TRANSFER <number> <amount> - Transfer money to a User
${user.verified ? "LOAD <number> <amount> - Top-up money to a User" : ""}`);
                        });
                    }
                break;
            case "PAY_2":
                if (message.toUpperCase() !== "MENU") {
                    let partner_code = user.state_msg.split(" ")[1];
                    Partner.findOne({code: Number(partner_code)}).then(partner => {
                        User.findOne({phone_number: number}, (err, user) => {
                            user.state_msg = `PAY_3 ${partner_code} ${message}`;
                            user.save();
                            cb(`You have entered ${message} for paying with ${partner.name}. Please enter the amount you're going to pay to ${partner.name}.`);
                        });
                    })
                } else {
                    User.findOne({phone_number: number}, (err, user) => {
                        user.state_msg = `MENU`;
                        user.save();
                        cb(`Hi ${user.name}! You currently have ${user.balance || (0).toFixed(2)} pesos in your account${user.verified ? " while you currently owe PHP"+user.load_balance : ""}.
PAY - Pay your bill
TRANSACTIONS - Shows recent transactions
TRANSFER <number> <amount> - Transfer money to a User
${user.verified ? "LOAD <number> <amount> - Top-up money to a User" : ""}`);
                    });
                }
                break;
            case "PAY_3":
                if (message.toUpperCase() !== "MENU") {
                    let partner_code = user.state_msg.split(" ")[1];
                    let account_number = user.state_msg.split(" ")[2];
                    let amount = Number(message);
                    Partner.findOne({code: Number(partner_code)}).then(partner => {
                        User.findOne({phone_number: number}, (err, user) => {
                            if (amount <= user.balance) {
                                user.state_msg = `PAY_4 ${partner_code} ${account_number} ${message}`;
                                user.save();
                                cb(`Are you sure you want to pay ${partner.name} (${account_number}) PHP${amount}? Reply with "YES" to confirm or "MENU" to cancel.`);
                            } else {
                                user.state_msg = `MENU`;
                                user.save();
                                cb(`You do not have sufficient balance to pay ${partner.name} (${account_number}) PHP${amount}. Reply with "MENU" to see the available commands.`);
                            }
                        });
                    })
                } else {
                    User.findOne({phone_number: number}, (err, user) => {
                        user.state_msg = `MENU`;
                        user.save();
                        cb(`Hi ${user.name}! You currently have ${user.balance || (0).toFixed(2)} pesos in your account${user.verified ? " while you currently owe PHP"+user.load_balance : ""}.
PAY - Pay your bill
TRANSACTIONS - Shows recent transactions
TRANSFER <number> <amount> - Transfer money to a User
${user.verified ? "LOAD <number> <amount> - Top-up money to a User" : ""}`);
                    });
                }
                break;
            case "PAY_4":
                if (message.toUpperCase() !== "MENU") {
                    let partner_code = user.state_msg.split(" ")[1];
                    let account_number = user.state_msg.split(" ")[2];
                    let amount = user.state_msg.split(" ")[3];
                    Partner.findOne({code: Number(partner_code)}).then(partner => {
                        User.findOne({phone_number: number}, async (err, user) => {
                            user.state_msg = `MENU`;
                            user.balance-=Number(amount);
                            await user.save();
                            partner.balance+=Number(amount);
                            await partner.save();
                            Transaction.create({
                                sender: user,
                                partner,
                                account_id: account_number,
                                money_transferred: Number(amount)
                            });
                            cb(`Thank you for paying ${partner.name} (${account_number}) PHP${amount}. Have a good day! Reply with "MENU" to see the available commands.`);
                        });
                    })
                } else {
                    User.findOne({phone_number: number}, (err, user) => {
                        user.state_msg = `MENU`;
                        user.save();
                        cb(`Hi ${user.name}! You currently have ${user.balance || (0).toFixed(2)} pesos in your account${user.verified ? " while you currently owe PHP"+user.load_balance : ""}.
PAY - Pay your bill
TRANSACTIONS - Shows recent transactions
TRANSFER <number> <amount> - Transfer money to a User
${user.verified ? "LOAD <number> <amount> - Top-up money to a User" : ""}`);
                    });
                }
                break;
            }
        }
    });
}
