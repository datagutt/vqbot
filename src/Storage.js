import fs from 'fs';
const Storage = function(file){
	const self = this;
	self.file = `${__dirname}/../db/${file}.json`;
	try{
		self.db = require(self.file);
	}catch(e){
		this.save();
	}
};
Storage.prototype = {
	db: {},
	get(key) {
		const self = this;
		return (self.db && self.db[key]) ? self.db[key] : false;
	},
	set(key, value) {
		const self = this;
		if(self.db && key){
			self.db[key] = value;
			self.save();
			return self.db[key];
		}
		return false;
	},
	del(key) {
		const self = this;
		if(self.db && key){
			delete self.db[key];
			self.save();
			return self.db[key];
		}
		return false;
	},
	save() {
		const self = this;
		fs.writeFile(self.file, JSON.stringify(self.db), err => {});
	}
}
export default Storage;