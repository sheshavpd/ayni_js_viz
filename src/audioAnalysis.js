const fs = require('fs');
let context;
let audioBuffer;
let sourceNode;
let splitter;
let analyser, analyser2;
let javascriptNode;

window.AudioContext = window.AudioContext || window.webkitAudioContext;
context = new AudioContext();
let beatStats = {
    addBeatListener(f) {
        this.onBeatDetected = f;
    }
};
function setupAudioNodes() {
    // setup a javascript node
    javascriptNode = context.createScriptProcessor(2048, 1, 1);
    // connect to destination, else it isn't called
    javascriptNode.connect(context.destination);

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function() {

        // get the average for the channel
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const average = getAverageVolume(array);

        beatStats.currentBeatAverage = average;
        detectBeat(average);
    };

    // setup a analyzer
    analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    // create a buffer source node
    sourceNode = context.createBufferSource();
    splitter = context.createChannelSplitter();

    // connect the source to the analyser and the splitter
    sourceNode.connect(splitter);

    // connect one of the outputs from the splitter to
    // the analyser
    splitter.connect(analyser,0,0);

    // connect the splitter to the javascriptnode
    // we use the javascript node to draw at a
    // specific interval.
    analyser.connect(javascriptNode);

    // and connect to destination
    sourceNode.connect(context.destination);
}


let startListener;
const addStartListener = function(f){
    startListener = f;
};

const AUDIO_START_TIME = 0;
// load the specified sound
function loadSound() {
    setupAudioNodes();
    context.decodeAudioData(new Uint8Array(fs.readFileSync(getAssetAbsPath("JS_SONG.wav"))).buffer, function(buffer) {
        // when the audio is decoded play the sound
        playSound(buffer);
        if(startListener)
            startListener(AUDIO_START_TIME*1000);
    }, onError);
}
function playSound(buffer) {
    sourceNode.buffer = buffer;
    sourceNode.start(0, 1+AUDIO_START_TIME);
}

// log if an error occurs
function onError(e) {
    console.log(e);
}

function getAverageVolume(array) {
    let values = 0;
    let average;

    let length = array.length;

    // get all the frequency amplitudes
    for (let i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
}

let prevAverage = 0;
function detectBeat(average) {
    if(average > 130) {
        if(beatStats.onBeatDetected && Math.abs(prevAverage - average) > 25) {
            beatStats.onBeatDetected(average);
            prevAverage = average;
        }
    } else prevAverage = 0;
}

module.exports = {
    loadSound,
    beatStats,
    addStartListener
};
