export default (ch) => {
	ch.cm.addCommand('qhelp', 'Shows queue help', '<command>', USER_LEVEL_NORMAL, false, (event) =>{
		const { chat, chatConstants } = ch.client;
		var message = '',
			prefix = ch.cm.prefix,
			commands = ch.cm.commands;
		if(event.params && event.params[0]){
			var name = event.params[0];
			if(commands && commands.hasOwnProperty(name)){
				var command = commands[name];
				message += 'Usage: ' + (prefix + command.name) + ' ' + command.usage;
				message += '\nDescription: ' + command.description;
			}
		}else{
			message = 'Available commands: ';
			for(var key in commands){
				var command = commands[key];
				if(ch.cm.getLevel(event.tags.userId) >= command.level && !command.hidden){
					message += (prefix + command.name) + ' ';
				}
			}
		}
		if(message){
			chat.say(event.channel, message);
		}
	});
};
