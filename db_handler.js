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

var pg = require('pg');

var connectionString = process.env.DATABASE_URL || 'postgres://tanay:tanay@localhost:5432/pitchybird';

var client = null, query = null, data = null;

var getDateString = function(date){
	var strDate, strMonth, strYear;
	strDate = date.getDate().toString();
	if (date.getDate() < 10) {
		strDate = '0'+strDate;
	}
	strMonth = (date.getMonth()+1).toString();
	if (date.getMonth()+1 < 10) {
		strMonth = '0'+strMonth;
	}
	strYear = date.getFullYear().toString();
	return ''+strYear+'-'+strMonth+'-'+strDate;
}
var flushTable = function(tableName, dateObj, callback) {
	var client = null, query = null;
	var strDate = getDateString(dateObj);
	client = new pg.Client(connectionString);
	client.connect();
	query = client.query('DELETE FROM '+tableName+' WHERE latest_date<TO_DATE(\''+strDate+'\',\'YYYY-MM-DD\');', function(err, result) {
		if(err) {
			console.log(err);
			return;
		}
		callback();
	});
};
var insertIntoTable = function(tableName, data, callback) {
	var client = null, query = null;
	client = new pg.Client(connectionString);
	client.connect();
	query = client.query('SELECT * FROM '+tableName+' WHERE username=\''+data.username+'\';', function(err, result) {
		if(err) {
			console.log(err);
			return;
		}
		console.log(result.rowCount);
		if(result.rowCount > 0 && result.rows[0].score < data.score) {
			query = client.query('UPDATE '+tableName+' SET score='+data.score+', latest_date=\''+data.date+'\', latest_time=\''+data.time+'\', ip=\''+data.ip+'\' WHERE username=\''+data.username+'\';', function(err, result) {
				if(err) {
					console.log(err);
					return;
				}
				console.log('Updated while inserting');
				callback();
			});
		} else {
			console.log('SELECTing all the values');
			query = client.query('SELECT * FROM '+tableName+';', function(err, result){
				if(err) {
					console.log(err);
					return;
				}
				console.log(result.rows);
				if (result.rowCount > 10){
					console.log('DELETEing from the table');
					query = client.query('DELETE FROM '+tableName+' WHERE username=( SELECT DISTINCT username FROM '+tableName+' WHERE score=( SELECT DISTINCT MIN(score) FROM '+tableName+' ) LIMIT 1 );', function(err,rows){
						if(err) {
							console.log(err);
							return;
						}
						console.log('Deleted Extra!');
						insertIntoTable(tableName, data, callback);
					});
				} else {
					console.log('INSERTing into the table');
					query = client.query('INSERT INTO '+tableName+' VALUES (\''+data.username+'\', '+data.score+', \''+data.date+'\', \''+data.time+'\', \''+data.ip+'\');', function(err, result){
						if(err) {
							console.log(err);
							return;
						}
						console.log('Inserted while inserting');
						callback();
					});
				}
			});
		}
	});
};
var readFromTable = function(tableName, callback) {
	flushTable(tableName, new Date(), function(){
		var client = null, query = null;
		client = new pg.Client(connectionString);
		client.connect();
		query = client.query('SELECT * FROM '+tableName+' ORDER BY score DESC, latest_date DESC, latest_time DESC;', function(err, result){
			if(err) {
				console.log(err);
				return;
			}
			console.log('Read values');
			console.log(result.rows);
			callback(result);
		});
	});
};
var createNonExistent = function(tableName, callback) {
	var client = null, query = null;
	client = new pg.Client(connectionString);
	client.connect();
	query = client.query('CREATE TABLE IF NOT EXISTS  '+tableName+' (username VARCHAR(8) PRIMARY KEY NOT NULL,	score INTEGER NOT NULL,	latest_date DATE NOT NULL, latest_time TIME NOT NULL, ip VARCHAR(16) NOT NULL);', function(err, result) {
		if (err) {
			console.log(err);
			return;
		}
		console.log('Table Created');
		callback();
	});
}
exports.saveScore = function (username,score,ip) {
	createNonExistent('today', function(){
			flushTable('today',new Date(), function(){
			var dateObj = new Date();
			var strDate = getDateString(dateObj);
			insertIntoTable('today',{username:username, score:score, date:strDate, time:'00:00:00', ip:ip},function(){
				console.log('Done!');
			});
		});
	});
	createNonExistent('thisweek', function(){
		flushTable('thisweek',new Date(), function(){
			var dateObj = new Date();
			var strDate = getDateString(dateObj);
			while (dateObj.getDay() != 0) {
				dateObj.setDate(dateObj.getDate()-1);
			}
			console.log(dateObj);
			insertIntoTable('thisweek',{username:username, score:score, date:strDate, time:'00:00:00', ip:ip},function(){
				console.log('Done!');
			});
		});
	});
	createNonExistent('alltime', function(){
		var dateObj = new Date();
		var strDate = getDateString(dateObj);
		insertIntoTable('alltime',{username:username, score:score, date:strDate, time:'00:00:00', ip:ip},function(){
			console.log('Done!');
		});
	});
};
exports.readLeaderBoards = function(callback) {
	var boards = [];
	createNonExistent('alltime', function(){
		createNonExistent('thisweek', function(){
			createNonExistent('today', function(){
				readFromTable('today', function(result) {
					boards['today'] = result.rows;
					readFromTable('thisweek', function(result) {
						boards['thisweek'] = result.rows;
						readFromTable('alltime', function(result) {
							boards['alltime'] = result.rows;
							console.log(boards['today']);
							callback(boards);
						});
					});
				});
			});
		});
	});
};