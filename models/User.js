const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String,
    phone_number: String,
    balance: {
        type: Number,
        default: 0
    },
    load_balance: {
        type: Number,
        default: 0
    },
    city: String,
    province: String,
    state_msg: {
        type: String,
        default: "START"
    },
    verified: {
        type: Boolean,
        default: false
    },
    lang: String,
    access_token: String
});

userSchema.statics.getUser = function (phone_number, cb) {
    this.model('User').findOne({phone_number}, cb);
};

userSchema.statics.createUser = function (phone_number, access_token) {
    this.model('User').create({phone_number, access_token});
};

userSchema.statics.setLanguage = function(lang, phone_number) {
    this.model('User').findOne({phone_number}, (err, user) => {
        user.lang = lang;
        user.state_msg = "START_1";
        user.save();
    });
};

userSchema.statics.setName = function(name, phone_number) {
    this.model('User').findOne({phone_number}, (err, user) => {
        user.name = name;
        user.state_msg = "START_2";
        user.save();
    });
};

userSchema.statics.setCity = function(city, phone_number) {
    this.model('User').findOne({phone_number}, (err, user) => {
        user.city = city;
        user.state_msg = "START_3";
        user.save();
    });
};

userSchema.statics.setProvince = function(province, phone_number) {
    this.model('User').findOne({phone_number}, (err, user) => {
        user.province = province;
        user.state_msg = "MENU";
        user.save();
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;