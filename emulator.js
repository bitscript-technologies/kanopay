#!/usr/bin/env node
const { prompt } = require('enquirer');
const fn = require('./fn');

prompt([
    {
        type: 'input',
        name: 'number',
        message: 'Cell:',
        initial: '09178293000'
    },
    {
        type: 'input',
        name: 'message',
        message: 'Message:',
        initial: "MENU"
    },
]).then(response => {
    fn(response.message, response.number, res => console.log(`Replying to ${response.number}: `+ res));
});
