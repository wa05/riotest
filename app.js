var express  = require('express');

	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	mongoose = require('mongoose');	
	users = {};

server.listen(3000);

mongoose.connect('mongodb://rioemployer:15151515@ds011248.mongolab.com:11248/riotest', function(err){
	if(err){
		console.log('Connection failed');
		console.log(err);
	} else{
		console.log('Connected to the database');
	}
});

var chatSchema = mongoose.Schema({
			nick: String,
			msg: String,
			created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

app.get('/', function(req,res){
	res.sendFile(__dirname + '/index.html');
});

	io.sockets.on('connection',function(socket){
		socket.on('new user', function(data,callback){
			if(data in users){
				callback(false);
			}
			else{
				callback(true);
				socket.nickname = data;
				users[socket.nickname]= socket;	
				updateNicknames();
			}
		});

		function updateNicknames(){
			io.sockets.emit('usernames', Object.keys(users));
		}

		socket.on('send message',function(data, callback){
			var msg = data.trim();
			console.log('after trimming message is:' + msg);
			if(msg.substr(0,3) === '/w '){
				msg = msg.substr(3);
				var ind= msg.indexOf(' ');
				if (ind !== -1){
					var name = msg.substring(0,ind);
					var msg = msg.substring(ind + 1);
					if(name in users){
						users[name].emit('whisper', {msg: data, nick: socket.nickname});
						console.log("Whisper");		
					}else{
						callback('Error! Enter a valid user');
					}
				
				} else{
					callback('Error! Please enter a message for your Whisper');
				}				
			}else{
				var newMsg = new Chat({msg: msg, nick: socket.nickname});
				newMsg.save(function(err){
					if(err) throw err;
					io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
				});	
			}
			
		});
		socket.on('disconnect',function(data){
			if(!socket.nickname) return;
			delete users[socket.nickname];
			nicknames.splice(nicknames.indexOf(socket.nickname),1);
			updateNicknames();
		})

	});
