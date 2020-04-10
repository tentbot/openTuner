let input, fft, nyquist;

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
    for (let i = 0; i < freq.length; i++) {
        let x = log(i)/log(2) * width / (log(freq.length)/log(2));
        let y = freq[i] * height / 255;
        vertex(x,y);
    }
    endShape();

    // strokeWeight(0.5);
    // for (let i = 0; i < freq.length; i += 2) {
    //     let x = log(i)/log(2) * width / (log(freq.length)/log(2));
    //     line(x, height / 3, x, height / 6);
    // }

    // Method: Find peak frequency
    // let maxVal = freq[0];
    // let maxIndex = 0;
    
    // for (i = 0; i < freq.length; i++) {
    //     let currentAmp = freq[i];
    //     if (currentAmp > maxVal) {
    //         maxVal = currentAmp;
    //         maxIndex = i;
    //     }
    // }

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
    console.log(harmonicProducts);

    if (firstMax === 0) {
        indexOfNote = 0;
    } else if (secondMaxIndex / firstMaxIndex - 0.5 < 0.05) {
        indexOfNote = secondMaxIndex;
    } else {
        indexOfNote = firstMaxIndex;
    }

    scale(1, -1);
    translate(0, -height);
    textSize(48);
    textAlign('center')
    strokeWeight(2);
    frequency = indexOfNote * nyquist / freq.length;
    text(round(frequency * 1000) / 1000 + ' Hz', width/2, height/2);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
