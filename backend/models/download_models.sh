#!/bin/bash

huggingface-cli download openai/whisper-base --local-dir stt/whisper-base
huggingface-cli download facebook/wav2vec2-base-960h --local-dir stt/wave2vec2

huggingface-cli download TheBloke/em_german_leo_mistral-GGUF em_german_leo_mistral.Q4_K_M.gguf --local-dir llm/

huggingface-cli download facebook/mms-tts-deu --local-dir tts/facebook_mms-tts-deu
