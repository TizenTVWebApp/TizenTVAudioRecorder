/*License (MIT)

Copyright © 2013 Matt Diamond

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of 
the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.
*/

(function(window) {
	
    var WORKER_PATH = '../../micphone/recorderjs/recorderWorker.js';
    var blobcallback, callbackupload;
    var Recorder = function(source, cfg) {
        var config = cfg || {};

        var bufferLen = 0;
        bufferLen = config.bufferLen ? config.bufferLen : bufferLen;
        console.log(bufferLen);
        this.context = source.context;
        if (!this.context.createScriptProcessor) {
            this.node = this.context.createJavaScriptNode(bufferLen, 2, 2);
        } else {
            this.node = this.context.createScriptProcessor(bufferLen, 2, 2);
        }


        var recording = false,
            workerCreated = false,
            currCallback;
        
        var saveFolder,
        	saveFilename;

        /*this.createWorker();
   
    workerCreated = true;*/
        this.node.onaudioprocess = function(e) {
            if (!recording) return;
            console.log(12);
            worker.postMessage({
                command: 'record',
                buffer: [
                    e.inputBuffer.getChannelData(0),
                    e.inputBuffer.getChannelData(1)
                ]
            });
        }

        this.configure = function(cfg) {
            for (var prop in cfg) {
                if (cfg.hasOwnProperty(prop)) {
                    config[prop] = cfg[prop];
                }
            }
        }

        this.createWorker = function() {
            var that = this;
            if (!workerCreated) {
                worker = new Worker(config.workerPath || WORKER_PATH);
                worker.postMessage({
                    command: 'init',
                    config: {
                        sampleRate: this.context.sampleRate
                    }
                });
                worker.onmessage = function(e) {
                    var blob = e.data;
                    console.log();
                    if (e.data.cmd == "uploadstatus") {
                        if (e.data.res == "uploading") {
                            console.log(e.data.percent);
                            console.log(parent.document.querySelector('.upload-progress-num'));
                            parent.document.querySelector('.upload-progress-num').style.width = e.data.percent * 1210 + 'px';
                        }
                        if (e.data.res == "complete") {
                            console.log("complete");
                            parent.document.querySelector('.upload-progress-num').style.width = 1 * 1210 + 'px';
                            blobcallback(e.data.text)
                            that.distroy();
                        }
                        if(e.data.res == "fail"){
                        	console.log("fail");
                        	 blobcallback(e.data.text)
                             that.distroy();
                        }
                    }else if(e.data.cmd=="save"){
                    	that.saveBlobtoLocal(e.data.blob);
                    }else {
                        currCallback(blob);
                    }
                };
            }
        }
        this.record = function() {
            this.createWorker();
            recording = true;
        }

        this.stop = function() {
            recording = false;
        }

        this.clear = function() {
            worker.postMessage({ command: 'clear' });
        }

        this.distroy = function() {
            console.log("distroy~~~");
            this.clear();
            worker.terminate();
            workerCreated = false;
        }

        this.getBuffers = function(cb, callback, callbackuploads) {
            currCallback = cb || config.callback;
            blobcallback = callback;
            callbackupload = callbackuploads;
            console.log('getBuffers')
            worker.postMessage({
                command: 'getBuffers'
            })
        }

        this.exportWAV = function(cb, type) {
            currCallback = cb || config.callback;
            type = type || config.type || 'audio/wav';
            if (!currCallback) throw new Error('Callback not set');
            console.log('exportWAV');
            worker.postMessage({
                command: 'exportWAV',
                type: type
            });
        }

        this.exportMonoWAV = function(cb, type) {
            currCallback = cb || config.callback;
            type = type || config.type || 'audio/wav';
            if (!currCallback) throw new Error('Callback not set');
            worker.postMessage({
                command: 'exportMonoWAV',
                type: type
            });
        }

        this.upload = function(serverurl, options) {
            if (!serverurl) return;
            
            console.log(serverurl);
            console.log(options);
            worker.postMessage({
                command: 'upload',
                url: serverurl,
                options: options
            });
        }
        
        this.save =function(folder,name){
        	 console.log(name);
        	 
        	 saveFolder = folder || 'music'; 
        	 
        	 saveFilename = name || 'SOUND_' + Date.now().toString() + '.wav';

        	 var type = "";
        	 
        	 worker.postMessage({
                 command: 'saveFile',
                 type: type
             });
        	 
        }
        
        this.saveBlobtoLocal = function(blob){
        	
        	var data = null;
        	
        	 var reader = new FileReader();
             reader.onload =function(event) {
         		//console.log(event.target.result);
         		//console.log(reader.result);
         	    data = reader.result;
         	    
         	    var fileName = 'Record_' + Date.now().toString() + '.wav';

         	    data = data.replace('data:audio/wav;base64,', '').replace('data:,', '');
         	    //parent.saveDataToLocalFile(data,filename);

         	   tizen.filesystem.resolve('music', function(dir) {
        	        console.log('savesound');
        	        var file = dir.createFile(saveFilename);
        	        file.openStream('w', function(stream) {
        	            stream.writeBase64(data);
        	            stream.close();
        	            console.log('Sound saved to "' + file.toURI() + '"');
        	        }, function(e) {
        	            console.log('Error: ' + e.message);
        	        }, 'UTF-8');
        	    }, function(e) {
        	        console.log('Error: ' + e.message);
        	    });
         	}
         	reader.readAsDataURL(blob);
        	
        	// data = blob.replace('data:audio/wav;base64,', '').replace('data:,', '');
        	
        	
        }
        
        this.blobToFile = function(theBlob,fileName){
        	theBlob.lastModifiedDate = new Date();
        	theBlob.name = fileName;
        	return theBlob;
        }
        
        source.connect(this.node);
        this.node.connect(this.context.destination); // if the script node is not connected to an output the "onaudioprocess" event is not triggered in chrome.
    };

    window.Recorder = Recorder;

})(window);