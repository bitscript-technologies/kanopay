const mongoose = require('mongoose');

const Partner = mongoose.model('Partner', {
    name: String,
    username: String,
    password: String,
    code: Number,
    balance: {
        type: Number,
        default: 0
    }
});

module.exports = Partner;