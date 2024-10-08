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
    let model = null;

    try {
        if (!path.includes('tflite') && !path.includes('Daniils')) {
            model = await tf.loadGraphModel(path);
        }
        else if (!path.includes('Daniils')) {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch model from ${path}: ${response.statusText}`);
            }
            const buffer = await response.arrayBuffer();
            model = await tflite.loadTFLiteModel(buffer);
        }
        else {
            model = await tf.loadLayersModel(path);
        }


        // Проверяем, что модель успешно загрузилась
        if (!model) {
            throw new Error('Model failed to load');
        }
        console.log('Model loaded successfully.');
    } catch (error) {
        console.error('Error loading the model:', error);
        throw error; // Опционально, если нужно остановить выполнение в случае ошибки
    }

    return model;
}

function preprocessImage(imageData) {
    return tf.tidy(() => {
        let inputTensor = tf.browser.fromPixels(imageData)
            .resizeBilinear([size, size])
            .toFloat()
        // Subtract the mean values
        const mean = tf.tensor([103.939, 116.779, 123.68]);
        inputTensor = inputTensor.sub(mean);

        // Transpose the tensor
        if ((!path.includes('tflite')) && (!path.includes('keras'))) {
            inputTensor = inputTensor.transpose([2, 0, 1]);
        }
        inputTensor = inputTensor.expandDims(0);



        // Convert to a tensor and return
        inputTensor = tf.tensor(inputTensor.arraySync(), undefined, 'float32');
        return inputTensor;
    });
}

async function detectEdges(model) {
    //const startTime = performance.now();

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const inputTensor = preprocessImage(imageData);
    console.log("Model execution start");

    const startTime1 = performance.now();
    let outputTensor = null
    if (!path.includes('tflite')) {
        if (path.includes('keras')) {
            outputTensor = await model.execute({ 'input_layer_9:0': inputTensor })
        }
        else {
            outputTensor = await model.execute({ input: inputTensor });
        }
    }
    else {
        outputTensor = await model.predict(inputTensor);
    }


    console.log("Model execution complete.");
    const endTime1 = performance.now();
    console.log(`Execution time inference: ${endTime1 - startTime1} milliseconds`);

    //const output = tf.sigmoid(outputTensor[output_block]);
    let output = null
    if (!path.includes('pruned')) {
        output = outputTensor[output_block];

    }
    else {
        output = outputTensor
    }


    //    const startTime2 = performance.now();

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


    const binaryOutput = tf.tidy(() => {
        const threshold = 1;
        return resizedOutput.greater(tf.scalar(threshold)).mul(tf.scalar(255)).cast('int32');
    });

    const binaryOutputData = binaryOutput.squeeze().arraySync();

    // Clean up intermediate tensors
    tf.dispose([normalizedOutput, scaledOutput, reshapedOutput, resizedOutput, binaryOutput]);

    // Convert to ImageData
    const finalOutputData = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    for (let i = 0; i < canvas.height; i++) {
        for (let j = 0; j < canvas.width; j++) {
            const pixelValue = 255 - binaryOutputData[i][j];
            const index = (i * canvas.width + j) * 4;
            finalOutputData[index] = pixelValue;
            finalOutputData[index + 1] = pixelValue;
            finalOutputData[index + 2] = pixelValue;
            finalOutputData[index + 3] = 255; // Full opacity
        }
    }

    const outputImageData = new ImageData(finalOutputData, canvas.width, canvas.height);
    context.putImageData(outputImageData, 0, 0);

    // Dispose tensors to free up memory
    inputTensor.dispose();


    requestAnimationFrame(() => detectEdges(model));
}



async function initializeBackend() {
    /* const success = await tf.setBackend('wasm');
    if (!success) {
        console.error("Failed to set backend to wasm. Falling back to webgl.");
        await tf.setBackend('webgl');
    } */
    await tf.setBackend('webgl');
    await tf.ready();
    console.log(`Using backend: ${tf.getBackend()}`);
    console.log(`Model path: ${path}`)
}

async function main() {
    console.log("Initializing backend...");
    await initializeBackend();
    console.log("Backend initialized.");

    console.log("Setting up camera...");
    await setupCamera();
    console.log("Camera setup complete.");

    const model = await loadModel();
    console.log("Model Loaded.");

    detectEdges(model);
}


main();
