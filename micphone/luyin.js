

function toggleRecording( e ) {
    if (e.classList.contains("recording")) {
    	 // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        //audioRecorder.getBuffers( gotBuffers );
        audioRecorder.exportWAV( doneEncoding);
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
    console.log('gotBuffers');
    
    //var formData = new FormData(); //定义一个FormData数组
    var random = parseInt(Math.random() * (50 - 30 + 1) + 30);
    var Millisecond = new Date().getTime();
    
    //formData.append('fileToken', userid + '_' + random + '+' + Millisecond);
    var options = {
    		formData:{'fileToken':userid + '_' + random + '+' + Millisecond},
    		chunkSize:5 * 1024 * 1024,
    		chunked:true    		
    };
    audioRecorder.upload('http://sanxing.audiocn.org:8080/tian-fileopera/upload/toQiniu.action',options);
}
var recIndex = 0;
function doneEncoding( blob ) {
    console.log('doneEncoding');
    setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    recIndex++;
}

function setupDownload(blob, filename){
	console.log("setupDownload");
	
	/*var reader = new FileReader();
	console.log(reader);
	var data = null;//reader.readAsDataURL(blob).replace('data:image/png;base64,', '').replace('data:,', '');
	
	parent.saveDataToLocalFile(blob,filename,"arraybuffer");*/
	/*reader.onload =function(event) {
		//console.log(event.target.result);
		//console.log(reader.result);
	    data = reader.result;
	    
	    var fileName = 'Record_' + Date.now().toString() + '.wav';

	    data = data.replace('data:audio/wav;base64,', '').replace('data:,', '');
	    parent.saveDataToLocalFile(data,filename);

	    
	}
	reader.readAsDataURL(blob);*/
	
	
	
	var random = parseInt(Math.random()*(50-30+1)+30);
    var Millisecond = new Date().getTime();
    
    var totalload = 0;
    var oldtalload = 0;
    var nowtalload = 0;

    var  LENGTH =  100 * 1024 * 1024; //每次截取的长度
    var sta = 0;        //从零处开始截取
    var end = sta +LENGTH;
    var totalsize = blob.size;
    var uploadTimer = 0;
    var uploadAllTimer = Math.ceil(totalsize / LENGTH);
    
    var file = new File([blob],"test.wav");
    console.log(file);
    
    console.log(WebUploader);
	var uploader = WebUploader.create({
		//server:'http://sanxing.audiocn.org:8080/tian-fileopera/upload/toQiniu.action',
		server:'http://192.168.1.110:9090',
		formData:{
			mimeType:'audio/wav',
			fileToken: userid+'_'+random+'+'+Millisecond,
			sort:uploadTimer-1,
			isEnd:(uploadTimer==uploadAllTimer)?true:false
		},
		chunked:false,
		chunkSize:512*1024,
		disableGlobalDnd:false,
		fileNumLimit:300,
		fileSingleSizeLimit:500*1024*1024,
		fileSizeLimit:500*1024*1024
	
	});
	uploader.on('uploadProgress',function(file,percent){
		console.log('uploadProgress'+percent);
		parent.document.querySelector('.upload-progress-num').style.width = (Math.round(percent*100)/100)*1210 +'px';
         
	});
	uploader.on('uploadSuccess',function(file){
		console.log('success');
	});
	uploader.on('uploadAccept',function(obj,ret){
		console.log('uploadAccept');
		console.log(obj);
		console.log(ret);
		blob = null;
		uploader.stop();
		uploader.destroy();
	});
	uploader.on('uploadComplete',function(file){
		console.log('uploadComplete');
		uploadsuccess();
		
	});
	uploader.on('uploadBeforeSend',function(block,data,headers){
		console.log('uploadBeforeSend');
	});
	uploader.on('fileQueued', function (file) {
		console.log('fileQueued');
		           // $("#uploader .filename").html("文件名：" + file.name);
	             //$("#uploader .state").html('等待上传');
	             });
	console.log(uploader.getFiles());
	
	var runtimeForRuid = new WebUploader.Runtime.Runtime();
	var file = new WebUploader.File(new WebUploader.Lib.File(WebUploader.guid('rt_'),file));
	console.log(uploader.getStats());
	uploader.addFile(file);
	console.log(uploader.getStats());
	console.log(uploader);
	console.log(WebUploader);
	console.log(uploader.getFiles());
	uploader.upload(file);
   /*var random = parseInt(Math.random()*(50-30+1)+30);
    var Millisecond = new Date().getTime();
   // console.log('md5start');
    var totalload = 0;
    var oldtalload = 0;
    var nowtalload = 0;

    var  LENGTH =  100 * 1024 * 1024; //每次截取的长度
    var sta = 0;        //从零处开始截取
    var end = sta +LENGTH;
    var totalsize = blob.size;
    var uploadTimer = 0;
    var uploadAllTimer = Math.ceil(totalsize / LENGTH);
    //console.log(blob.type);
    var blobMD5;
    //console.log(blob);
    sendFile();
    function sendFile(){
        if(sta < totalsize){
            uploadTimer++;
            var xhr = new XMLHttpRequest();
            var formData = new FormData(); //定义一个FormData数组
            // formData.append('uploadType',blob.type);
            formData.append('mimeType',blob.type);
            formData.append('fileToken',userid+'_'+random+'+'+Millisecond);
            formData.append('sort',(uploadTimer-1));
            // formData.append('fileMd5',blobMD5);
            if(uploadTimer == uploadAllTimer){
                formData.append('isEnd',true);
            }else{
                formData.append('isEnd',false);
            }
            formData.append('file',blob.slice(sta,end)||blob.webkitSlice(sta,end));//格式化
            
            //uploadsuccess();
            //return;
            sendpost();
            function sendpost() {
                //post发送
                xhr.open('POST','http://sanxing.audiocn.org:8080/tian-fileopera/upload/toQiniu.action',true);
                // xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.upload.addEventListener("progress", uploadProgress);
                xhr.upload.addEventListener("load",loadComplete);
                xhr.onreadystatechange = function(){
                    if(xhr.readyState == 4){
                        if (xhr.status == 200) {
                            if(sta < totalsize){
                                xhr.upload.removeEventListener("progress", uploadProgress);
                                xhr.upload.removeEventListener("load",loadComplete);
                                oldtalload = 0;
                                nowtalload = 0;
                                xhr = null;
                                formData.delete('file');
                                //sendFile();
                                uploadsuccess();
                            }else{
                                var text = xhr.responseText;
                                xhr.upload.removeEventListener("progress", uploadProgress);
                                xhr.upload.removeEventListener("load",loadComplete);
                                xhr = null;
                                formData.delete('file');
                                //blobcallback(JSON.parse(text));
                                audioRecorder.distroy();
                                uploadsuccess();
                            }
                            //console.log(text);
                        }
                    };
                };

                try{
                    xhr.send(formData);
                    sta = end;
                    end += LENGTH;
                    
                }catch (e){
                  //blobcallback({result:0});
              	  //uploadsuccess();
                };
            }
            console.log('start');
            function loadComplete(evt){
            	console.log("load complete");
            	blob=null;
            	xhr.abort();
            	delete xhr;
            	uploadsuccess();
            }
            function uploadProgress(evt){
                console.log(Math.round((totalload)));
                if (evt.lengthComputable) {
                    oldtalload = nowtalload;
                    nowtalload = evt.loaded;
                    totalload += (nowtalload - oldtalload);
                    //evt.loaded：文件上传的大小   evt.total：文件总的大小
                    // var percentComplete = Math.round((evt.loaded) * 100 / evt.total);
                    //加载进度条，同时显示信息
                    parent.document.querySelector('.upload-progress-num').style.width = (Math.round((totalload/totalsize)*100)/100)*1210 +'px';
                    
                    callbackupload(Math.round((totalload/totalsize)*100),function () {
                        xhr.abort();
                    });
                }
            }

        }
    }
*/

}

function blobToFile(theBlob,fileName){
	theBlob.lastModifiedDate = new Date();
	theBlob.name = fileName;
	return theBlob;
}


