- start https-server

# Not Daniil's models

- goto https://127.0.0.1:8080 for two-blocks DexiNed
- goto https://127.0.0.1:8080/?3 for three-blocks DexiNed
- goto https://127.0.0.1:8080/?teed_json for Teed
- goto https://127.0.0.1:8080/?teed16_json for Teed with float16
- goto https://127.0.0.1:8080/?teed_tfl_ex_onnx for tflite Teed ex ONNX with float16 (won't work due to https://github.com/tensorflow/tfjs/issues/6242)
- goto https://127.0.0.1:8080/?teed_tfl_ex_onnx_output1 for Teed ex ONNX with float16 subgraph output1 (model.json format)
- goto https://127.0.0.1:8080/?teed_tfl_ex_onnx_output1_optim for Teed ex ONNX with float16 subgraph output1 graph optimized by onnx python api (model.json format)
- goto https://127.0.0.1:8080/?teed_tfl_ex_onnx_output1_clust for Teed ex ONNX with float16 subgraph output1 graph optimized by onnx python api & further weights clusterized (max weights 16) by sci-kit learn (model.json format)


# Daniil's models

- goto https://127.0.0.1:8080/?teed_tflite_dynamic_range for Teed with dynamic range quntization
- goto https://127.0.0.1:8080/?teed_tflite_quant16 for Teed with float16 quantization
- goto https://127.0.0.1:8080/?teed_tflite_32 for tflite Teed ex tensorflow float32 model
- goto https://127.0.0.1:8080/?teed_tflite_32_0 for output0 float32 subgraph of Teed ex tensorflow float32 model
- goto https://127.0.0.1:8080/?teed_tflite_16_0 for output0 float16 subgraph of Teed ex tensorflow float32 model
- goto https://127.0.0.1:8080/?teed_tflite_dr_0 for output0 dynamic range subgraph of Teed ex tensorflow float32 model