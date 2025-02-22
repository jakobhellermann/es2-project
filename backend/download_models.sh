#!/bin/bash

MODELS_DIR=${MODELS_DIR:-"./models"}

### STT

# https://huggingface.co/openai/whisper-base
huggingface-cli download openai/whisper-base --local-dir "$MODELS_DIR/stt/whisper-base"

### LLM

# https://huggingface.co/TheBloke/em_german_leo_mistral-GGUF
huggingface-cli download TheBloke/em_german_leo_mistral-GGUF em_german_leo_mistral.Q4_K_M.gguf --local-dir "$MODELS_DIR/llm/"
# https://huggingface.co/TheBloke/Llama-2-7B-GGUF
huggingface-cli download TheBloke/Llama-2-7B-GGUF llama-2-7b.Q4_K_M.gguf --local-dir "$MODELS_DIR/llm/"
# https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF
huggingface-cli download bartowski/Meta-Llama-3-8B-Instruct-GGUF Meta-Llama-3-8B-Instruct-Q4_K_M.gguf --local-dir "$MODELS_DIR/llm/"
# huggingface-cli download meta-llama/Meta-Llama-3-8B-Instruct --local-dir "$MODELS_DIR/llm/"

# https://huggingface.co/google/gemma-2-9b-it
huggingface-cli download google/gemma-2-9b-it --local-dir "$MODELS_DIR/llm/gemma-2-9b-it"

# https://huggingface.co/microsoft/phi-2
huggingface-cli download microsoft/phi-2 --local-dir "$MODELS_DIR/llm/phi-2"


### TTS

# https://huggingface.co/facebook/mms-tts-deu
huggingface-cli download facebook/mms-tts-deu --local-dir "$MODELS_DIR/tts/facebook_mms-tts-deu"

# Download piper models
echo "Downloading piper models"
mkdir -p "$MODELS_DIR/tts/piper"

test -f "$MODELS_DIR/tts/piper/de_DE-thorsten-medium.onnx" || curl -sL "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx?download=true" \
    -o "$MODELS_DIR/tts/piper/de_DE-thorsten-medium.onnx"
test -f "$MODELS_DIR/tts/piper/de_DE-thorsten-medium.onnx.json" || curl -sL "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json?download=true.json" \
    -o "$MODELS_DIR/tts/piper/de_DE-thorsten-medium.onnx.json"
