#!/bin/bash

# https://huggingface.co/openai/whisper-base
huggingface-cli download openai/whisper-base --local-dir stt/whisper-base
# https://huggingface.co/facebook/wav2vec2-base-960h
huggingface-cli download facebook/wav2vec2-base-960h --local-dir stt/wave2vec2

# https://huggingface.co/TheBloke/em_german_leo_mistral-GGUF
huggingface-cli download TheBloke/em_german_leo_mistral-GGUF em_german_leo_mistral.Q4_K_M.gguf --local-dir llm/
# https://huggingface.co/TheBloke/Llama-2-7B-GGUF
huggingface-cli download TheBloke/Llama-2-7B-GGUF llama-2-7b.Q4_K_M.gguf --local-dir llm/

# https://huggingface.co/facebook/mms-tts-deu
huggingface-cli download facebook/mms-tts-deu --local-dir tts/facebook_mms-tts-deu
