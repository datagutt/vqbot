import Storage from '../src/Storage';

const CHANNEL_REGEX = new RegExp("^[&|#][^, "+String.fromCharCode(7)+"]+$", "i");
export default (ch) => {
	const { chat, chatConstants } = ch.client;

	if(!ch.name || !ch.name.match(CHANNEL_REGEX)) return;

	var QueueStorage = new Storage(`queue_${ch.name}`),
		subQueue = QueueStorage.get('subQueue') || [],
		queue = QueueStorage.get('queue') || [];

	function getQueue() {
		return subQueue.concat(queue);
	}

	function isQueueOpen() {
		return !!QueueStorage.get('open');
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

	function clearQueue(){
		subQueue = [];
		queue = [];
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	}

	if(!QueueStorage.db.hasOwnProperty('open')){
		QueueStorage.set('open', true);
	}

	ch.cm.addCommand('queue', 'Show people in queue', false, USER_LEVEL_NORMAL, false, showQueue, true);
	ch.cm.addCommand('q', 'Show people in queue', false, USER_LEVEL_NORMAL, true, showQueue, true);
	ch.cm.addCommand('join', 'Join queue', '<info>', USER_LEVEL_NORMAL, false, (event) => {
		var isInQueue;
		if(!isQueueOpen()){
			chat.say(event.channel, 'Queue is closed').catch(() => {});
			return;
		}
		getQueue().forEach((item, index, object) => {
			if(item && item.name == event.tags.username){
				isInQueue = true;
			}
		});
		if(!isInQueue){
			(event.tags.isSubscriber ? subQueue : queue).push({
				name: event.tags.username,
				params: event.params,
			});
			QueueStorage.set(
				event.tags.isSubscriber ? 'subQueue' : 'queue',
				(event.tags.isSubscriber ? subQueue : queue)
			);
		}
	});
	ch.cm.addCommand('leave', 'Leave queue', '', USER_LEVEL_NORMAL, false, (event) => {
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
	});
	ch.cm.addCommand('qopen', 'Opens up queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		QueueStorage.set('open', true);
		chat.say(event.channel, 'Queue is now open!').catch(() => {});
	});
	ch.cm.addCommand('qclose', 'Closes queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		QueueStorage.set('open', false);
		chat.say(event.channel, 'Queue is now closed!').catch(() => {});
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
		var combinedQueue = getQueue()
		var user = event.params[0].toLowerCase();
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
	});
	ch.cm.addCommand('qclear', 'Clear queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		clearQueue();
		chat.whisper(event.tags.username, `Queue cleared in ${event.channel}`).catch(() => {});
	});
};