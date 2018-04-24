# TizenTVAudioRecorder

HTML5 Audio Recorder ( kalaoke App)

## OverView

TizenTVAudioRecorder is a AudioRecorder tutorial based on HTML5 API and Tizen API .
It reuse recorder.js which is a web audio recoder module for recording/exporting the output of Web Audio API nodes.
It also call tizen micphone api to control the micphone device for better output performance.

## Reference

- recorder.js : 

  * https://www.npmjs.com/package/recorderjs
  
  * change something to suit tizen platform based on the original code.
  
- Tizen API : 

  * http://developer.samsung.com/tv/develop/api-references/samsung-product-api-references
  
## Usage

- add privilege :

  * <tizen:privilege name="http://developer.samsung.com/privilege/microphone"/> 
  
  * <tizen:privilege name="http://tizen.org/privilege/mediacapture"/> 

- include js ：

  * <script src="micphone/getMicrophones.js"></script> 
  
  * <script src="micphone/recorderjs/recorder.js"></script> 
  
  * <script src="micphone/recorderjs/recorderWorker.js"></script> 
  
- API ：

  * enableMicphoneOutput()
  
  * disableMicphoneOutput()
  
  * startRecord()
  
  * PauseRecord()

  * stopRecordandSaveToLocal()
  
  * stopRecordandUpload()
 
   
