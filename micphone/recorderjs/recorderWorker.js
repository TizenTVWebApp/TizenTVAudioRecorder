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

var recLength = 0,
    recBuffersL = [],
    recBuffersR = [],
    sampleRate;
var server = null,
    userid = null;

this.onmessage = function(e) {
    switch (e.data.command) {
        case 'init':
            init(e.data.config);
            break;
        case 'record':
            record(e.data.buffer);
            break;
        case 'exportWAV':
            exportWAV(e.data.type);
            break;
        case 'exportMonoWAV':
            exportMonoWAV(e.data.type);
            break;
        case 'getBuffers':
            getBuffers();
            break;
        case 'upload':
            console.log(e.data);
            server = e.data.url;
            userid = e.data.id;
            Upload({
                url: e.data.url,
                options: e.data.options
            });
            break;
        case 'saveFile':
        	console.log(e.data);
        	saveFile(e.data);
        	break;
        case 'clear':
            clear();
            break;
    }
};

function init(config) {
    clear();
    sampleRate = config.sampleRate;
}

function record(inputBuffer) {
	console.log("recording");
    recBuffersL.push(inputBuffer[0]);
    recBuffersR.push(inputBuffer[1]);
    recLength += inputBuffer[0].length;
}

function exportWAV(type) {
    var bufferL = mergeBuffers(recBuffersL, recLength);
    var bufferR = mergeBuffers(recBuffersR, recLength);
    var interleaved = interleave(bufferL, bufferR);
    var dataview = encodeWAV(interleaved);
    var audioBlob = new Blob([dataview], {
        type: type
    });
    this.postMessage(audioBlob);
}

function exportMonoWAV(type) {
    var bufferL = mergeBuffers(recBuffersL, recLength);
    var dataview = encodeWAV(bufferL, true);
    var audioBlob = new Blob([dataview], {
        type: type
    });
    this.postMessage(audioBlob);
}

function getBuffers() {
    var buffers = [];
    //buffers.push( mergeBuffers(recBuffersL, recLength) );
    //buffers.push( mergeBuffers(recBuffersR, recLength) );
    this.postMessage(buffers);
}

function mergeBuffersinterleave(recBuffersL, recBuffersR, recLength) {
    var length = recLength * 2;
    var result = new Float32Array(recLength * 2);
    var buffer = new Float32Array(recLength);
    var offset = 0,
        index = 0,
        inputIndex = 0;
    for (var i = 0; i < recBuffersL.length; i++) {
        buffer.set(recBuffersL[i], offset);
        offset += recBuffersL[i].length;
    }
    while (index < length) {
        result[index++] = buffer[inputIndex];
        index++;
        inputIndex++;
    }
    offset = 0,
        index = 0,
        inputIndex = 0;
    for (var i = 0; i < recBuffersR.length; i++) {
        buffer.set(recBuffersR[i], offset);
        offset += recBuffersR[i].length;
    }
    while (index < length) {
        index++;
        result[index++] = buffer[inputIndex];
        inputIndex++;
    }
    return result;
}

function clear() {
    recLength = 0;
    recBuffersL = [];
    recBuffersR = [];
}

function mergeBuffers(recBuffers, recLength) {
    var result = new Float32Array(recLength);
    var offset = 0;
    for (var i = 0; i < recBuffers.length; i++) {
        result.set(recBuffers[i], offset);
        offset += recBuffers[i].length;
    }
    return result;
}

function interleave(inputL, inputR) {
    var length = inputL.length + inputR.length;
    var result = new Float32Array(length);
    var index = 0,
        inputIndex = 0;
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

function floatTo16BitPCM(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function encodeWAV(samples, mono) {
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 32 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, mono ? 1 : 2, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
}

function saveFile(config){
	console.log("saveFile");
	 var interleaved = mergeBuffersinterleave(recBuffersL, recBuffersR, recLength)
	 var dataview = encodeWAV(interleaved);
	 var blob = new Blob([dataview], {
	        type: 'audio/wav'
	 });
	 
	 this.postMessage({cmd:'save',blob:blob});
	 
}

function Upload(options) {
    console.log("setupDownload");
    var url = options.url;
    var options = options.options;
    var chunked = options.chunked || false;
    var chunkSize = options.chunkSize || (10 * 1024 * 1024);
    var formDataIn = options.formData||{};
    var that = this;

    //encodeWAV imporved memory leak on Tizen TV
    var interleaved = mergeBuffersinterleave(recBuffersL, recBuffersR, recLength)
    var dataview = encodeWAV(interleaved);
    var blob = new Blob([dataview], {
        type: 'audio/wav'
    });
    /*
    bufferL = null;
    bufferR = null;
    recBuffersL = [];
    recBuffersR = [];
    interleaved = null;
	*/

    var totalload = 0;
    var oldtalload = 0;
    var nowtalload = 0;

    var totalsize = blob.size;
    if (!chunked) chunkSize = totalsize;
    var sta = 0; //从零处开始截取
    var end = sta + chunkSize;

    var uploadTimer = 0;
    var uploadAllTimer = Math.ceil(totalsize / chunkSize);
    sendFile();

    function sendFile() {
        if (sta < totalsize) {
            uploadTimer++;
            var xhr = new XMLHttpRequest();
            var formData = new FormData();
            formData.append('mimeType', blob.type);
            formData.append('sort', (uploadTimer - 1));
            if (uploadTimer == uploadAllTimer) {
                formData.append('isEnd', true);
            } else {
                formData.append('isEnd', false);
            }            
            for(var key in formDataIn){
            	formData.append(key,formDataIn[key]);
            }            
            formData.append('file', blob.slice(sta, end) || blob.webkitSlice(sta, end)); //格式化
            sendpost();

            function sendpost() {
                //post发送
                xhr.open('POST', url, true);
                xhr.upload.addEventListener("progress", uploadProgress);
                xhr.upload.addEventListener("load", loadComplete);
                xhr.onerror = function(){
                	that.postMessage({
                        cmd: 'uploadstatus',
                        res: 'fail',
                        text: {
                            result: 0
                        }
                    });	
                }
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            console.log(sta);
                            if (sta < totalsize) {
                                xhr.upload.removeEventListener("progress", uploadProgress);
                                xhr.upload.removeEventListener("load", loadComplete);
                                oldtalload = 0;
                                nowtalload = 0;
                                console.log("upload complete");
                                that.postMessage({
                                    cmd: 'uploadstatus',
                                    res: 'part complete',
                                    percent: 1
                                });
                                sendFile();
                            } else {
                                var text = xhr.responseText;
                                console.log(text);
                                xhr.upload.removeEventListener("progress", uploadProgress);
                                xhr.upload.removeEventListener("load", loadComplete);
                                console.log("upload finished");
                                that.postMessage({
                                    cmd: 'uploadstatus',
                                    res: 'complete',
                                    text: JSON.parse(text)
                                });
                            }
                        }else{
                        	that.postMessage({
                                cmd: 'uploadstatus',
                                res: 'fail',
                                text: {
                                    result: 0
                                }
                            });	
                        }
                    };
                };
                try {
                    xhr.send(formData);
                    sta = end;
                    end += chunkSize;
                } catch (e) {
                    that.postMessage({
                        cmd: 'uploadstatus',
                        res: 'fail',
                        text: {
                            result: 0
                        }
                    });
                };
            }
            console.log('start');

            function loadComplete(evt) {
                console.log("load complete");
                console.log(evt);
            }

            function uploadProgress(evt) {
                console.log(Math.round((totalload)));
                if (evt.lengthComputable) {
                    oldtalload = nowtalload;
                    nowtalload = evt.loaded;
                    totalload += (nowtalload - oldtalload);
                    that.postMessage({
                        cmd: 'uploadstatus',
                        res: 'uploading',
                        percent: Math.round((totalload / totalsize) * 100) / 100
                    });
                }
            }
        }
    }


}