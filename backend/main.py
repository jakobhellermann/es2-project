from flask import Flask, request, send_from_directory
from flask_cors import CORS
from llama_cpp import Llama
from transformers import pipeline
import torch
import time
import os

from stt import STT
from stt.pipeline import AutomaticSpeechRecognitionPipeline

from tts.piper import PiperTTS
from tts.vits import VitsTTS
from tts import TTS

system_prompt = "Du bist ein hilfreicher Assistent. Bitte halte dich kurz und prägnant."

app = Flask(__name__, static_folder="frontend")
app.json.ensure_ascii = False
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"

USE_GPU = True

class LlamaModel:
    def __init__(self, model_path):
        self.model = Llama(
            model_path=model_path,
            n_gpu_layers = -1 if USE_GPU else None,
            chat_format="llama-2"
        )

    def eval(self, system_prompt: str, user_prompt: str) -> str:
        prompt = f"{system_prompt} USER: {user_prompt} ASSISTANT: "

        output = self.model(
            prompt,
            max_tokens=250,
            stop=[
                "USER:",
                "\n",
            ],
        )

        text = output["choices"][0]["text"]
        text = text.removeprefix(prompt).strip().removeprefix("ASSISTANT:")
        return text

class TransformersPipelineModel:
    def __init__(self, model_path):
        self.pipeline = pipeline(
            "text-generation",
            model=model_path,
            model_kwargs={"torch_dtype": torch.bfloat16},
            device_map="auto",
        )
    def eval(self, system_prompt: str, user_prompt: str):
        messages = [
            #{"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        terminators = [
            self.pipeline.tokenizer.eos_token_id,
            self.pipeline.tokenizer.convert_tokens_to_ids("<|eot_id|>")
        ]

        outputs = self.pipeline(
            messages,
            max_new_tokens=200,
            eos_token_id=terminators,
            do_sample=True,
            temperature=0.6,
            top_p=0.9,
        )
        print(outputs)
        return outputs[0]["generated_text"][-1]["content"]


start = time.time()

llm_models = {
    # "em_german_leo_mistral-Q4": LlamaModel("./models/llm/em_german_leo_mistral.Q4_K_M.gguf"),
    # "llama2-7b-Q4": LlamaModel("./models/llm/llama-2-7b.Q4_K_M.gguf"),
    "llama3-8b-Q4": LlamaModel("./models/llm/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf"),
    # "llama-3-8b-transformers": TransformersPipelineModel("meta-llama/Meta-Llama-3-8B-Instruct"),
    "gemma-2-9b-it": TransformersPipelineModel("./models/llm/gemma-2-9b-it"),
}

stt_models: dict[str, STT] = {
    "whisper-base": AutomaticSpeechRecognitionPipeline("./models/stt/whisper-base"),
}

tts_models: dict[str, TTS] = {
    "facebook_mms-deu": VitsTTS(model="./models/tts/facebook_mms-tts-deu"),
    "piper": PiperTTS(
        model="./models/tts/piper/de_DE-thorsten-medium.onnx",
        config="./models/tts/piper/de_DE-thorsten-medium.onnx.json",
    ),
}

end = time.time()

print(f"Load time: {end-start}")

def time_function(f):
    start = time.time()
    result = f()
    end = time.time()
    return result, end - start


@app.route("/api/audio/<path:path>")
def serve_audio_files(path):
    return send_from_directory("data", path)


@app.route("/api/models")
def available_models():
    return {
        "stt": list(stt_models.keys()),
        "llm": list(llm_models.keys()),
        "tts": list(tts_models.keys()),
    }


@app.route("/api/assistant/text", methods=["POST"])
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
    speech_file, time_tts = time_function(lambda: tts_model.text_to_speech(result_text))

    return {
        "timings": {
            "time_stt": 0,
            "time_llm": time_llm,
            "time_tts": time_tts,
        },
        "result": {
            "text": result_text,
            "url": f"/api/audio/{speech_file}",
        },
    }


@app.route("/api/assistant/audio", methods=["POST"])
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

    speech_file, time_tts = time_function(lambda: tts_model.text_to_speech(result_text))

    return {
        "timings": {
            "time_stt": time_stt,
            "time_llm": time_llm,
            "time_tts": time_tts,
        },
        "result": {
            "input_transcription": transcription,
            "text": result_text,
            "url": f"/api/audio/{speech_file}",
        },
    }


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


def main():
    app.run(debug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
