export class Command {
	constructor(name, description, usage, level, hidden, callback) {
		var self = this;
		self.name = name;
		self.description = description;
		self.usage = usage;
		self.level = level || USER_LEVEL_NORMAL;
		self.hidden = !!hidden;
		self.callback = callback;
		self.enabled = true;
	}
}
export default class CommandManager {
	constructor(ch) {
		this.commands = {};
		this.prefix = '!';
		this.ch = ch;
	}

	getLevel(uid) {
		var self = this;
		if(self.ch && self.ch.levels){
			if(self.ch.levels[1].indexOf(uid) > -1) return USER_LEVEL_MODERATOR;
			if(self.ch.levels[2].indexOf(uid) > -1) return USER_LEVEL_ADMIN;
		}
		return USER_LEVEL_NORMAL;
	}

	addCommand(name, description, usage, level, hidden, callback) {
		var self = this;
		self.commands[name] = new Command(name, description, usage, level, hidden, callback);
	}

	addListener(privateMessage) {
		var self = this,
			uid = privateMessage.tags.userId,
			message = privateMessage.message,
			command,
			commandObj,
			params;
		console.log(message, this.prefix, message.indexOf('!'));
		if(message.indexOf(this.prefix) == 0){
			var split = message.split(' ');
			command = split[0].substring(this.prefix.length).toLowerCase();	

			if(this.commands.hasOwnProperty(command)){
				console.log(command, this.commands[command]);
				commandObj = this.commands[command]
				params = split.slice(1);
				if(self.getLevel(uid) >= commandObj.level){
					if(typeof commandObj.callback == 'function'){
						console.log('params', params);
						commandObj.callback.apply(self, [{
							...privateMessage,
							'params': params
						}]);
					}
				}
			}
		}
	}
}