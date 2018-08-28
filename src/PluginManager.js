import Fs from 'fs';
import path from 'path';

class PluginManager {
    constructor(ch) {
        const self = this;
        self.plugins = {};
        self.ch = ch;
    }

    loadPlugins(dir) {
		const self = this;
		if(!dir){
			throw new Error('You did not specifiy a plugin directory!')
		}
		dir = `${__dirname}/${dir}`;
		Fs.exists(dir, exists => {
			console.log('exists', exists);
			if(exists){
				const tmpDir = Fs.readdirSync(dir);
				for(var file in tmpDir){
					if(tmpDir.hasOwnProperty(file) && tmpDir[file].indexOf('.js') == tmpDir[file].length - 3){
						self.load(dir, tmpDir[file]); 
					}
				}
			}
		});
	}

    reloadPlugins(dir) {
		const self = this;
		if(!dir){
			throw new Error('You did not specifiy a plugin directory!')
		}
		Fs.exists(dir, exists => {
			if(exists){
				const tmpDir = Fs.readdirSync(dir);
				self.ch.CommandManager.commands = {};
				for(file in tmpDir){
					if(tmpDir.hasOwnProperty(file) && tmpDir[file].indexOf('.js') == tmpDir[file].length - 3){
						self.reload(dir, tmpDir[file]); 
					}
				}
			}
		});
	}

    load(dir, file) {
		const self = this;
		self.plugins[file] = require(dir + file).default(self.ch);
		//self.watch(dir, file);
	}

    reload(dir, file) {
		const self = this;
		delete require.cache[path.resolve(`${__dirname}/plugins/`, file)];
		self.plugins[file] = require(dir + file).default(self.ch);
	}

    watch(dir, file) {
		const self = this;
		Fs.watchFile(dir + file, (curr, prev) => {
			if (curr.mtime > prev.mtime) { 
				self.load(dir, file);
			}
		});
	}
}

export default PluginManager;
