const audioAnalysis = require('./src/audioAnalysis.js');
let mouse = { x: window.innerWidth, y: window.innerHeight};
const attractionDistance = Math.sqrt(window.innerWidth*window.innerWidth + window.innerHeight*window.innerHeight);
//const magnetBezier = new Bezier({x:0, y:0}, {x: 1, y:0.6}, {x:1, y:0.7}, {x:1, y:1});
document.onmousemove = function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
};


//Canvas and particles
const audioCanvas = document.getElementById("audioCanvas");
audioCanvas.width = window.innerWidth;
audioCanvas.height = window.innerHeight;

const canvasContext = audioCanvas.getContext("2d");

const getSceneX = function(plotX) {
    return plotX;
};

const getSceneY = function(plotY) {
    return innerHeight - plotY;
};

const getScenePoint = function(plotPoint) {
    return { x: plotPoint.x, y: innerHeight - plotPoint.y }
};

const getPlotPoint = function(scenePoint) {
    return { x: scenePoint.x, y: innerHeight - scenePoint.y }
};

const getPlotX = function(screenX) {
    return screenX;
};

const getPlotY = function(screenY) {
    return innerHeight - screenY;
};

class Particle {
    constructor({x , y}){
        this.x = x;
        this.y = y;
        this.speed = getPointInRange(0.2, 0.8);
        this.timeMs = Date.now();
    }

    update(now){
        if(!this.dest)
            return;
        const dist = getEucledianDist(getScenePoint(this), this.dest);
        //console.log("Euc D", Date.now() - then);
        //Since mouse is in scene co-ordinates, and point is in plot co-ordinates, pass them of same type.
        //then = Date.now();
        const az = getRelativeAz(getScenePoint(this), this.dest);
        //console.log("Rel az", Date.now() - then);
        //then = Date.now();
        //Attraction starts at attractionDistance pixel distance.
        this.speed = this.dest.targetSpeed || 0.8 * Math.max(0, ( 1 - dist/attractionDistance));
        //this.speed = this.dest.targetSpeed || 4 * Math.max(0, (1 - magnetBezier.get(dist/attractionDistance).x));
        const distanceTraveled = this.speed * (now - this.timeMs);
        this.x = this.x + Math.min(dist,  distanceTraveled)*Math.cos((az - 90) * TO_RAD);
        this.y = this.y + Math.min(dist,  distanceTraveled)*Math.sin((az - 90) * TO_RAD);
        this.timeMs = now;
    }

    setDestination(dest, targetTime) {
        this.dest = dest;
        this.timeMs = Date.now(); //Start reaching destination from now.
        if(targetTime) {
            this.dest.targetSpeed = getEucledianDist(getScenePoint(this), this.dest)/targetTime;
        }
    }
}

const NUM_RANGE_MARKERS = 8;
const distortParticle = function(particle, targetTime){
    //divide screen into 6 range fields
    const radius = window.innerWidth/2;
    const rangeMarkers = radius / NUM_RANGE_MARKERS; //6 range markers
    let chosenIndex = parseInt(getPointInRange(0, NUM_RANGE_MARKERS-1));
    if(chosenIndex%2 === 0) //Only odd indexes are allowed to be chosen.
        chosenIndex = chosenIndex + 1;
    const minRange = chosenIndex*rangeMarkers;
    const maxRange = (chosenIndex + 1)*rangeMarkers;
    const chosenRange = getPointInRange(minRange, maxRange);
    const chosenAz = getPointInRange(0, 360)*TO_RAD;
    const randomPoint = { x:chosenRange * Math.cos(chosenAz), y: chosenRange * Math.sin(chosenAz)};
    particle.setDestination({x: window.innerWidth/2 + randomPoint.x, y: window.innerHeight/2 + randomPoint.y}, targetTime);
    particle.timeMs = Date.now(); //start moving.
};

const particles = [];
for(let i= 0; i<8000; i++) {
    const newPoint = new Particle(getRandomPointInBounds(0, 0, audioCanvas.width, audioCanvas.height));
    distortParticle(newPoint, 0);
    //const newPoint = new Particle({x: mouse.x + 30, y:mouse.y+30});
    particles.push(newPoint);
}


let currentAction;
const play = function() {
    const now = Date.now();
    canvasContext.fillStyle = "#000000";
    const particleSize = 1/* + 10*Math.max(0, 1 - audioAnalysis.beatStats.currentBeatAverage/170)*/;
    canvasContext.shadowColor = '#ffffff';
    canvasContext.shadowBlur = 10*Math.max(0, 1 - audioAnalysis.beatStats.currentBeatAverage/170);
    canvasContext.shadowOffsetX = 0;
    canvasContext.shadowOffsetY = 0;
    canvasContext.fillRect(0, 0, audioCanvas.width, audioCanvas.height);
    canvasContext.beginPath();
    canvasContext.fillStyle = "#00edff";
    const action = timeline.getCurrentAction();
    const destFlag = action && currentAction !== action;
    //Whether action has changed
    if(destFlag) {
        currentAction = action;
    }
    for(let i= 0; i<particles.length; i++) {
        const particle = particles[i];
        if(destFlag) {
            if(currentAction.type === DISTORT_ACTION) {
                //particle.setDestination(getRandomPointInBounds(0, 0, window.innerWidth, window.innerHeight));
                distortParticle(particle, currentAction.targetTime);

            } else if(currentAction.type === IMG_ACTION) {
                particle.setDestination(currentAction.image.locations[parseInt(getPointInRange(0, currentAction.image.locations.length - 1))], currentAction.targetTime);
            }
        }
        particle.update(now);
        canvasContext.moveTo(getSceneX(particle.x), getSceneY(particle.y));
        //canvasContext.arc(getSceneX(particle.x), getSceneY(particle.y), particleSize, 0, 2*Math.PI);
        canvasContext.rect(getSceneX(particle.x), getSceneY(particle.y), particleSize, particleSize);
        if(i >= particles.length*0.95) {
            canvasContext.fill();
            canvasContext.fillStyle = "#d8baff";
            canvasContext.beginPath();
        }
    }
    canvasContext.fill();
    requestAnimationFrame(play);
};




audioAnalysis.beatStats.addBeatListener(function(average) {
    const now = Date.now();
    for(let i= 0; i<particles.length; i++) {
        const particle = particles[i];
        particle.y = particle.y + 30;
        particle.timeMs = now;
    }
});
audioAnalysis.addStartListener((fromMs)=>{
    play();
    timeline.play(fromMs);
});
//setTimeout(audioAnalysis.loadSound, 4000); //Timeout for loading necessary files.
audioAnalysis.loadSound();

