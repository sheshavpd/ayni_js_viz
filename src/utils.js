const fs = require("fs");
const timeline = new Timeline();
const { remote } = require('electron');
class AnimImageFile {
    constructor(path,  delay, targetTime) {
        this.path = path;
        this.delay = delay;
        this.targetTime = targetTime;
    }
}
const animFrames = require('./src/frames.js');


//Loading files through browser
/*document.getElementById('imgFiles').onchange = async function (evt) {
    if(!evt.target)
        return;
    const files = evt.target.files;

    // FileReader support
    if (FileReader && files && files.length) {
        let timeElapsed = 0;
        for(let i=0; i<files.length; i++) {
            const fr = new FileReader();
            fr.onload = async () => {
                const customImage = await loadImageLocations(fr.result);
                timeline.addImageKeyFrame(timeElapsed, customImage, 1000);
                timeElapsed+=4000;
                if(i === files.length - 1)
                    timeline.play();
            };
            fr.readAsDataURL(files[i]);
        }
    }
};*/

const loadImageLocations = async function(imageData) {
    const canvas = document.createElement("canvas");
    return new Promise((resolve, reject)=>{
        //document.getElementsByTagName('body')[0].appendChild(canvas);
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = imageData;
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imgLocations = [];
            const imgBuffer = ctx.getImageData(0, 0, img.width, img.height);
            const ONE_ROW_SIZE = img.width*4;
            const minX = window.innerWidth/2 - img.width/2;
            const minY = window.innerHeight/2 - img.height/2;
            for(let i = 0; i<img.height; i++) {
                for(let j=0; j<ONE_ROW_SIZE; j+=4) {
                   const r = imgBuffer.data[i*ONE_ROW_SIZE + j];
                   const g = imgBuffer.data[i*ONE_ROW_SIZE + j+1];
                   const b = imgBuffer.data[i*ONE_ROW_SIZE + j+2];
                   const a = imgBuffer.data[i*ONE_ROW_SIZE + j+3];
                   if((r+g+b)/3 < 100 && a > 150) { //Pixel is dark
                       imgLocations.push({x: minX + j/4, y:minY + i});
                   }
                }
            }
           /* ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            imgLocations.forEach((loc)=>{
                ctx.moveTo(loc.x - minX, loc.y - minY);
                ctx.rect(loc.x - minX, loc.y - minY, 1, 1);
            });
            ctx.fill();*/
            //document.getElementsByTagName('body')[0].removeChild(canvas);
            resolve(new CustomImageData(img.width, img.height, imgLocations));
        }
    })
};

const readImageAsDataURL = function(path) {
    const imageType = path.endsWith(".png") ? "png":"jpeg";
    return `data:image/${imageType};base64,` + fs.readFileSync(path).toString('base64');
};

//Loading files through node.js
const loadAnimFrames = async function() {
    let timeElapsed = 0;
    for(let i=0; i<animFrames.length; i++) {
        timeElapsed+=animFrames[i].delay;
        if(animFrames[i].type && animFrames[i].type === "distort") {
            timeline.addDistort(timeElapsed, animFrames[i].targetTime);
        } else {
            const customImage = await loadImageLocations(readImageAsDataURL(animFrames[i].path));
            timeline.addImageKeyFrame(timeElapsed, customImage, animFrames[i].targetTime);
        }
    }
};
loadAnimFrames();
