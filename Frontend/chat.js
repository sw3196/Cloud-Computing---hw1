$(document).ready(function(){
  var AWS = window.AWS;
  // require('aws-sdk');
  var parser = document.createElement('a');
  parser.href = window.location.href;

  var raw_code = parser.search;
  var target_code = raw_code.slice(6,);
  console.log(target_code);

  var token_response = "";
  console.log("Start testing the cognito");

  var settings = {
      "async": false,
      "crossDomain": true,
      "url": "https://chatbox-bifeitang.auth.us-east-2.amazoncognito.com/oauth2/token",
      "method": "POST",
      "headers": {
          "content-type": "application/x-www-form-urlencoded"
      },
      "data": {
          "grant_type": "authorization_code",
          "client_id": "2u9uc5ph88h4442v8gjk8pv38k",
          "redirect_uri": "https://s3.us-east-2.amazonaws.com/chatbox-bifeitang/chatbox.html",
          "code": target_code
      }
  }

  $.ajax(settings).done(function (response) {
      token_response = response;
      console.log(response);
      console.log(response.id_token);
      console.log("test");
  });

  console.log("This part is finished");

  // Set the region where your identity pool exists (us-east-1, eu-west-1)
  $.when($.when(step1()).then(step2)).then(step3);
  function step1() {
    AWS.config.region = 'us-east-2';

    // Configure the credentials provider to use your identity pool
    var UserPoolId = 'us-east-2_igNLK5o4i';
    var loginKey = 'cognito-idp.' + 'us-east-2' + '.amazonaws.com/' + UserPoolId;
    var abc = token_response.id_token;
    console.log("start step1: confige credentials");
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-2:d949719f-fab0-4977-8942-e0531edac4c0',
        // IdentityId: identityId,
        Logins: {
            'cognito-idp.us-east-2.amazonaws.com/us-east-2_igNLK5o4i': abc
          }
    });
  }
  
  function step2() {
    // Make the call to obtain credentials
    //call refresh method in order to authenticate user and get new temp credentials
    AWS.config.credentials.refresh((error) => {
        console.log("Start step2: ")
        if (error) {
            console.error(error);
        } else {
            console.log('Successfully logged!');
        }
    });
  }

  console.log("start step3");
  function step3() {
    AWS.config.credentials.get(function(err) {
      if (err) {
        console.log(err);
        return;
      }
      else{
        console.log('Obtain AWS credentials')
        // Credentials will be available when this function is called.
        var accessKeyId = AWS.config.credentials.accessKeyId;
        var secretAccessKey = AWS.config.credentials.secretAccessKey;
        var sessionToken = AWS.config.credentials.sessionToken;
        AWS.config.update({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            sessionToken: sessionToken
        })
        chat.init();
        console.log("accessKeyId: ", accessKeyId);
        console.log("secretAccessKey: ", secretAccessKey);
        console.log("sessionToken: ", sessionToken);
      }
    });
  }

  console.log("Start Creating the apigClientFactory");
  console.log("accessKeyId:", AWS.config.credentials.accessKeyId); 

  var chat = {
    messageToSend: '',
    messageResponses: [
      'Hello!',
      'How are you?',
      'Why did the web developer leave the restaurant? Because of the table layout.',
      'How do you comfort a JavaScript bug? You console it.',
      'An SQL query enters a bar, approaches two tables and asks: "May I join you?"',
      'What is the most used language in programming? Profanity.',
      'What is the object-oriented way to become wealthy? Inheritance.',
      'An SEO expert walks into a bar, bars, pub, tavern, public house, Irish pub, drinks, beer, alcohol'
    ],
    init: function() {
      this.cacheDOM();
      this.bindEvents();
      this.render();
    },
    // DOM here represent  the 
    cacheDOM: function() {
      this.$chatHistory = $('.chat-history');
      this.$button = $('button');
      this.$textarea = $('#message-to-send');
      this.$chatHistoryList =  this.$chatHistory.find('ul');
    },
    bindEvents: function() {
      this.$button.on('click', this.addMessage.bind(this));
      this.$textarea.on('keyup', this.addMessageEnter.bind(this));
    },
    render: function() {
      this.scrollToBottom();
      if (this.messageToSend.trim() == '') {
        return false;
      }

      var template = Handlebars.compile( $("#message-template").html());

      var context = { 
          messageOutput: this.messageToSend,
          time: this.getCurrentTime()
      };

      this.$chatHistoryList.append(template(context));
      this.scrollToBottom();
      this.sendMessageToApi(this.messageToSend)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.log("error: something wrong happen");
        });
      console.log(this.messageToSend);
      
      if (this.messageToSend.trim() !== '') {
        
        this.$textarea.val('');
        
        // responses
        var templateResponse = Handlebars.compile( $("#message-response-template").html());
        var contextResponse = { 
          response: this.getRandomItem(this.messageResponses),
          time: this.getCurrentTime()
        };
        
        setTimeout(function() {
          this.$chatHistoryList.append(templateResponse(contextResponse));
          this.scrollToBottom();
        }.bind(this), 1500);
        
      }
      
    },

    sendMessageToApi: function(message) {
      sdk = apigClientFactory.newClient({
          accessKey: AWS.config.credentials.accessKeyId,
          secretKey: AWS.config.credentials.secretAccessKey,
          sessionToken: AWS.config.credentials.sessionToken
      }); 
      return sdk.chatbotPost({}, {
        messages: [{
          unstructed: {
            text: message
          }
        }]
      }, {});
    },
    
    addMessage: function() {
      this.messageToSend = this.$textarea.val()
      this.render();         
    },
    addMessageEnter: function(event) {
        // enter was pressed
        if (event.keyCode === 13) {
          this.addMessage();
        }
    },
    scrollToBottom: function() {
       this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
    },
    getCurrentTime: function() {
      return new Date().toLocaleTimeString().
              replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
    },
    getRandomItem: function(arr) {
      return arr[Math.floor(Math.random()*arr.length)];
    }
    
  };
  
  
  var searchFilter = {
    options: { valueNames: ['name'] },
    init: function() {
      var userList = new List('people-list', this.options);
      var noItems = $('<li id="no-items-found">No items found</li>');
      
      userList.on('updated', function(list) {
        if (list.matchingItems.length === 0) {
          $(list.list).append(noItems);
        } else {
          noItems.detach();
        }
      });
    }
  };
  
  searchFilter.init();
  
});