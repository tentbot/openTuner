const FREQUENCY_BINS = 16384;
const OCTAVE_ERROR_TOLERANCE = 0.15;
const LARGE_ERROR = 5;
const LARGE_ERROR_COLOUR = [255, 0, 0];
const SMALL_ERROR = 0.3;
const SMALL_ERROR_COLOUR = [0, 220, 0];
const THEME_COLOUR = [0, 128, 255];

let input, filter, fft, nyquist;

let stringFrequencies = [0, 82.407, 110, 146.832, 196, 246.942, 329.628];
let stringNames = ['?', 'E', 'A', 'D', 'G', 'B', 'e'];

function setup() {
    input = new p5.AudioIn();
    input.start();

    fft = new p5.FFT(0.8, FREQUENCY_BINS);
    fft.setInput(input);

    nyquist = sampleRate()/2;

    createCanvas(windowWidth, windowHeight);
}

function draw() {
    background(0);

    // Perform FFT on input
    let freq = fft.analyze();

    // Plot the frequency response
    scale(1, -1);
    translate(0, -height);
    spectrogram(freq);

    // Upscale array to increase tuning accuracy
    freq = upScale(freq, 6);

    // Determine the pitch of the note based on the frequency response
    frequencyOfNote = estimatePitch(freq);

    //Show the guess of which string is being played
    scale(1, -1);
    translate(0, -height);
    stringIndex = guessString(frequencyOfNote, stringFrequencies);
    showStringGuess(stringIndex);

    // Tell the user if they are too high or too low using visual and
    // textual feedback
    error = errorInPitch(frequencyOfNote, stringIndex, stringFrequencies);
    colour = getColourFromError(error);
    giveHint(error, colour);
    errorBar(error, colour);
}



function spectrogram(freq) {
    noFill();
    stroke(THEME_COLOUR);
    strokeWeight(2);

    beginShape();
    vertex(0, freq[0] * height / 255);
    for (let i = 0; i < freq.length; i += 16) {
        let x = (log(i)/log(2)) * width / (log(freq.length)/log(2));
        let y = freq[i] * height / 2 / 255;
        vertex(x,y);
    }
    endShape();
}

function upScale(arr, n) {
    let upScaled = [arr[0]];

    for (let i = 1; i < arr.length; i++) {
        let diff = arr[i-1]-arr[i];
        for (let j = 0; j <= n; j++) {
            upScaled.push(arr[i]+diff*j/n);
        }
    }

    return upScaled;
}

function estimatePitch(freq) {
    // Uses Harmonic Product Spectrum method
    let harmonicProducts = [];
    let BIN_50HZ = round(50 * freq.length / nyquist);
    let BIN_3000HZ = round(3000 * freq.length / nyquist);
    let max = -1;
    let maxIndex = 0;
    let octaveBelow = 0;

    // omega = index of frequency of note
    for (let omega = BIN_50HZ; omega < BIN_3000HZ; omega++) {
        // r = harmonics being considered
        for (let r = 1; r <= 5; r++) {
            // Get the product of harmonics
            if (r === 1) {
                harmonicProducts[omega] = freq[omega];
            } else if (r * omega < freq.length && freq[r * omega] !== 0) {
                harmonicProducts[omega] *= freq[r * omega];
            }
        }
        if (harmonicProducts[omega] > max) {
            max = harmonicProducts[omega];
            maxIndex = omega;
            octaveBelow = harmonicProducts[round(omega / 2)];
        }
    }

    indexOfNote = maxIndex;
    if (max / 2 > octaveBelow && octaveBelow / max > OCTAVE_ERROR_TOLERANCE) {
        indexOfNote /= 2;
    }

    return indexOfNote * nyquist / freq.length;
}

function guessString(frequency, stringFrequencies) {
    let maxErrorHz = 15;
    let guess = 0;

    for (let i = 1; i < stringFrequencies.length; i++) {
        error = abs(frequency - stringFrequencies[i]);
        if (error < maxErrorHz) {
            guess = i;
            maxError = error;
        }
    }

    return guess;
}

function showStringGuess(stringIndex) {
    textSize(24);
    textAlign('center');
    text("I think you are playing:", width / 2, height * 1/4);
    text(stringName(stringIndex), width / 2, height / 3);
    text(stringFrequencies[stringIndex] + " Hz", width / 2, height / 2.5);
}

function stringName(string) {
    return stringNames[string];
}

function errorInPitch(frequency, string, stringFrequencies) {
    return frequency - stringFrequencies[string];
}

function getColourFromError(error) {
    if (abs(error) >= LARGE_ERROR) {
        colour = LARGE_ERROR_COLOUR;
    } else {
        colour = [abs(error)*255,150,0];
    }
    
    return colour;
}

function giveHint(error, colour) {
    if (abs(error) > SMALL_ERROR) {
        // Check if error is positive or negative
        if (error > 0) {
            text('Too high', width / 2, height / 1.8);
        } else {
            text('Too low', width / 2, height / 1.8);
        }
    } else {
        colour = SMALL_ERROR_COLOUR;
    }

    fill(colour);
    stroke(colour);
    textSize(48);
    strokeWeight(2);
    text(round(frequencyOfNote * 1000) / 1000 + ' Hz', width/2, height/2);
}

function errorBar(error, colour) {
    fill(colour);
    stroke(colour);
    strokeWeight(8);

    let x = width/2;
    if (abs(error) > SMALL_ERROR) {
        x = map(error, -LARGE_ERROR, LARGE_ERROR, 0, width);
    }
    
    line(x, height*3/5, x, height);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

