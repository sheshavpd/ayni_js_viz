const UP_BEAT = 1;
const DOWN_BEAT = 2;
class Beat {
    constructor(time, type, threshold) {
        this.time = time;
        this.type = type;
        this.threshold = threshold;
    }
}

const beats = [];
beats.push({})
