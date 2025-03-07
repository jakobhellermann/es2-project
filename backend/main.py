from typing import Iterable
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
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

socketio = SocketIO(app,debug=True, cors_allowed_origins='*', async_mode="eventlet")

USE_GPU = True

class LlamaModel:
    def __init__(self, model_path):
        self.model = Llama(
            model_path=model_path,
            n_gpu_layers = -1 if USE_GPU else None,
            verbose = False,
        )

    def eval(self, system_prompt: str, user_prompt: str) -> str:
        prompt = f"{system_prompt} Q: {user_prompt} A: "

        output = self.model(
            prompt,
            max_tokens=None,
            stop=[
                "Q:",
                "\n",
            ],
        )

        text = output["choices"][0]["text"]
        text = text.removeprefix(prompt).strip().removeprefix("ASSISTANT:")
        return text
    
    def eval(self, system_prompt: str, user_prompt: str) -> Iterable[str]:
        prompt = f"{system_prompt} Q: {user_prompt} A: "

        output = self.model(
            prompt,
            max_tokens=None,
            stop=["Q:"],
            stream=True,
        )

        # return output["choices"][0]["text"]
        return map(lambda segment: segment["choices"][0]["text"], output)

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
        return [outputs[0]["generated_text"][-1]["content"]]


start = time.time()

llm_models = {
    # "em_german_leo_mistral-Q4": LlamaModel("./models/llm/em_german_leo_mistral.Q4_K_M.gguf"),
    "llama2-7b-Q4": LlamaModel("./models/llm/llama-2-7b-chat.Q4_K_M.gguf"),
    "llama3-8b-Q4": LlamaModel("./models/llm/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf"),

    # "llama-3-8b-transformers": TransformersPipelineModel("meta-llama/Meta-Llama-3-8B-Instruct"),
    # "gemma-2-9b-it": TransformersPipelineModel("./models/llm/gemma-2-9b-it"),
    # "phi-2": TransformersPipelineModel("./models/llm/phi-2"), phi doesn't provide a chat template
}

stt_models: dict[str, STT] = {
    "whisper-base": AutomaticSpeechRecognitionPipeline("./models/stt/whisper-base"),
}

tts_models: dict[str, TTS] = {
    "piper": PiperTTS(
        model="./models/tts/piper/de_DE-thorsten-medium.onnx",
        config="./models/tts/piper/de_DE-thorsten-medium.onnx.json",
    ),
    "facebook_mms-deu": VitsTTS(model="./models/tts/facebook_mms-tts-deu"),
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

@socketio.on("send_message_audio")
def assistant_io(request):

    print(request)

@socketio.on("send_message")
def assistant_io(request):
    input_text = request.get("text")
    input_audio = request.get("audio")

    match (input_text, input_audio):
        case (None, None): raise Exception("400")
        case (a, b) if a != None and b != None: raise Exception("400")

    stt_model_name = request["stt_model"]
    if input_audio:
        if stt_model_name not in stt_models:
            raise Exception(f"stt model '{stt_model_name}' does not exist")
        stt_model = stt_models[stt_model_name]

        print(f"Using models stt={stt_model_name}")
        input_text, time_stt = time_function(
            lambda: stt_model.speech_to_text(input_audio)
        )
        emit("response_stt_finished", { "time": time_stt, "transcription": input_text })

    llm_model_name = request.get("llm_model", next(iter(llm_models)))
    if llm_model_name not in llm_models:
        raise Exception(f"LLM model '{llm_model_name}' does not exist")
    llm_model = llm_models[llm_model_name]

    tts_model_name = request.get("tts_model", next(iter(tts_models)))
    if tts_model_name not in tts_models:
        raise Exception(f"tts model '{tts_model_name}' does not exist")
    tts_model = tts_models[tts_model_name]

    print(f"Using models llm={llm_model_name} tts={tts_model_name}")

    llm_eval_start = time.time()
    llm_stream = llm_model.eval(system_prompt, input_text)
    result_text = ""
    for segment in llm_stream:
        result_text += segment
        print(segment, end = "", flush=True)
        emit('response_llm_update', { "segment": segment })
        socketio.sleep(0)
    llm_eval_time = time.time() - llm_eval_start
    emit('response_llm_finished', {
        "time": llm_eval_time
    })

    speech_file, time_tts = time_function(lambda: tts_model.text_to_speech(result_text))
    emit('response_tts_finished', {
        "time": time_tts,
        "url": f"/api/audio/{speech_file}",
    })

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


def main():
    socketio.run(app, debug=True, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
