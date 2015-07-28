// The MIT License (MIT)

// Copyright (c) 2015 Tanay PrabhuDesai

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var querystring = require('querystring');
var pdb = require('./db_handler.js');

var env = (function(){
      var Habitat = require("habitat");
      Habitat.load();
      return new Habitat();
    }());

var app = express();

var port = Number(process.env.PORT || 5000);

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ 
  extended: true
}));

app.set('views',__dirname+'/views/');
app.set('view engine','jade');
app.engine('jade', require('jade').__express);

// Use all the public files
app.use(express.static(__dirname + '/public/js'));
app.use(express.static(__dirname + '/public/css'));
app.use(express.static(__dirname + '/public/css/font/'));
app.use(express.static(__dirname + '/public/res'));

function postCaptcha(response,ip,res_in,username,captchaVerified) {
	var post_data = querystring.stringify({
      'secret' : process.env.SECRET_KEY || env.get("SECRET_KEY"),
      'response': response,
      'remoteip': ip
  });
  console.log('Response:'+response);
  console.log('Ip:'+ip);
  var post_options = {
      host: 'www.google.com',
      port: '443',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': post_data.length
      }
  };
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
          captchaVerified(chunk,username,res_in);
      });
  });
  console.log('Post completed');
  post_req.write(post_data);
  post_req.end();
}

app.get('/', function (req, res) {
  res.render('login.jade',{msg:''});
});

function captchaVerified(chunk, username, res) {
	var txt = 'Please prove that you are not a robot';
	var obj = JSON.parse(chunk);
	console.log(typeof(obj)+' '+obj+' '+obj.success);
	if (obj["success"]) {
		res.render('game.jade',{username:username});
	} else {
		res.render('login.jade',{msg:txt});
	}
}

app.post('/play',function(req, res){
	if (req.body['username'] == '') {
		var txt = 'Username cannot be left empty';
  	res.render('login.jade',{msg:txt});
	} else {
		postCaptcha(req.body['g-recaptcha-response'],req.headers["x-forwarded-for"] || req.connection.remoteAddress,res,req.body['username'],captchaVerified);
	}
});

app.get('/leaderboards',function(req,res){
  pdb.readLeaderBoards(function(result){
    res.render('leaderboards.jade', {today:result['today'], alltime:result['alltime'], thisweek:result['thisweek']});
  });
});

app.post('/score', function(req, res){
  pdb.saveScore(req.body['username'], req.body['score'], req.ip.toString());
  console.log('Recieved Code');
  res.send('success');
});

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Pitchy Bird started at http://%s:%s', host, port);
});