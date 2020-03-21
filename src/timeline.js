class CustomImageData {
    constructor(width, height, locations) {
        this.width = width;
        this.height = height;
        this.locations = locations;
    }
}
const IMG_ACTION = 1000;
const DISTORT_ACTION = 1001;

class Timeline {
    constructor() {
        this.keyFrames = [];
    }

    //fromMs indicates a skip value of how many ms to skip the timeline from beginning.
    play(fromMs) {
        if(this._playing) {
            console.error("Timeline is already being played");
        } else {
            this.keyFrames.sort((a, b) => (a.time > b.time) ? 1 : -1);
            this._playing = true;
        }
        this._startTime = Date.now() - (fromMs ? fromMs:0);
    }

    stop() {
        this._playing = false;
    }

    addImageKeyFrame(time, image, targetTime) {
        this.keyFrames.push({time, image, type:IMG_ACTION, targetTime});
    }

    addDistort(time, targetTime) {
        this.keyFrames.push({time, type:DISTORT_ACTION, targetTime});
    }

    getCurrentAction() {
        if(!this._playing)
            return;
        const timeElapsed = Date.now() - this._startTime;
        for(let i=0; i< this.keyFrames.length; i++) {
            //If current time is greater than the time elapsed, and lesser than the next keyFrame's time,
            //pick this keyFrame.
            //This condition works upto last but one keyframe.
            if(this.keyFrames[i].time <= timeElapsed
                && (this.keyFrames[i+1] && (this.keyFrames[i+1].time >= timeElapsed))) {
                return this.keyFrames[i];
            } else if(i === this.keyFrames.length - 1) { //Handles last keyframe
                if(this.keyFrames[i].time <= timeElapsed && this.keyFrames[i].time + this.keyFrames[i].targetTime + 1000 >=timeElapsed)
                    return this.keyFrames[i];
                //this._startTime = Date.now(); //Re-start timeline, if the last keyFrame's time has been passed.
            }
        }
    }
}
