const mongoose = require('mongoose');

const Partner = mongoose.model('Partner', {
    name: String,
    username: String,
    password: String,
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transactions'
    }]
});

module.exports = Partner;