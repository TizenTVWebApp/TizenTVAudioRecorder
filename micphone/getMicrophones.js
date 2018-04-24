

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();
var microPhone,
	microPhoneDevice,
	microphoneStatus = false,
	microphoneListenerID,
	audioRecorder = null,
	audioInput = null;
	
function saveDataToLocalFile(data, name, type) {
    console.log(name);
    var fileName = 'SOUND_' + Date.now().toString() + '.wav';

    tizen.filesystem.resolve('music', function(dir) {
        console.log('savesound');
        var file = dir.createFile(fileName);
        file.openStream('w', function(stream) {
            if (type == "arraybuffer") {
                stream.writeBytes(data);
            } else if (typelogo == "blob") {
                stream.writeBase64(data);
            } else {
                stream.writeBytes(data);
            }
            stream.close();
            console.log('Sound saved to "' + file.toURI() + '"');
        }, function(e) {
            console.log('Error: ' + e.message);
        }, 'UTF-8');
    }, function(e) {
        console.log('Error: ' + e.message);
    });
}

function onsuccess(mics) {
    if (mics && mics.length > 0) {
        for (var i = 0; i < mics.length; i++) {
            if (mics[i] != null) {
                //console.log( mics[i]);
                try {
                    var flag = webapis.microphone.isConnected(mics[i].uid);
                    microPhone = flag;
                    microPhoneDevice = mics[i];
                    try {
                        var value = microPhoneDevice.enableDevice(webapis.microphone.MICROPHONE_FORMAT_SIGNED_16BIT_LITTLE_ENDIAN, webapis.microphone.MICROPHONE_SAMPLE_RATE_48000);
                    } catch (error) {
                        console.log(" error code = " + error.code);
                    }
                    if (microphoneStatus) {
                        try {
                            value = device.play();
                            //console.log(value);
                        } catch (e) {
                            console.log(" error code = " + e.code);
                        }
                    }
                    //console.log(" microphone connected = " + flag);
                } catch (error) {
                    //console.log(" error code = " + error.code);
                }
            }
        }
    } else {
        //console.log("No microphone found. If you are sure to hook up a microphone, please try again a few seconds.");
    }
}

try {
    webapis.microphone.getMicrophones(onsuccess);
} catch (error) {
    console.log(" error code = " + error.code);
}
var callback = function(deviceInfo) {
    console.log("device name is " + deviceInfo.name);
    console.log("device uid is " + deviceInfo.uid);
    console.log("device eventType is " + deviceInfo.eventType);
    try {
        var flag = webapis.microphone.isConnected(deviceInfo.uid);
        microPhone = flag;
        var micTime;
        if (flag) {
            try {
                webapis.microphone.getMicrophones(onsuccess);
            } catch (error) {
                //console.log(" error code = " + error.code);
            }
            document.querySelector('.mic').innerHTML = '麦克风已连接';
            document.querySelector('.mic').style.display = 'block';
            window.clearTimeout(micTime);
            console.log('start');
            try {
                window.frames["childPage"].window.getnewMicrophone();
            } catch (e) {
                console.log(e)
            }
            console.log('end');
            micTime = setTimeout(function() {
                document.querySelector('.mic').style.display = 'none'
            }, 3000)
        } else {
            document.querySelector('.mic').innerHTML = '麦克风取消连接';
            document.querySelector('.mic').style.display = 'block';
            window.clearTimeout(micTime);
            micTime = setTimeout(function() {
                document.querySelector('.mic').style.display = 'none'
            }, 3000)
        }
        //console.log(" microphone connected = " + flag);
    } catch (error) {
        //console.log(" error code = " + error.code);
    }
}

try {
    microphoneListenerID = webapis.microphone.addMicrophoneConnectListener(callback);
    console.log("listener id = " + microphoneListenerID);
} catch (error) {
    console.log(" error code = " + error.code);
}

var MicrophonePlay = function(device) {
    try {
        console.log(device.uid);
        var flag = webapis.microphone.isConnected(device.uid);
        if (flag) {
            console.log(flag);
            var value = device.play();
            microphoneStatus = true;
        }
    } catch (e) {
        console.log(" error code = " + e.code);
    }
}

var MicrophoneStop = function(device) {
    try {
        var value = device.stop(webapis.microphone.MICROPHONE_STATUS_PLAY | webapis.microphone.MICROPHONE_STATUS_RECORD);
        microphoneStatus = false;
    } catch (error) {
        console.log(" error code = " + error.code);
    }
}

function toggleRecording(e) {
    if (e.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        //audioRecorder.getBuffers( gotBuffers );
        audioRecorder.exportWAV(doneEncoding);
    } else {
        // start recording
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        //audioRecorder.clear();
        audioRecorder.record();
    }
}

function gotBuffers(buffers) {
    // the ONLY time gotBuffers is called is right after a new recording is completed -
    // so here's where we should set up the download.
    var random = parseInt(Math.random() * (50 - 30 + 1) + 30);
    var Millisecond = new Date().getTime();
    var options = {
        chunkSize: 5 * 1024 * 1024,
        chunked: true
    };
    audioRecorder.upload('http://sanxing.audiocn.org:8080/tian-fileopera/upload/toQiniu.action', options);
}

var recIndex = 0;

function doneEncoding(blob) {
    console.log('doneEncoding');
    setupDownload(blob, "myRecording" + ((recIndex < 10) ? "0" : "") + recIndex + ".wav");
    recIndex++;
}

function enableMicphoneOutput() {
    
    if(microPhone){
    	  MicrophonePlay(microPhoneDevice);
    	  
    	  if (!navigator.getUserMedia)
    	    navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    	  if (!navigator.getUserMedia)
    	    return(console.log("Error: getUserMedia not supported!"));
    	    //console.log(constraints)
    	  
    	  var constraints = 
    	  {
    	    audio: {
    	        optional: [{ echoCancellation: false }]
    	    }
    	  };
    	  
    	  navigator.getUserMedia(constraints, gotStream, function(e) {
    	   	console.log('Error getting audio');
    	    //console.log(e);
    	    });    
    	 }
    
}

function disableMicphoneOutput() {
    
    if(microPhone){
    		MicrophoneStop(microPhoneDevice);
    }

}

function gotStream(stream) {

    var input = audioContext.createMediaStreamSource(stream);

    audioInput = input;

    audioRecorder = new Recorder( audioInput );

}

function startRecord(){
	
	if(audioRecorder){
		audioRecorder.record();
	}
}

function PauseRecord(){
	
	if(audioRecorder){
		audioRecorder.stop();
	}
}

function stopRecordandSaveToLocal(folder,filename){
	
	if(audioRecorder){
		audioRecorder.stop();
		audioRecorder.save(folder,filename);
	}
	
}

function stopRecordandUpload(url,config){
	
	if(audioRecorder){
		audioRecorder.stop();
		var options = config || {
    		chunkSize:5 * 1024 * 1024,
    		chunked:true    		
		};
    	audioRecorder.upload(url,options);
	}
	
}
