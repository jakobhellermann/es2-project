#!/bin/bash

MODELS_DIR=${MODELS_DIR:-"./models"}

### STT

# https://huggingface.co/openai/whisper-base
huggingface-cli download openai/whisper-base --local-dir "$MODELS_DIR/stt/whisper-base"

### LLM

# https://huggingface.co/TheBloke/em_german_leo_mistral-GGUF
huggingface-cli download TheBloke/em_german_leo_mistral-GGUF em_german_leo_mistral.Q4_K_M.gguf --local-dir "$MODELS_DIR/llm/"
# https://huggingface.co/TheBloke/Llama-2-7B-GGUF
huggingface-cli download TheBloke/Llama-2-7B-Chat-GGUF llama-2-7b-chat.Q4_K_M.gguf --local-dir "$MODELS_DIR/llm/"
# https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF
huggingface-cli download bartowski/Meta-Llama-3-8B-Instruct-GGUF Meta-Llama-3-8B-Instruct-Q4_K_M.gguf --local-dir "$MODELS_DIR/llm/"
# https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf
huggingface-cli download microsoft/Phi-3-mini-4k-instruct-gguf Phi-3-mini-4k-instruct-q4.gguf --local-dir "$MODELS_DIR/llm/"

# huggingface-cli download meta-llama/Meta-Llama-3-8B-Instruct --local-dir "$MODELS_DIR/llm/"

# https://huggingface.co/google/gemma-2-9b-it
huggingface-cli download google/gemma-2-9b-it --local-dir "$MODELS_DIR/llm/gemma-2-9b-it"

### TTS

# https://huggingface.co/facebook/mms-tts-deu
huggingface-cli download facebook/mms-tts-deu --local-dir "$MODELS_DIR/tts/facebook_mms-tts-deu"

function download_piper_voice {
	voice=$1; quality=$2
	huggingface-cli download --local-dir "$MODELS_DIR/tts/piper" rhasspy/piper-voices \
		de/de_DE/$voice/$quality/de_DE-$voice-$quality.onnx de/de_DE/$voice/$quality/de_DE-$voice-$quality.onnx.json
}
download_piper_voice eva_k x_low
download_piper_voice thorsten medium
