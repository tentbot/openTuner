const FREQUENCY_BINS = 16384;
const OCTAVE_ERROR_TOLERANCE = 0.15;

let input, filter, fft, nyquist;

let stringFrequencies = [0, 82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
let stringNames = ['?', 'E', 'A', 'D', 'G', 'B', 'e'];

function setup() {
    input = new p5.AudioIn();
    input.start();

    fft = new p5.FFT(0.8,FREQUENCY_BINS);
    fft.setInput(input);

    nyquist = sampleRate() / 2;
    
    c = createCanvas(windowWidth, windowHeight);
    c.parent('canvasDiv');
}

function draw() {
    background(255);

    // Perform FFT on input
    let freq = fft.analyze();

    // Plot the frequency response
    scale(1, -1);
    translate(0, -height);
    spectrogram(freq);

    // Upscale array four times to increase tuning accuracy
    freq = upScale(freq, 4);

    // Determine the pitch of the note based on the frequency response
    frequencyOfNote = estimatePitch(freq);

    //Show the guess of which string is being played
    scale(1, -1);
    translate(0, -height);
    stringIndex = guessString(frequencyOfNote, stringFrequencies);
    showStringGuess(stringIndex);

    // Tell the user if they are too high or too low
    error = errorInPitch(frequencyOfNote, stringIndex, stringFrequencies);
    giveHint(error);
}

function spectrogram(freq) {
    noFill();
    stroke(128, 0, 255);
    strokeWeight(2);

    beginShape();
    vertex(0, freq[0] * height / 255);
    for (let i = 0; i < freq.length; i += 16) {
        let x = log(i)/log(2) * width / (log(freq.length)/log(2));
        let y = freq[i] * height / 2 / 255;
        vertex(x,y);
    }
    endShape();
}

function estimatePitch(freq) {
    // Uses Harmonic Product Spectrum method
    let harmonicProducts = [];
    const BIN_50HZ = round(50 * freq.length / nyquist);
    const BIN_3000HZ = round(3000 * freq.length / nyquist);
    let max = -1;
    let maxIndex = 0;
    let octaveDown = 0;

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
        // Find maximum and second-maximum harmonic product
        if (harmonicProducts[omega] > max) {
            max = harmonicProducts[omega];
            maxIndex = omega;
            octaveDown = harmonicProducts[round(omega / 2)];
        }
    }

    indexOfNote = maxIndex;
    if (max / 2 > octaveDown && octaveDown / max > OCTAVE_ERROR_TOLERANCE) {
        indexOfNote /= 2;
    }

    return indexOfNote * nyquist / freq.length;
}

function upScale(arr, n) {
    n = n || 1;
    while (n >= 1) {
        arr = upScaleHelper(arr);
        n--;
    }
    return arr;
}

function upScaleHelper(arr) {
    let upScaled = [arr[0]];
    
    for (let i = 1; i < arr.length; i++) {
        average = (arr[i-1] + arr[i]) / 2;
        upScaled.push(average);
        upScaled.push(arr[i]);
    }

    return upScaled;
}

function errorInPitch(frequency, string, stringFrequencies) {
    return frequency - stringFrequencies[string];
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

function stringName(string) {
    return stringNames[string];
}

function showStringGuess(stringIndex) {
    textSize(24);
    textAlign('center');
    text("I think you are playing:", width / 2, height * 1/4);
    text(stringName(stringIndex), width / 2, height / 3);
}

function giveHint(error) {
    if (abs(error) > 0.2) {
        cc = [abs(error)*500,100,0];
        if (error > 0) {
            text('Too high', width / 2, height / 1.8);
        } else {
            text('Too low', width / 2, height / 1.8);
        }
    } else {
        cc = [0, 220, 0];
    }
    fill(cc);
    stroke(cc);
    textSize(48);
    strokeWeight(2);
    text(round(frequencyOfNote * 1000) / 1000 + ' Hz', width/2, height/2);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
