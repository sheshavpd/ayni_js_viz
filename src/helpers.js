const TO_RAD = Math.PI / 180;
const TO_DEG = 180 / Math.PI;
const getRandomPointInBounds = function(minX, minY, maxX, maxY) {
    return {
        x: (minX + Math.random()*(maxX - minX + 1)),
        y: (minY + Math.random()*(maxY - minY + 1))
    };
};

const getPointInRange = function(min, max) {
    return (min + Math.random()*(max - min + 1));
};


const getEucledianDist = function(p1, p2) {
    return Math.sqrt(Math.pow((p1.x - p2.x), 2)+Math.pow((p1.y - p2.y), 2));
};

const getRelativeAz = function(p1, p2) {
    const x = p2.x - p1.x;
    const y = p2.y - p1.y;
    if(x>=0 && y>0)
        return TO_DEG*(Math.atan(x/y));
    else if(x>0 && y<=0)
        return TO_DEG*(Math.atan(-y/x))+90;
    else if(x<=0 && y<0)
        return TO_DEG*(Math.atan(-x/-y))+180;
    else if(x<0 && y>=0)
        return TO_DEG*(Math.atan(y/-x))+270;
    else return 0;
};