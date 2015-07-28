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

function loaded () {
  //Add stuff here
  var audioReady = false;
  var audioInput = {
    analyser:null,
    waveArray:null,
    freqArray:null,
    freq:{min:8,max:40},
    ampl:{}
  };
  audioInput.init = function() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();
    var mediaStreamSource = null;
    var gotStream = null;
    var error = null;
    var dictionary = {
      "audio": {
        "mandatory": {
          "googEchoCancellation": "true",
          "googAutoGainControl": "false",
          "googNoiseSuppression": "true",
          "googHighpassFilter": "true"
        },
        "optional": []
      },
    };
    gotStream = function (stream) {
      console.log(this);
      mediaStreamSource = audioContext.createMediaStreamSource(stream);
      audioInput.analyser = audioContext.createAnalyser();
      audioInput.analyser.fftSize = 2048;
      bufferLength = audioInput.analyser.fftSize;
      audioInput.waveArray = new Uint8Array(bufferLength);
      audioInput.freqArray = new Uint8Array(bufferLength);
      mediaStreamSource.connect( audioInput.analyser );
      audioInput.analyser.getByteTimeDomainData(audioInput.waveArray);
      audioInput.analyser.getByteFrequencyData(audioInput.freqArray);
      console.log(audioInput.freqArray);
      console.log("Created audio stream");
      audioReady = true;
    };
    error = function() {
      alert('Stream generation failed.');
    };
    try {
      navigator.getUserMedia = 
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
      navigator.getUserMedia(dictionary, gotStream, error);
    } catch (e) {
      alert('Could not detect the mic' + e);
    }
  };
  audioInput.getMaxFreq = function() {
    audioInput.analyser.getByteFrequencyData(audioInput.freqArray);
    var arr = audioInput.freqArray, max = 0;
    for (var i = 0 ; i < arr.length ; ++i ) {
      if (arr[i] > arr[max]) max = i;
    }
    return max;
  };
  audioInput.getMaxAmpl = function() {
    audioInput.analyser.getByteTimeDomainData(audioInput.waveArray);
    var arr = audioInput.waveArray, max = 0;
    for (var i = 0 ; i < arr.length ; ++i ) {
      if (arr[i] > max) max = arr[i];
    }
    return max;
  };
  var player = {
    x:0,
    y:0,
    width:20,
    height:20,
    downSpeed:0
  };
  player.init = function () {
    player.x = ( global.width + player.width ) / 2;
  }
  player.testCollision = function() {
    var res = false;
    var i = 0;
    while ( player.x > obstacles.onScreen[i].x + obstacles.width ) ++i;
    global.new_obs = i;
    if (global.old_obs != global.new_obs) {
      ++global.score;
      global.old_obs = global.new_obs;
    }
    var obs = obstacles.onScreen[i];
    if ( ! ( player.x + player.width < obs.x || player.x > obs.x + obstacles.width ) // when not in the obstacle
      && (player.y < obs.y - obstacles.gap/2 || player.y + player.width > obs.y + obstacles.gap/2) // when in the gap
      )
      res = true;
    return res;
  };
  player.update = function () {
    if(player.testCollision()) {
      global.gameOver = true;
    }
    if ( audioInput.getMaxAmpl() > 140 ) {
      player.downSpeed = 0;//stop current motion direction and move upwards
      player.downSpeed -= (audioInput.getMaxFreq() - audioInput.freq.min)/3;//dividing factor(convert to a constant later)
    }
    else {
      if (player.downSpeed < global.gravity.t )
        player.downSpeed += global.gravity.f;// apply gravity
    }
    player.y += player.downSpeed;//move the player WRT its speed
    if ( player.y + player.height < 0) {
      player.y = 0;//if player tries to go out of the screen from top
      player.downSpeed = 0;
    }
    else if ( player.y >= global.height - player.height ) {
      player.y = global.height - player.height;//same thing but from bottom
      player.downSpeed = 0;
    }
  };
  player.draw = function (ctx) {
    ctx.fillRect(player.x,player.y,player.width,player.height);
  };
  var global = {
    width:0,
    height:0,
    gameOver:false,
    paused:false,
    score:0,
    scoreSubmitted:false,
    old_obs:0,
    new_obs:0,
    gravity: {t:4.5,f:0.5}
  };
  var obstacles = {
    list:[],
    next:0,
    onScreen:[],
    gap:200,
    width:50,
    speed:5
  };
  var generateObstacles = function(n) {
    var levels = 20;
    var lst = [];
    for ( var i  = 0 ;  i < n ; ++i ) {
      lst.push(Math.random());
    }
    return lst;
  };
  obstacles.addObstacle = function() {
    while (obstacles.onScreen.length < 6) {
      var obj = {};
      obj.y = obstacles.list[obstacles.next] * global.height;
      if (obstacles.onScreen.length <= 0)
        obj.x = global.width;
      else
        obj.x = obstacles.onScreen[obstacles.onScreen.length-1].x + ( global.width / 5 );
      obstacles.onScreen.push(obj);
      obstacles.next++;
    }
  };
  obstacles.init = function () {
    obstacles.addObstacle();
  };
  obstacles.update = function () {
    while (obstacles.onScreen.length < 6) {
      obstacles.addObstacle();
    }
    for ( var i = 0 ; i < obstacles.onScreen.length ; ++i ) {
      --obstacles.onScreen[i].x;
    }
    if (obstacles.onScreen[0].x + obstacles.width < 0) {
      obstacles.onScreen.splice(0,1);
    }
  };
  obstacles.draw = function (ctx) {
    for ( var i = 0 ; i < obstacles.onScreen.length ; ++i ) {
      ctx.fillRect(obstacles.onScreen[i].x,0,obstacles.width,obstacles.onScreen[i].y-obstacles.gap/2);
      ctx.fillRect(obstacles.onScreen[i].x,obstacles.onScreen[i].y+obstacles.gap/2,obstacles.width,global.height);
    }
  };
  var messageOutput = {
    cap:'Game Over!',
    msg:['Press any key or click anywhere','to go to the leaderboard'],
    msgSpace: 50,
    msgX:20,
    msgY:50,
    msgThick:20,
    x:0,
    y:0,
    width:700,
    height:300,
    thickness:5
  };
  messageOutput.reposition = function() {
    messageOutput.x = (global.width - messageOutput.width)/2;
    messageOutput.y = (global.height - messageOutput.height)/2;
  }
  messageOutput.draw = function(ctx){
    var oldThickness = ctx.lineWidth;
    var oldFill = ctx.fillStyle, oldStroke = ctx.strokeStyle;
    ctx.lineWidth = messageOutput.thickness;
    ctx.fillStyle = 'black';
    ctx.fillRect(messageOutput.x, messageOutput.y, messageOutput.width, messageOutput.height);
    ctx.strokeStyle = 'white';
    ctx.rect(messageOutput.x, messageOutput.y, messageOutput.width, messageOutput.height);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font="30px Press Start K";
    ctx.fillText(messageOutput.cap, messageOutput.x + messageOutput.msgX, messageOutput.y + messageOutput.msgY);
    ctx.font="20px Press Start K";
    for (var i = 0 ; i < messageOutput.msg.length ; ++i ) {
      ctx.fillText(messageOutput.msg[i], messageOutput.x + messageOutput.msgX, messageOutput.y + messageOutput.msgY + messageOutput.msgThick*(i+1) + messageOutput.msgSpace );
    }
    ctx.lineWidth = oldThickness;
    ctx.fillStyle = oldFill;
    ctx.strokeStyle = oldStroke;
  };
  function leaderboardsOpen(e) {
    if (global.gameOver) {
      window.open('http://'+window.location.host+'/leaderboards','_self');
      console.log('opening: '+'http://'+window.location.host+'/leaderboards');
    }
  }
  function submitScore() {
    var http = new XMLHttpRequest();
    http.open("POST", 'http://'+window.location.host+"/score", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var params = "username=" + global.username + "&score=" + global.score ; // probably use document.getElementById(...).value 
    http.send(params); 
    http.onload = function() { 
      if (http.responseText == 'success') {
        messageOutput.msg.push('Your score has been submitted');
      } 
    } 
  }
  function init() {
    var canvas = document.getElementById('game_canvas');
    global.ctx = canvas.getContext("2d");
    obstacles.list = generateObstacles(10000);
    console.log(_username);
    global.username = _username;
    global.width = canvas.width  = window.innerWidth;
    global.height = canvas.height = window.innerHeight;
    audioInput.init();
    player.init();
    obstacles.init();
    messageOutput.reposition();
    window.addEventListener("click", leaderboardsOpen, false);
    window.addEventListener("keydown", leaderboardsOpen, false);
  }
  function update() {
    if ( ! global.gameOver) {
      player.update();
      obstacles.update();
    }
    if (global.gameOver && ! global.scoreSubmitted) {
      submitScore();
      global.scoreSubmitted = true;
    }
  }
  function draw() {
    ctx = global.ctx;
    ctx.fillStyle = "black";
    ctx.font="30px Press Start K";
    ctx.clearRect(0,0,global.width,global.height);
    ctx.fillStyle = "white";
    player.draw(ctx);
    obstacles.draw(ctx);
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,300,60);
    ctx.fillStyle = "white";
    ctx.fillText("Score: "+global.score,0,30);
    if (global.gameOver) {
      messageOutput.draw(ctx);
    };
  }
  init();
  var step = function(timestamp) {
    if ( audioReady ) {
      update();
      draw();
    }
    window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
};
window.onload = loaded;