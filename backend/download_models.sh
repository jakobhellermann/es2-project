#!/bin/bash

MODELS_DIR=${MODELS_DIR:-"./models"}

# https://huggingface.co/openai/whisper-base
huggingface-cli download openai/whisper-base --local-dir $MODELS_DIR/stt/whisper-base
# https://huggingface.co/facebook/wav2vec2-base-960h
huggingface-cli download facebook/wav2vec2-base-960h --local-dir $MODELS_DIR/stt/wave2vec2

# https://huggingface.co/TheBloke/em_german_leo_mistral-GGUF
huggingface-cli download TheBloke/em_german_leo_mistral-GGUF em_german_leo_mistral.Q4_K_M.gguf --local-dir $MODELS_DIR/llm/
# https://huggingface.co/TheBloke/Llama-2-7B-GGUF
huggingface-cli download TheBloke/Llama-2-7B-GGUF llama-2-7b.Q4_K_M.gguf --local-dir $MODELS_DIR/llm/
# https://huggingface.co/google/gemma-2-9b-it
huggingface-cli download google/gemma-2-9b-it --local-dir $MODELS_DIR/llm/gemma-2-9b-it
# https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF
huggingface-cli download bartowski/Meta-Llama-3-8B-Instruct-GGUF Meta-Llama-3-8B-Instruct-Q4_K_M.gguf --local-dir $MODELS_DIR/llm/

# https://huggingface.co/facebook/mms-tts-deu
huggingface-cli download facebook/mms-tts-deu --local-dir $MODELS_DIR/tts/facebook_mms-tts-deu
