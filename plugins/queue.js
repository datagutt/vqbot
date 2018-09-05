import Storage from '../src/Storage';
export default (ch) => {
	const { chat, chatConstants } = ch.client;
	var re = new RegExp("^[&|#][^, "+String.fromCharCode(7)+"]+$", "i");

	if(!ch.name.match(re)) return;

	var QueueStorage = new Storage(`queue_${ch.name}`),
		subQueue = QueueStorage.get('subQueue') || [],
		queue = QueueStorage.get('queue') || [];

	function getQueue() {
		return subQueue.concat(queue);
	}

	ch.cm.addCommand('queue', 'Show people in queue', false, USER_LEVEL_NORMAL, false, (event) => {
		var msg = 'Queue:\n',
			combinedQueue = getQueue();
		combinedQueue.forEach((u) => {
			msg += `${u.name} `;
		});
		chat.say(event.channel, msg).catch(() => {});
	}, true);
	ch.cm.addCommand('q', 'Show people in queue', false, USER_LEVEL_NORMAL, true, (event) => {
		var msg = 'Queue:\n',
			combinedQueue = getQueue();
		combinedQueue.forEach((u) => {
			msg += `${u.name} `;
		});
		chat.say(event.channel, msg).catch(() => {});
	}, true);
	ch.cm.addCommand('join', 'Join queue', '<info>', USER_LEVEL_NORMAL, false, (event) => {
		var isInQueue;
		getQueue().forEach((item, index, object) => {
			if(item && item.name == event.tags.displayName){
				isInQueue = true;
			}
		});
		if(!isInQueue){
			(event.tags.isSubscriber ? subQueue : queue).push({
				name: event.tags.displayName,
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
			if(item && item.name == event.tags.displayName){
				object.splice(index, 1);
			}
		});
		queue.forEach((item, index, object) => {
			if(item && item.name == event.tags.displayName){
				object.splice(index, 1);
			}
		});
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	});
	ch.cm.addCommand('qnext', 'Go to next person(s) in queue', '<amount>', USER_LEVEL_MODERATOR, false, (event) => {
		var combinedQueue = getQueue();
		var names = [];
		var amount = (event.state && +event.state[0]) || 1;
		for(var i = 0; i <= amount; i++){
			if(combinedQueue.length > 0){
				var winner = combinedQueue.shift();
				if(subQueue.indexOf(winner) > -1){
					subQueue.splice(subQueue.indexOf(winner), 1);
				}else if(queue.indexOf(winner) > -1){
					queue.splice(queue.indexOf(winner), 1);
				}
				names.push(`@${winner.name}`);
			}

			if(i == amount){
				chat.say(event.channel, `${names.join(' ')} is next in queue!`).catch(() => {});
			}
		}
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
	});
	ch.cm.addCommand('qremove', 'Remove person from queue', '', USER_LEVEL_MODERATOR, false, (event) => {
		var combinedQueue = getQueue()
		var user = event.params[0];
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
		subQueue = [];
		queue = [];
		QueueStorage.set('subQueue', subQueue);
		QueueStorage.set('queue', queue);
		chat.whisper(event.tags.displayName, `Queue cleared in ${event.channel}`).catch(() => {});
	});
	ch.cm.addCommand('test', 'test command', false, USER_LEVEL_MODERATOR, false, (event) => {
		console.log('inside test command', event);
	});
};