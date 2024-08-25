- start http-server

#Old models

- goto http://127.0.0.1:8080 for two-blocks DexiNed
- goto http://127.0.0.1:8080/?3 for three-blocks DexiNed
- goto http://127.0.0.1:8080/?teed_json for Teed
- goto http://127.0.0.1:8080/?teed16_json for Teed with float16
- goto http://127.0.0.1:8080/?teed_tfl_ex_onnx for tflite Teed ex ONNX with float16

#New Daniil's models

- goto http://127.0.0.1:8080/?teed_tflite_dynamic_range for Teed with dynamic range quntization
- goto http://127.0.0.1:8080/?teed_tflite_quant16 for Teed with float16 quantization
- goto http://127.0.0.1:8080/?teed_tflite_32 for tflite Teed ex tensorflow float32 model