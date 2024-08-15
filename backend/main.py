from flask import Flask, Request, request, send_from_directory
from flask_cors import CORS, cross_origin
import whisper
from llama_cpp import Llama
import tempfile
from transformers import VitsModel, AutoTokenizer
import torch
import scipy
import time
import uuid

base_url = "http://localhost:8080"

app = Flask(__name__)
app.json.ensure_ascii = False
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"


def write_request_to_temp_file(audio: bytes):
    tmp_file = tempfile.NamedTemporaryFile()
    print(audio)
    tmp_file.write(audio)
    return tmp_file


def speech_to_text(speech: bytes) -> str:
    temp_file = write_request_to_temp_file(speech)

    whisper_result = stt_model.transcribe(temp_file.name, fp16=False)
    return whisper_result["text"]


def text_to_speech(text: str):
    inputs = tts_tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        output = tts_model(**inputs).waveform
        return output.cpu().float().numpy().transpose()


def generate_llm(system_prompt: str, user_prompt: str) -> str:
    prompt = f"{system_prompt} USER: {user_prompt} ASSISTANT: "
    print("prompt:", prompt)

    output = llm_model(
        prompt,
        max_tokens=100,  # Generate up to 32 tokens, set to None to generate up to the end of the context window
        stop=[
            "USER:",
            "\n",
        ],  # Stop generating just before the model would generate a new question
        echo=True,  # Echo the prompt back in the output
    )

    print(output)

    text = output["choices"][0]["text"]
    text = text[len(prompt) :].strip().removeprefix("ASSISTANT:").strip()
    return text


def time_function(f):
    start = time.time()
    result = f()
    end = time.time()
    return result, end - start


@app.route("/audio/<path:path>")
def send_report(path):
    return send_from_directory("data", path)


system_prompt = "Du bist ein hilfreicher Assistent. Bitte halte dich kurz und prägnant."


def write_audio_to_disk(audio):
    id = uuid.uuid4()
    out_file = f"data/{id}.wav"
    scipy.io.wavfile.write(out_file, rate=tts_model.config.sampling_rate, data=audio)
    return f"{base_url}/audio/{id}.wav"


@app.route("/assistant/text", methods=["POST"])
def assistant_text():
    req = request.json
    if not req or "text" not in req:
        raise Exception("400")
    user_text = req["text"]

    result_text, time_llm = time_function(
        lambda: generate_llm(system_prompt, user_text)
    )
    output_audio, time_tts = time_function(lambda: text_to_speech(result_text))

    output_url = write_audio_to_disk(output_audio)

    return {
        "timings": {
            "time_llm": time_llm,
            "time_tts": time_tts,
        },
        "result": {
            "text": result_text,
            "url": output_url,
        },
    }


@app.route("/assistant/audio", methods=["POST"])
def assistant():
    input_audio = request.get_data()
    transcription, time_stt = time_function(lambda: speech_to_text(input_audio))
    result_text, time_llm = time_function(
        lambda: generate_llm(system_prompt, transcription)
    )
    output_audio, time_tts = time_function(lambda: text_to_speech(result_text))

    output_url = write_audio_to_disk(output_audio)

    return {
        "timings": {
            "time_stt": time_stt,
            "time_llm": time_llm,
            "time_tts": time_tts,
        },
        "result": {
            "text": result_text,
            "url": output_url,
        },
    }


def main():
    global stt_model
    stt_model = whisper.load_model("base")
    print("model 'base' loaded")

    global llm_model
    llm_model = Llama(
        model_path="./models/em_german_leo_mistral.Q4_K_M.gguf",
    )

    global tts_model, tts_tokenizer
    tts_model = VitsModel.from_pretrained("facebook/mms-tts-deu")
    tts_tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-deu")

    app.run(debug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
