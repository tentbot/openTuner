let input, filter, fft, nyquist;

let stringFrequencies = [0, 82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
let stringNames = ['?', 'E', 'A', 'D', 'G', 'B', 'e'];

function setup() {
    input = new p5.AudioIn();
    input.start();

    fft = new p5.FFT(0.8,16384);
    fft.setInput(input);

    nyquist = sampleRate() / 2;
    
    c = createCanvas(windowWidth, windowHeight);
    c.parent('canvasDiv');
}

function draw() {
    scale(1, -1);
    translate(0, -height);

    background(255);

    let freq = fft.analyze();

    noFill();
    stroke(128, 0, 255);
    strokeWeight(2);

    // Plot the frequency response
    beginShape();
    vertex(0, freq[0] * height / 255);
    for (let i = 0; i < freq.length; i += 8) {
        let x = log(i)/log(2) * width / (log(freq.length)/log(2));
        let y = freq[i] * height / 2 / 255;
        vertex(x,y);
    }
    endShape();

    // Upscale array four times to increase tuning accuracy
    freq = upScale(upScale(upScale(upScale(freq))));

    // Determine the pitch of the note based on the frequency response
    frequencyOfNote = estimatePitch(freq);

    //Show the guess of which string is being played
    stringName = guessStringName(frequencyOfNote, stringFrequencies, stringNames);
    scale(1, -1);
    translate(0, -height);
    textSize(24);
    textAlign('center');
    text("I think you are playing:", width / 2, height * 1/4);
    text(stringName, width / 2, height / 3);

    error = errorInPitch(frequencyOfNote,stringFrequencies);

    // Show the frequency of the detected note
    fill(128,0,255);
    textSize(48);
    textAlign('center')
    strokeWeight(2);
    text(round(frequencyOfNote * 1000) / 1000 + ' Hz', width/2, height/2);
}

function estimatePitch(freq) {
    // Harmonic Product Spectrum
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

    if (max === 0) {
        indexOfNote = 0;
    } else {
        indexOfNote = maxIndex;
        if (max / 2 > octaveDown && octaveDown / max > 0.15) {
            indexOfNote /= 2;
        }
    }

    return indexOfNote * nyquist / freq.length;
}

function upScale(arr) {
    let upScaled = [arr[0]];
    
    for (let i = 1; i < arr.length; i++) {
        average = (arr[i-1] + arr[i]) / 2;
        upScaled.push(average);
        upScaled.push(arr[i]);
    }

    return upScaled;
}

function errorInPitch(frequency, stringFrequencies) {
    let offSet = 0;
}

function guessStringName(frequency, stringFrequencies, stringNames) {
    let maxErrorHz = 15;
    let guess = 0;
    
    for (let i = 1; i < stringFrequencies.length; i++) {
        error = abs(frequency - stringFrequencies[i]);
        if (error < maxErrorHz) {
            guess = i;
            maxError = error;
        }
    }
    
    return stringNames[guess];
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
