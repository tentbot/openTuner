let input, filter, fft, nyquist;

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

    // Upscale array to increase tuning accuracy
    // console.log(freq.length);
    freq = upScale(upScale(freq));

    // Harmonic Product Spectrum
    let harmonicProducts = [];
    let index = 0;
    const BIN_50HZ = round(50 * freq.length / nyquist);
    const BIN_3000HZ = round(3000 * freq.length / nyquist);
    let firstMax = -1;
    let secondMax = -1;
    let firstMaxIndex = 0;
    let secondMaxIndex = 0;

    // TODO: If the second peak amplitude occurs at approximately half of the chosen pitch
    // AND the ratio of amplitudes is above a threshold, choose the lower pitch

    // omega = index of frequency of note
    for (let omega = BIN_50HZ; omega < BIN_3000HZ; omega++) {
        // r = harmonics being considered
        for (let r = 1; r <= 5; r++) {
            // Get the product of harmonics
            if (r === 1) {
                harmonicProducts[index] = freq[omega];
            } else if (r * omega < freq.length && freq[r * omega] !== 0) {
                harmonicProducts[index] *= freq[r * omega];
            }
        }
        // Find maximum and second-maximum harmonic product
        if (harmonicProducts[index] > firstMax) {
            secondMax = firstMax;
            secondMaxIndex = firstMaxIndex;

            firstMax = harmonicProducts[index];
            firstMaxIndex = omega;
        } else if (harmonicProducts[index] > secondMax) {
            secondMax = harmonicProducts[index];
            secondMaxIndex = omega;
        }

        index++;
    }

    if (firstMax === 0) {
        indexOfNote = 0;
    } else if (secondMaxIndex / firstMaxIndex - 0.5 < 0.05) {
        indexOfNote = secondMaxIndex;
    } else {
        indexOfNote = firstMaxIndex;
    }

    // Show the frequency of the detected note
    scale(1, -1);
    translate(0, -height);
    fill(128,0,255);
    textSize(48);
    textAlign('center')
    strokeWeight(2);
    frequency = indexOfNote * nyquist / freq.length;
    text(round(frequency * 1000) / 1000 + ' Hz', width/2, height/2);

    //Show the guess of which string is being played
    let stringFrequencies = [82.41, 110, 146.8, 196, 246.9, 329.6];
    let stringNames       = ['E', 'A', 'D', 'G', 'B', 'e'];
    let maxError = 20;
    let guess = -1;
    for (let i = 0; i < stringFrequencies.length; i++) {
        error = abs(frequency - stringFrequencies[i]);
        if (error < maxError) {
            guess = i;
            maxError = error;
        }
    }

    textSize(24);
    textAlign('center');
    text("I think you are playing: ", width / 2, height * 1/4)
    if (guess >= 0) {
        text(stringNames[guess], width / 2, height * 1/3);
    }
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

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
