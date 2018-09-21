(function(){
    "use strict";

    var NUM_SAMPLES = 256;
    var selectedSong, songFile;
    var audioElement;
    var analyserNode; 
    var canvas,ctx;
    var greyScale=0.0, maxRadius=200, delayAmount= 0.0;
    var invert=false, tint=false, noise=false;
    var modeType = "frequency";
    var img, pattern, ang = 0, rot=0;
    var my_gradient;
    
    function init(){
        
        // set up canvas stuff
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext("2d");
        
        //get a image file and repeat it as a pattern
        img = document.getElementById("background");
        //pattern=ctx.createPattern(img,"repeat-x");
        
        // get reference to <audio> element on page
        audioElement = document.querySelector('audio');
        
        // call our helper function and get an analyser node
        analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
        
        document.querySelector("#slider1").onchange = function(){
            maxRadius = parseFloat(document.querySelector("#slider1").value);
        };
                      
        document.querySelector("#slider2").onchange = function(){
            greyScale = parseFloat(document.querySelector("#slider2").value);
        };

        document.querySelector("#slider3").onchange = function(){
            delayAmount = parseFloat(document.querySelector("#slider3").value);
        };

        //setups
        setupButtons();
        setupEffects();

        songFile= document.querySelector('audio').src;
        // load and play default sound into audio element
        playStream(audioElement,songFile);
        
        // start animation loop
        update();
    }


    //keeps updating the canvas to continue the "animations"--------------------------------------------------
    function update() {
        // do your drawing stuff here
        // this schedules a call to the update() method in 1/60 seconds
        requestAnimationFrame(update);
        
        // create a new array of 8-bit integers (0-255)
        var data = new Uint8Array(NUM_SAMPLES/2);
        
        
        //check to see what mode the user wants
        if(modeType=="frequency"){
            // populate the array with the frequency data
            // notice these arrays can be passed "by reference" 
            analyserNode.getByteFrequencyData(data);
        }
        else{
            // OR
            analyserNode.getByteTimeDomainData(data); // waveform data
        }
        
        //clear the canvas
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle=my_gradient;
        ctx.fillRect(0,0,canvas.width,canvas.height);  
       
        
        drawBackground();
        
        drawSpiral(data);
        drawHeart();
        drawRects(data);
        
        //check of the user input on the scaled provided
        manipulatePixels();
    } 

    //HELPERS====================================================================================================================================================================

    //checks for Checkboxes-----------------------------------------------------------------------------------------------------
    function setupEffects(){
        //call the checkfunc method, sending the box id names and an anonymous function that sets a value
        checkfunc("invertCheckbox", function(v) { invert = v; });
        checkfunc("tintCheckbox", function(v) { tint = v; });
        checkfunc("noiseCheckbox", function(v) { noise = v; });
    }

    //calls the manipulate function on the checkbox that was checked------------------------------------------------------------
    function checkfunc(boxName, changeVal) {
        document.getElementById(boxName).onchange = function(e){
            changeVal(e.target.checked);
        };
    }
    
    //-------------------------------------------------------------------------------------------------------------------------
    function createWebAudioContextWithAnalyserNode(audioElement) {

        // create new AudioContext
        let audioCtx = new (window.AudioContext || window.webkitAudioContext);

        // create an analyser node
        analyserNode = audioCtx.createAnalyser();

        // fft stands for Fast Fourier Transform
        analyserNode.fftSize = NUM_SAMPLES;

        // this is where we hook up the <audio> element to the analyserNode
        let sourceNode = audioCtx.createMediaElementSource(audioElement); 
        sourceNode.connect(analyserNode);
        
        //connect rouse node directly to speakers to hear unaltered source in this channel
        sourceNode.connect(audioCtx.destination);

        let biquadFilter = audioCtx.createBiquadFilter();
        biquadFilter.type = "highshelf";
        biquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        biquadFilter.gain.setValueAtTime(25, audioCtx.currentTime);

        return analyserNode;
    }

    function drawRects(data){   
       
         // vars for sound bars
        var barWidth = (canvas.width)/data.length;
        var baseHeight=5;
        
        // loop through the data and draw!
        for(var i=5; i<data.length; i++)
        {   
            ctx.save();
            ctx.fillStyle = "#ffedf2";

            if(invert){
                ctx.fillStyle="#ec7696"
            }
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate((Math.PI * 2 * (i / (data.length-40)))+ (rot -= .00002));

            ctx.beginPath();
            ctx.fillRect(0,maxRadius,barWidth-2, baseHeight+data[i]*.6);
            ctx.restore();
        } 
    }
    
    function drawSpiral(data){
        var x=0;
        var y=0;
        var angle=0;

        ctx.save();
        ctx.lineWidth= 2;
        ctx.strokeStyle = "white";
        ctx.shadowBlur=8;
        ctx.shadowColor="white";
        
        if(invert){
            ctx.strokeStyle = "grey";
            ctx.shadowColor="grey";
        }
        
        ctx.beginPath();
        
        ctx.translate(canvas.width/2, canvas.height/2);
        //ctx.rotate(Math.PI - (ang));
        
        ctx.moveTo(0,0);
        for (var i = 0; i<data.length+10; i++) {
            //this makes interesting patterns
            ctx.rotate((Math.PI - (ang))/50);
            angle = .1 *i;
            //increment the angle and rotate the image 
            x=(i*1.3)*Math.cos(angle);
            y=(i*1.3)*Math.sin(angle);
            
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    //draws the image as the baground and rotates it
    function drawBackground(){
        //rotate the background image
            ctx.save(); //saves the state of canvas
            ctx.globalAlpha=.9;
            ctx.scale(1.8,1.8);
            ctx.translate(canvas.width/3.6, canvas.height/3.6);
            ctx.rotate(Math.PI / 180 * (ang += .1)); //increment the angle and rotate the image 
            ctx.drawImage(img,  -img.width/2, -img.height / 2, img.width, img.height); //draw the image ;)
            ctx.restore(); //restore the state of canvas
    }
    
    //draws a heart at the center of the canvas
    //Code Author: m1erickson
    //http://jsfiddle.net/m1erickson/8Ja8A/
    function drawHeart(){   
        //draws a light white background behind the heart
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.fillStyle="rgba(255,255,255,.5)";
        ctx.strokeStyle="rgba(255,255,255,1)";
        
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.arc(0,0,180,0,2*Math.PI);
        ctx.shadowBlur=15;
        ctx.shadowColor="white";
        
        if(invert){
            ctx.shadowColor="grey";
        }
        
        ctx.stroke();
        ctx.fill();
        ctx.restore();
        
        //heart curves
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.fillStyle="#BE1E73";
        ctx.strokeStyle= "pink";
        ctx.lineWidth= 3;
        ctx.beginPath();
        ctx.moveTo(0,-15);
        ctx.bezierCurveTo( 0,-45, -50,-45, -50, -15);
        ctx.bezierCurveTo( -50,15, 0,20, 0, 45 );
        ctx.bezierCurveTo( 0,20, 50,15, 50, -15 );  
        ctx.bezierCurveTo( 50,-45, 0,-45, 0, -15);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur=8;
        ctx.shadowColor="white";
        
        if(invert){
            ctx.shadowColor="grey";
        }
        ctx.stroke();
        ctx.restore();
    }

    //checks checkboxes and scales to manipulate the pixel
    function manipulatePixels(){
        //i) Get all of the rgba pixel data of the canvas by grabbing the image data
        var imageData=ctx.getImageData(0,0,canvas.width, canvas.height);

        //ii)imageData.data is an 8-bit  typed array- values range from 0-255
        //imageData.data contains 4 values per pixel: 4 x canvas.width x
        //canvas.height = 10240000 values!
        //we are looping through this 60 fps-wow
        var data = imageData.data;
        var length = data.length;
        var width = imageData.width;

        //iii)Iteratethrougheachpixel
        //we step by 4 so that we can manipulate pixel per iteration
        //data[i]is the red value
        //data[i+1]is the green value
        //data[i+2]is the blue value
        //data[i+3]is the alpha value
        for(var i=0; i<length; i+=4){
            //increase green value only
            if(tint){
                data[i+1]= data[i]+60; 
                data[i+5]= data[i]+60; 
            }
            if(invert){
                var red=data[i], green=data[i+1], blue=data[i+2];
                data[i]=255-red;        //set red value
                data[i+1]=255-green;    //set blue value
                data[i+2]=255-blue;     //set green value

            }
            if(noise&&Math.random()<.10){
                //data[i]=data[i+1]=data[i+2]=128 //gray noise
                data[i+4]=data[i+5]=data[i+6]=255; //or white noise
                //data[i]=data[i+1]=data[i+2]=0; //or back noise
                data[i+3]=255; //alpha
            }
        }

        //this sets the greyscale for each particle based on the scale
        //let c equal the value on the scale between 0----->1
        //we want to go from [r,g,b]----->[gr,gr,gr]  //let gr equal the color grey
        // (1-c)*[r,g,b] + c*[gr,gr,gr]   if c= 0, we get rgb, else if c=1 we get gr
        var average = (data[i]+ data[i+1]+ data[i+2])/3; //getting a grey value "gr"
        var saturated = greyScale*average; //depending on the scale value, change between grey to normal rgb values "c*gr"
        var oppositeVal= (1-greyScale); //if callGrey=0, we get rgb, else if callGrey=1, we get grey "1-c"

        // (1-c)*[r] + c[gr]    
        data[i] = oppositeVal* data[i] + saturated;
        // (1-c)*[g] + c[gr]  
        data[i+1] = oppositeVal* data[i+1] + saturated;
        // (1-c)*[b] + c[gr]  
        data[i+2] = oppositeVal* data[i+2] + saturated;              

        //put the modified data back on the canvas
        ctx.putImageData(imageData,0,0);
        //console.log("was called");
    }

    function setupButtons(){
        //change the song when song is clicked
        document.querySelector("#Star_Prism").onclick = changeSong;
        document.querySelector("#Bloomin_Lights").onclick = changeSong;     
        document.querySelector("#My_Little_Hero").onclick = changeSong;     

        //checks to see what mode the user clicks and calls the changeMode method
        document.querySelector("#frequency").onclick = changeMode;
        document.querySelector("#wave").onclick = changeMode;
    }
    

    function changeMode(e){
        //removes the selected class from the current mode to the new selected mode
        document.getElementById(modeType).className = " ";     
        modeType = e.target.id;
        document.getElementById(modeType).className = "selected";
    }

    //changes the current song by getting the file name and sending it to the playstream
    function changeSong(e){
        //get the new file path to song and send to playStream()
        songFile = 'media/' + e.target.id.replace(/_/g, " ") + '.mp3';   
        playStream(audioElement,songFile);
        console.log(e.target.id);
        
        var selectedSong = document.querySelector('.selected');
        //remove selection off of last played song
        selectedSong.className = " ";
        //reassign new song as selected song
        selectedSong = document.querySelector('#'+e.target.id);
        selectedSong.className = "selected";  
    }

    //changes the song playing by giving the path of the music file and audio
    function playStream(audioElement,path){
        audioElement.src = path;
        audioElement.play();
        //change the play and pause button on the player
        thePlayer.addClass( cssClass.playing );
    }
    
    //these functions focuses on data manipulation and particle effects
    function makeColor(red, green, blue, alpha){
        var color='rgba('+red+','+green+','+blue+', '+alpha+')';
        return color;
    }
    
    window.addEventListener("load",init);
}());