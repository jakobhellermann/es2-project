from flask import Flask, request, send_from_directory
from flask_cors import CORS
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


class LlamaModel:
    def __init__(self, model_path):
        self.model = Llama(
            model_path=model_path,
        )

    def eval(self, system_prompt: str, user_prompt: str) -> str:
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
        text = text.removeprefix(prompt).strip().removeprefix("ASSISTANT:")
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
llm_models = {
    "em_german_leo_mistral-Q4": LlamaModel(
        "./models/llm/em_german_leo_mistral.Q4_K_M.gguf"
    ),
    "llama2-7b-Q4": LlamaModel("./models/llm/llama-2-7b.Q4_K_M.gguf"),
}
stt_models = {
    "whisper-base": SpeechToTextModel(),
}
tts_models = {
    "facebook_mms-deu": TextToSpeechModel(),
}
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


def write_audio_to_disk(sampling_rate, audio):
    id = uuid.uuid4()
    out_file = f"data/{id}.wav"
    scipy.io.wavfile.write(out_file, rate=sampling_rate, data=audio)
    return f"{base_url}/audio/{id}.wav"


@app.route("/audio/<path:path>")
def serve_audio_files(path):
    return send_from_directory("data", path)


@app.route("/models")
def available_models():
    return {
        "stt": list(stt_models.keys()),
        "llm": list(llm_models.keys()),
        "tts": list(tts_models.keys()),
    }


@app.route("/assistant/text", methods=["POST"])
def assistant_text():
    request_body = request.json
    if not request_body or "text" not in request_body:
        raise Exception("400")
    user_text = request_body["text"]

    llm_model_name = request.args.get("llm_model", next(iter(llm_models)))
    if llm_model_name not in llm_models:
        raise Exception(f"LLM model '{llm_model_name}' does not exist")
    llm_model = llm_models[llm_model_name]

    tts_model_name = request.args.get("tts_model", next(iter(tts_models)))
    if tts_model_name not in tts_models:
        raise Exception(f"tts model '{tts_model_name}' does not exist")
    tts_model = tts_models[tts_model_name]

    print(f"Using models llm={llm_model_name} tts={tts_model_name}")

    result_text, time_llm = time_function(
        lambda: llm_model.eval(system_prompt, user_text)
    )
    output_audio, time_tts = time_function(
        lambda: tts_model.text_to_speech(result_text)
    )

    output_url = write_audio_to_disk(tts_model.sampling_rate, output_audio)

    return {
        "timings": {
            "time_stt": 0,
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

    tts_model_name = request.args.get("tts_model", next(iter(tts_models)))
    if tts_model_name not in tts_models:
        raise Exception(f"tts model '{tts_model_name}' does not exist")
    tts_model = tts_models[tts_model_name]

    llm_model_name = request.args.get("llm_model", next(iter(llm_models)))
    if llm_model_name not in llm_models:
        raise Exception(f"LLM model '{llm_model_name}' does not exist")
    llm_model = llm_models[llm_model_name]

    stt_model_name = request.args.get("stt_model", next(iter(stt_models)))
    if stt_model_name not in stt_models:
        raise Exception(f"stt model '{stt_model_name}' does not exist")
    stt_model = stt_models[stt_model_name]

    print(
        f"Using models stt={stt_model_name} llm={llm_model_name} tts={tts_model_name}"
    )

    transcription, time_stt = time_function(
        lambda: stt_model.speech_to_text(input_audio)
    )
    result_text, time_llm = time_function(
        lambda: llm_model.eval(system_prompt, transcription)
    )
    output_audio, time_tts = time_function(
        lambda: tts_model.text_to_speech(result_text)
    )

    output_url = write_audio_to_disk(tts_model.sampling_rate, output_audio)

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
