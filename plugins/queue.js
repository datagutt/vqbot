import Storage from '../src/Storage';

const CHANNEL_REGEX = new RegExp("^[&|#][^, "+String.fromCharCode(7)+"]+$", "i");

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export default (ch) => {
	const { chat, chatConstants } = ch.client;

	if(!ch.name || !ch.name.match(CHANNEL_REGEX)) return;

	var QueueStorage = new Storage(`queue_${ch.name}`),
		subQueue = QueueStorage.get('subQueue') || [],
		queue = QueueStorage.get('queue') || [],
		blocked = QueueStorage.get('blocked') || [];

	function removeUser(params){
		var user = params[0].toLowerCase();
		if(user){
			subQueue.forEach((item, index, object) => {
				if(item && item.name == user){
					object.splice(index, 1);
				}
			});
			queue.forEach((item, index, object) => {
				if(item && item.name == user){
					object.splice(index, 1);
				}
			});
		}
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	}

	function getQueue() {
		return subQueue.concat(queue);
	}

	function isQueueOpen() {
		return !!QueueStorage.get('open');
	}

	function isSubPriority() {
		return !!QueueStorage.get('subPriority');
	}

	function useNorwegianAlias() {
		return !!QueueStorage.get('norwegianAlias');
	}

	function showQueue(event) {
		var msg = 'Queue:\n',
			combinedQueue = getQueue();
		combinedQueue.forEach((u) => {
			msg += `${u.name} `;
		});
		
		if(!isQueueOpen()){
			msg += ' (Queue is closed) ';
		}
		chat.say(event.channel, msg).catch(() => {});
	}

	function joinQueue(event){
		var isInQueue;
		console.log('join', event);
		var shouldBeSub;
		if(isSubPriority()){
			shouldBeSub = (event.tags && event.tags.badges) 
				? event.tags.badges.subscriber >= 0 || (typeof event.tags.badges.founder !== 'undefined') || event.tags.badges.broadcaster : false;
		}else{
			shouldBeSub = false;
		}
		if(!isQueueOpen()){
			chat.say(event.channel, 'Queue is closed').catch(() => {});
			return;
		}
		getQueue().forEach((item) => {
			if(item && item.name == event.tags.username){
				isInQueue = true;
			}
		});
		if(!isInQueue && blocked.indexOf(event.tags.username) === -1){
			(shouldBeSub ? subQueue : queue).push({
				name: event.tags.username,
				params: event.params,
			});
			QueueStorage.set(
				shouldBeSub ? 'subQueue' : 'queue',
				(shouldBeSub ? subQueue : queue)
			);
		}
	}

	function leaveQueue(event){
		subQueue.forEach((item, index, object) => {
			if(item && item.name == event.tags.username){
				object.splice(index, 1);
			}
		});
		queue.forEach((item, index, object) => {
			if(item && item.name == event.tags.username){
				object.splice(index, 1);
			}
		});
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	}

	function clearQueue(){
		subQueue = [];
		queue = [];
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	}

	if(!QueueStorage.db.hasOwnProperty('open')){
		QueueStorage.set('open', true);
	}

	if(useNorwegianAlias){
		ch.cm.addCommand('kø', 'Vis folk i kø', false, USER_LEVEL_NORMAL, false, showQueue, true);
	}
	ch.cm.addCommand('queue', 'Show people in queue', false, USER_LEVEL_NORMAL, false, showQueue, true);
	ch.cm.addCommand('q', 'Show people in queue', false, USER_LEVEL_NORMAL, true, showQueue, true);
	if(useNorwegianAlias){
		ch.cm.addCommand('blimed', 'Bli med i køen', false, USER_LEVEL_NORMAL, false, joinQueue);
	}
	ch.cm.addCommand('join', 'Join queue', '<info>', USER_LEVEL_NORMAL, false, joinQueue);
	if(useNorwegianAlias){
		ch.cm.addCommand('forlat', 'Forlat køen', false, USER_LEVEL_NORMAL, false, leaveQueue);
	}
	ch.cm.addCommand('leave', 'Leave queue', '', USER_LEVEL_NORMAL, false, leaveQueue);
	ch.cm.addCommand('qopen', 'Opens up queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		QueueStorage.set('open', true);
		chat.say(event.channel, 'Queue is now open!').catch(() => {});
	});
	ch.cm.addCommand('qclose', 'Closes queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		QueueStorage.set('open', false);
		chat.say(event.channel, 'Queue is now closed!').catch(() => {});
	});
	ch.cm.addCommand('qblock', 'Block person from queue', '<info>', USER_LEVEL_MODERATOR, false, (event) => {
		var user = event.params[0].toLowerCase();
		// TODO: make this work for all mods omegalul
		if(user === 'datagutt') return;
		// First remove user from queue
		removeUser(event.params);
		blocked.push(user);
		chat.whisper(event.tags.username, `${user} has been naughty, and can no longer join queue.`).catch(() => {});
		QueueStorage.set('blocked', blocked);
	});
	ch.cm.addCommand('qunblock', 'Unblock person from queue', '<info>', USER_LEVEL_MODERATOR, false, (event) => {
		var user = event.params[0].toLowerCase();
		blocked.forEach((item, index, object) => {
			if(item && item.toLowerCase() === user){
				object.splice(index, 1);
			}
		});
		chat.whisper(event.tags.username, `${user} has been pardoned, and can now join queue.`).catch(() => {});
		QueueStorage.set('blocked', blocked);
	});
	ch.cm.addCommand('qrandom', 'Grab random person from queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		var combinedQueue = getQueue();
		var user = combinedQueue[getRandomInt(0, combinedQueue.length)];
		if(user){
			subQueue.forEach((item, index, object) => {
				if(item && item.name == user.name){
					object.splice(index, 1);
					chat.say(event.channel, `${user.name} is next in queue!`).catch(() => {});
				}
			});
			queue.forEach((item, index, object) => {
				if(item && item.name == user.name){
					object.splice(index, 1);
					chat.say(event.channel, `${user.name} is next in queue!`).catch(() => {});
				}
			});
		}
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	});
	ch.cm.addCommand('qnext', 'Go to next person(s) in queue', '<amount>', USER_LEVEL_MODERATOR, false, (event) => {
		var combinedQueue = getQueue();
		var names = [];
		var amount = (event.params && parseInt(event.params[0], 10)) || 1;
		for(var i = 0; i < amount; i++){
			if(combinedQueue.length > 0){
				var winner = combinedQueue.shift();
				if(subQueue.indexOf(winner) > -1){
					subQueue.splice(subQueue.indexOf(winner), 1);
				}else if(queue.indexOf(winner) > -1){
					queue.splice(queue.indexOf(winner), 1);
				}
				names.push(`@${winner.name}`);
			}

			if(i == amount - 1){
				chat.say(event.channel, `${names.join(' ')} is next in queue!`).catch(() => {});
			}
		}
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	});
	ch.cm.addCommand('qremove', 'Remove person from queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		if(event.params && event.tags && event.tags.username && event.params[0] === "datagutt" && event.tags.username !== event.params[0]){
		console.log('nou');
		}else{
			removeUser(event.params);
		}
	});
	ch.cm.addCommand('subpriority', 'Enable/disable subpriority', '', USER_LEVEL_MODERATOR, false, (event) => {
		let subpriority = !isSubPriority();
		QueueStorage.set('subPriority', subpriority);
		chat.say(event.channel, `Sub queue is now ${isSubPriority() ? 'enabled' : 'disabled'}!`).catch(() => {});
	});
	ch.cm.addCommand('norwegianAlias', 'Enable/disable norwegian alias', '', USER_LEVEL_MODERATOR, false, (event) => {
		let norwegianalias = !useNorwegianAlias();
		QueueStorage.set('norwegianAlias', norwegianalias);
		chat.say(event.channel, `Norwegian alias ${useNorwegianAlias() ? 'enabled' : 'disabled'}!`).catch(() => {});
	});
	ch.cm.addCommand('qclear', 'Clear queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		clearQueue();
		chat.whisper(event.tags.username, `Queue cleared in ${event.channel}`).catch(() => {});
	});
};
