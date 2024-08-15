from flask import Flask, Request, request, send_from_directory
from flask_cors import CORS, cross_origin
import whisper
from llama_cpp import Llama
import tempfile
from transformers import VitsModel, AutoTokenizer, pipeline
import torch
import scipy
import time
import uuid

base_url = "http://localhost:8080"
system_prompt = "Du bist ein hilfreicher Assistent. Bitte halte dich kurz und prägnant."

app = Flask(__name__)
app.json.ensure_ascii = False
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"


class SpeechToTextModel:
    def __init__(self):
        self.model = pipeline(
            "automatic-speech-recognition", "./models/stt/whisper-base"
        )

    def speech_to_text(self, speech: bytes) -> str:
        temp_file = write_request_to_temp_file(speech)

        transcription = self.model(temp_file.name, chunk_length_s=30)
        return transcription["text"].strip()


class LargeLanguageModel:
    def __init__(self):
        self.model = Llama(
            model_path="./models/llm/em_german_leo_mistral.Q4_K_M.gguf",
        )

    def eval(self, system_propmt: str, user_prompt: str) -> str:
        prompt = f"{system_prompt} USER: {user_prompt} ASSISTANT: "

        output = self.model(
            prompt,
            max_tokens=20,
            stop=[
                "USER:",
                "\n",
            ],
        )

        text = output["choices"][0]["text"]
        text = text[len(prompt) :].strip().removeprefix("ASSISTANT:").strip()
        return text


class TextToSpeechModel:
    def __init__(self):
        self.tts_model = VitsModel.from_pretrained("./models/tts/facebook_mms-tts-deu")
        self.tts_tokenizer = AutoTokenizer.from_pretrained(
            "./models/tts/facebook_mms-tts-deu"
        )

    def text_to_speech(self, text: str):
        inputs = self.tts_tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            output = self.tts_model(**inputs).waveform
            return output.cpu().float().numpy().transpose()

    @property
    def sampling_rate(self):
        return self.tts_model.config.sampling_rate


start = time.time()
stt_model = SpeechToTextModel()
llm_model = LargeLanguageModel()
tts_model = TextToSpeechModel()
end = time.time()

print(f"Load time: {end-start}")


def write_request_to_temp_file(audio: bytes):
    tmp_file = tempfile.NamedTemporaryFile()
    tmp_file.write(audio)
    return tmp_file


def time_function(f):
    start = time.time()
    result = f()
    end = time.time()
    return result, end - start


def write_audio_to_disk(audio):
    id = uuid.uuid4()
    out_file = f"data/{id}.wav"
    scipy.io.wavfile.write(out_file, rate=tts_model.sampling_rate, data=audio)
    return f"{base_url}/audio/{id}.wav"


@app.route("/audio/<path:path>")
def serve_audio_files(path):
    return send_from_directory("data", path)


@app.route("/assistant/text", methods=["POST"])
def assistant_text():
    req = request.json
    if not req or "text" not in req:
        raise Exception("400")
    user_text = req["text"]

    result_text, time_llm = time_function(
        lambda: llm_model.eval(system_prompt, user_text)
    )
    output_audio, time_tts = time_function(
        lambda: tts_model.text_to_speech(result_text)
    )

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
    transcription, time_stt = time_function(
        lambda: stt_model.speech_to_text(input_audio)
    )
    result_text, time_llm = time_function(
        lambda: llm_model.eval(system_prompt, transcription)
    )
    output_audio, time_tts = time_function(
        lambda: tts_model.text_to_speech(result_text)
    )

    output_url = write_audio_to_disk(output_audio)

    return {
        "timings": {
            "time_stt": time_stt,
            "time_llm": time_llm,
            "time_tts": time_tts,
        },
        "result": {
            "input_transcription": transcription,
            "text": result_text,
            "url": output_url,
        },
    }


def main():
    app.run(debug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
