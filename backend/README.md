# backend

## Run

```sh
# create a venv
python3 -m venv .venv

# activate the venv
# on windows
.venv\Scripts\activate
# on bash
source .venv/bin/activate
# on fish
. .venv/bin/activate.fish

# install dependencies
pip install -r requirements.txt

# start
python3 main.py
```


# Models

## Speech to Text
huggingface-cli download distil-whisper/distil-large-v3-openai
https://huggingface.co/blog/asr-chunking

## LLM

### English models:

- https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/blob/main/llama-2-7b-chat.Q4_K_M.gguf

### German models:

- https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/blob/main/llama-2-7b-chat.Q4_K_M.gguf (english)
- https://huggingface.co/TheBloke/em_german_leo_mistral-GGUF/blob/main/em_german_leo_mistral.Q4_K_M.gguf (german)

## Text to Speech

- suno/bark -> super super slow
- [mms-tts](https://huggingface.co/facebook/mms-tts-deu) -> ok

# Example:

```sh
curl localhost:8080/assistant/audio -XPOST --data-binary @audio.mp3
curl localhost:8080/assistant/text -XPOST -H 'Content-Type: application/json' -d '{ "text": "What is your name?" }'

# Model selection
curl localhost:8080/models
curl 'localhost:8080/assistant/text?llm_model=...&tts_model=...'
```
