
const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const context = canvas.getContext('2d', { willReadFrequently: true });

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadModel() {
    const model = await tf.loadGraphModel('model_2l_tfjs/model.json');
    
    return model;
}

function preprocessImage(imageData) {
    return tf.tidy(() => {
        let inputTensor = tf.browser.fromPixels(imageData)
            .resizeBilinear([352, 352])
            .toFloat()
        // Subtract the mean values
        const mean = tf.tensor([103.939, 116.779, 123.68]);
        inputTensor = inputTensor.sub(mean);

        // Transpose the tensor
        inputTensor = inputTensor.transpose([2, 0, 1]);
        inputTensor = inputTensor.expandDims(0);



        // Convert to a tensor and return
        inputTensor = tf.tensor(inputTensor.arraySync(), undefined, 'float32');
        return inputTensor;
    });
}

async function detectEdges(model) {
    const startTime = performance.now();

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const inputTensor = preprocessImage(imageData);
    console.log("Model execution start");

    const startTime1 = performance.now();
    const outputTensor = await model.execute({ input: inputTensor });
    console.log("Model execution complete.");
    const endTime1 = performance.now();
    console.log(`Execution time inference: ${endTime1 - startTime1} milliseconds`);

    const output = Array.isArray(outputTensor) ? tf.sigmoid(outputTensor[2]) : outputTensor;

    const endTime3 = performance.now();
    console.log(`Execution time sigmoid: ${endTime3 - startTime} milliseconds`);

    const startTime2 = performance.now();

    const [min, max] = tf.tidy(() => {
        const min = output.min();
        const max = output.max();
        return [min, max];
    });

    const normalizedOutput = tf.tidy(() => {
        return output.sub(min).div(max.sub(min));
    });

    const scaledOutput = tf.tidy(() => {
        return normalizedOutput.mul(tf.scalar(255)).clipByValue(0, 255).cast('int32');
    });

    const reshapedOutput = tf.tidy(() => {
        return scaledOutput.squeeze();
    });

    const resizedOutput = tf.tidy(() => {
        return tf.image.resizeBilinear(reshapedOutput.expandDims(2), [canvas.height, canvas.width]);
    });

    const resizedOutputData = resizedOutput.squeeze().arraySync();

    // Clean up the remaining tensors
    tf.dispose([normalizedOutput, scaledOutput, reshapedOutput, resizedOutput]);

    const endTime2 = performance.now();
    console.log(`Execution time resizing output: ${endTime2 - startTime2} milliseconds`);
    const finalOutputData = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    for (let i = 0; i < canvas.height; i++) {
        for (let j = 0; j < canvas.width; j++) {
            const pixelValue = 255 - resizedOutputData[i][j];
            const index = (i * canvas.width + j) * 4;
            finalOutputData[index] = pixelValue;
            finalOutputData[index + 1] = pixelValue;
            finalOutputData[index + 2] = pixelValue;
            finalOutputData[index + 3] = 255;
        }
    }
    const outputImageData = new ImageData(finalOutputData, canvas.width, canvas.height);
    context.putImageData(outputImageData, 0, 0);

    // Dispose tensors to free up memory
    inputTensor.dispose();
    resizedOutput.dispose();
    if (Array.isArray(outputTensor)) {
        outputTensor.forEach(tensor => tensor.dispose());
    } else {
        outputTensor.dispose();
    }

    requestAnimationFrame(() => detectEdges(model));
}


async function main() {

    console.log("Setting up camera...");
    await setupCamera();
    console.log("Camera setup complete.");

    const model = await loadModel();
    console.log("Model Loaded.");

    // Проверка бэкэнда
    const backend = tf.getBackend();
    console.log(`Current backend: ${backend}`);

    detectEdges(model);
}

main();
