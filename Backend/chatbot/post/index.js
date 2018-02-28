var AWS = require("aws-sdk");
var http = require('http');
var util = require('util');

var response1 = "Hello, how can I help you?"
var response2 = "I will have to get back to you on this.";
var genericResponse = "I am listening.";

exports.handler = (event, context, callback) => {
    console.log('Start chatting');
    
    let messages = null;
    
    try {
        if ('messages' in event) {
            console.log(event.message);
            messages = event.message;
        } else {
            console.log(event.message);
            throw new Error('bad request: missing messages key');
        }
        
        let responseMessage = buildUnstructuredMessage(response1);
        
        if (responseMessage.length == 0) {
            responseMessage.push (buildUnstructuredMessage(genericResponse));
        }
        
        console.log('responding with message', responseMessage);
        
        callback(null, {
            messages: responseMessage
        });
    } catch (error) {
        console.log(error);
        callback(error);
    }
};

const buildUnstructuredMessage = function(text) {
  return {
    statusCode : '200',
    type: 'unstructured',
    unstructured: {
      text: text,
      timestamp: new Date().toISOString()
    }
  }
};