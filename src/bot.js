import TwitchJS from 'twitch-js';
import CommandManager from './CommandManager';
import PluginManager from './PluginManager';

global['USER_LEVEL_NORMAL'] = 0;
global['USER_LEVEL_MODERATOR'] = 1;
global['USER_LEVEL_ADMIN'] = 2;

class Bot {
	constructor(config) {
		this.config = config;
		this.channels = [];
		this.client = new TwitchJS({
			token: config.token,
			username: config.username
		});
		this.config.channels.forEach((channel) => {
			this.addChannel(channel);
		});
	
	}

	getUsernameFromRaw(raw){
		const match = raw.match(/@([a-z_0-9]*).tmi.twitch.tv/);
		if(match){
			return match[1];
		}
		return null;
	}

	getChannel(name){
		return this.channels[name];
	}

	addChannel(channel){
		var self = this;
		var name = channel.name;
		if(!name) return;
		if(channel.client) return;
		if(!this.channels[name]) {
			this.channels[name] = {
				'name': name,
				'client': this.client,
				'levels': channel.levels || []
			}
		}
		this.channels[name].cm = new CommandManager(this.channels[name]);
		this.channels[name].pm = new PluginManager(this.channels[name]);
		this.channels[name].pm.loadPlugins('../plugins/');
	}

	addCommand(channel, command, level, callback){
		if(channel){
			var ch = this.getChannel(channel);
			ch.cm.register(command, level, callback);
			return true;
		}
		return false;
	}

	start(){
		let self = this;
		const { api, chat, chatConstants } = this.client;

		chat.on('PRIVMSG', (privateMessage) => {
			if(!privateMessage.tags.username){
				privateMessage.tags.username = this.getUsernameFromRaw(privateMessage._raw);
			}
			if(privateMessage.message && privateMessage.message.trim() === 'gachiBASS'){
				chat.say(privateMessage.channel, 'gachiBASS').catch(() => {});
			}
			if(privateMessage.message && privateMessage.message.trim() === 'ricardoFlick'){
				chat.say(privateMessage.channel, 'ricardoFlick').catch(() => {});
			}
		});

		chat.on('JOIN', joinMessage => {
			if(joinMessage.username === self.config.username) {
				console.log('hei', joinMessage);
				console.log('Bot has joined ', joinMessage.channel);
				if(self.config.greetOnBotJoin){
					chat.say(joinMessage.channel, `Bot has joined ${joinMessage.channel}`);
				}
			}
		});

		Object.keys(self.channels).forEach(channel => {
			console.log(channel);
			let ch = self.getChannel(channel);
			chat.on(`PRIVMSG/${channel}`, ch.cm.addListener.bind(ch.cm));
		});

		const log = msg => console.log(msg);
		//chat.on(chatConstants.EVENTS.ALL, log);
		chat
		.connect()
		.then(() => {
			Promise.all(Object.keys(self.channels).map(channel => chat.join(channel)))
			.then(channelStates => {
			});
		});
	}
}
export default Bot
