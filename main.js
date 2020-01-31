function babel_stop() {
  document.getElementById("stop_button").src = "./icons/blurstopbutton.png";
  document.getElementById("start_button").src = "./icons/startbutton.png";

  document.getElementById("stop_button").classList.remove('clickableimage');
  document.getElementById("start_button").classList.add('clickableimage');

  stopTranslator();
}

function babel_start() {
  document.getElementById("stop_button").src = "./icons/stopbutton.png";
  document.getElementById("start_button").src = "./icons/blurstartbutton.png";

  document.getElementById("stop_button").classList.add('clickableimage');
  document.getElementById("start_button").classList.remove('clickableimage');

  startTranslator();
  // startTranslation();
}


/*
Usage:
audioNode = createAudioMeter(audioContext,clipLevel,averaging,clipLag);

audioContext: the AudioContext you're using.
clipLevel: the level (0 to 1) that you would consider "clipping".
   Defaults to 0.98.
averaging: how "smoothed" you would like the meter to be over time.
   Should be between 0 and less than 1.  Defaults to 0.95.
clipLag: how long you would like the "clipping" indicator to show
   after clipping has occured, in milliseconds.  Defaults to 750ms.

Access the clipping through node.checkClipping(); use node.shutdown to get rid of it.
*/

// Code to detect voice intencity
var audioContext = null;
var meter = null;
var mediaStreamSource = null;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var canvasContext = null;
var WIDTH = 10;
var HEIGHT = 50;
var rafID = null;
var epochTime = Number(new Date());
var recordingState = false;
var browserName  = navigator.appName;

const nAgt = navigator.userAgent;
console.log('nAgt',nAgt,nAgt.includes('Chrome'));
async function startTranslator() {
  // grab our canvas
  canvasContext = document.getElementById("meterVolue");
  if (audioContext) {
    audioContext.resume().then(() => {
      console.log('Playback resumed successfully');
    });
  } else {
    AudioContext.prototype.hasOwnProperty('createScriptProcessor');
    // AudioContext.prototype.hasOwnProperty('createMediaStreamSource');
    audioContext = new AudioContext();
    
    
  }
  // Attempt to get audio input
  try {
    // monkeypatch getUserMedia
    navigator.getUserMedia = (
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
    // ask for an audio input
    console.log(navigator.mediaDevices.getUserMedia);
    console.log(navigator.getUserMedia);
    if (typeof navigator.mediaDevices !== 'undefined' && nAgt.includes('Chrome') ) {
      console.log( " Inside navigator.getUserMedia");
      var stream = await navigator.getUserMedia(
        {
          "audio": {
            "mandatory": {
              "googEchoCancellation": "true",
              "googAutoGainControl": "false",
              "googNoiseSuppression": "true",
              "googHighpassFilter": "true"
            },
            "optional": []
          },
        }, gotStream, didntGetStream);
    } else {
      console.log( " Inside navigator.mediaDevices.getUserMedia");
       var stream = await navigator.mediaDevices.getUserMedia(
        {
          "audio": {
            "mandatory": {
              "googEchoCancellation": "true",
              "googAutoGainControl": "false",
              "googNoiseSuppression": "true",
              "googHighpassFilter": "true"
            },
            "optional": []
          },
        });
        gotStream(stream);
        
    }
  } catch (e) {
    alert('getUserMedia threw exception :' + e);
  }
}

function didntGetStream() {
  alert('Stream generation failed.');
}

function gotStream(stream) {

  console.log('inside got stream');
  // Create an AudioNode from the stream.
  mediaStreamSource = audioContext.createMediaStreamSource(stream);
  // Create a new volume meter and connect it.
  meter = createAudioMeter(audioContext);
  mediaStreamSource.connect(meter);
  startRecording()
}

function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
  // console.log('inside createAudioMeter');
  var processor = audioContext.createScriptProcessor(512);
  processor.onaudioprocess = volumeAudioProcess;
  processor.clipping = false;
  processor.lastClip = 0;
  processor.volume = 0;
  processor.clipLevel = clipLevel || 0.98;
  processor.averaging = averaging || 0.95;
  processor.clipLag = clipLag || 750;
  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination);
  processor.checkClipping =
    function () {
      if (!this.clipping)
        return false;
      if ((this.lastClip + this.clipLag) < window.performance.now())
        this.clipping = false;
      return this.clipping;
    };
  processor.shutdown =
    function () {
      this.disconnect();
      this.onaudioprocess = null;
    };
  return processor;
}


volumeAudioProcess = (event) => {
  // console.log('Inside Volume processor')
  var buf = event.inputBuffer.getChannelData(0);
  var bufLength = buf.length;
  var sum = 0;
  var x;
  // Do a root-mean-square on the samples: sum up the squares...
  for (var i = 0; i < bufLength; i++) {
    x = buf[i];
    if (Math.abs(x) >= this.clipLevel) {
      this.clipping = true;
      this.lastClip = window.performance.now();
    }
    sum += x * x;
  }
  // ... then take the square root of the sum.
  var rms = Math.sqrt(sum / bufLength);
  // console.log('rms', rms);
  setVolumeInte(parseInt(String(rms * 100)));
  // Now smooth this out with the averaging factor applied
  // to the previous sample - take the max here because we
  // want "fast attack, slow release."
  this.volume = Math.max(rms, this.volume * this.averaging);
}


function setVolumeInte(meterVolume) {
  // console.log('meterVolume', meterVolume);
  var currentEpochTime = Number(new Date())
  document.getElementById("meterVolue").value = meterVolume;
  // console.log('EpochTime', epochTime, 'meterVolume', meterVolume);
  if (meterVolume >= 2 || (currentEpochTime < (epochTime + 1000) && recordingState == true)) {
    if (meterVolume >= 2) { epochTime = currentEpochTime; }
    if (recordingState == false) {
      recordingState = true;
      startRecording()
    }
  } else {
    if (recordingState == true) {
      recordingState = false;
      stopRecording()
    }
  }

}

function stopTranslator() {
  console.log('Inside Stop Recording');
  meter.shutdown();
}



// Define variables for audio recorder
var recorder;
var recordedInputId = [];


function stopRecording() {
  console.log('Inside stopRecording');
  // Stop recording with Recorder.js object
  recorder.stop();
  // Stop microphone and get recorded audio
  // mediaStreamSource.getAudioTracks()[0].stop();
  // Pass blob with audio data to callback
  recorder.exportWAV(sentStreamData)

}


// Record audio with device microphone
function startRecording() {
  console.log('Inside startRecording');
  try {
    recorder = new Recorder(mediaStreamSource, { numChannels: 1 })
    recorder.record()
  } catch (e) {
    console.log('error while recording', e);
  };
}



function sentStreamData(blob) {
  console.log('blob', blob);
  audioTranslate(blob)
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function recallTextData(audioId) {
  await sleep(2000);
  fetchTextData(audioId);
}

window.onload = function () {
  // fetchTextData('hi1579996547695');
  // calltotranslatetext('ما اسمك   ؟');
}




function startTranslation() {
  if (window.hasOwnProperty('webkitSpeechRecognition')) {
    console.log('inside ');
    var recognition = new webkitSpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = function (event) {
      console.log('event', event);
      var interimTranscripts = '';
      var finalTranscripts = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscripts += transcript;
        } else {
          interimTranscripts += transcript;
        }
      }

      console.log('finalTranscripts', finalTranscripts);
      console.log('interimTranscripts', interimTranscripts);
      recognition.stop();
      recognition.start();
    };
    recognition.onstart = function () {
      console.log('Voice recognition is ON.');
    }

    recognition.onspeechend = function () {
      console.log('No activity.');
    }

    recognition.onerror = function (e) {
      console.log('recogination', e)
      if (event.error == 'no-speech') {
        console.log('Try again.');
      }
    }
  }
}


function calltotranslatetext(text) {
  console.log('text', text)
  $('<p style="margin: 0;">' + text + '</p>').appendTo('#voicetranslatedData');
  $('#voicetranslatedData').scrollTop($('#voicetranslatedData')[0].scrollHeight)
  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  fetch("https://translation.googleapis.com/language/translate/v2?key="
    + google_api_key + "&q=" + text + "&source=ar&target=en", requestOptions)
    .then(response => response.text())
    .then(responce => JSON.parse(responce)['data'])
    .then(result => {
      console.log('result', result)
      if (result['translations']) {
        const translatedTexts = result['translations']
        translatedTexts.forEach(element => {
          $('<p style="margin: 0;">' + element['translatedText'] + '</p>').appendTo('#translatedData');
          $('#translatedData').scrollTop($('#translatedData')[0].scrollHeight)
        });
      }
    }).catch(error =>
      console.log('error', error)
    );

}

const reader = new FileReader();
function audioTranslate(blob) {
  reader.readAsDataURL(blob);
  reader.onloadend = function () {
    const base64data = reader.result;
    const raw = {
      "config": {
        "languageCode": "ar",
      },
      "audio": {
        "content": base64data.replace('data:audio/wav;base64,', '')
      }
    };
    const settings = {
      "url": "https://speech.googleapis.com/v1/speech:recognize?key=AIzaSyA8fuZZfQPzECIWlo8jM-N8ypbsqEiYut0",
      "method": "POST",
      "timeout": 0,
      "headers": {
        "Content-Type": "application/json"
      },
      "data": JSON.stringify(raw)
    };

    $.ajax(settings).done(function (response) {
      console.log(response);
      if (response && response['results'] && response['results'][0] &&
        response['results'][0]['alternatives'] && response['results'][0]['alternatives'][0] &&
        response['results'][0]['alternatives'][0]['transcript']) {
        const transcript = response['results'][0]['alternatives'][0]['transcript'];
        calltotranslatetext(transcript);
      }
    });
  }
}