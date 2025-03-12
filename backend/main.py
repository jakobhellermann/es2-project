from typing import Iterable
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from llama_cpp import Llama
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TextIteratorStreamer,
    PreTrainedModel,
    PreTrainedTokenizer,
)
import threading
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

socketio = SocketIO(app, debug=True, cors_allowed_origins="*", async_mode="eventlet")

USE_GPU = True
MAX_TOKENS = None
TEMPERATURE = 0.8
TOP_P = 0.95
TOP_K = 40


class LlamaModel:
    def __init__(self, model_path):
        self.model = Llama(
            model_path=model_path,
            n_gpu_layers=-1 if USE_GPU else None,
            n_ctx=2048,
            # verbose = False,
        )

    def eval(
        self, system_prompt: str, user_prompt: str, context: list
    ) -> Iterable[str]:
        messages = [
            {
                "role": "system",
                "content": system_prompt,
            },
        ]
        for c in context:
            messages.append(
                {
                    "role": "system" if c["reply"] else "user",
                    "content": c["message"],
                }
            )
        messages.append(
            {"role": "user", "content": user_prompt},
        )
        print(messages)

        output = self.model.create_chat_completion(
            messages=messages,
            stream=True,
            temperature=TEMPERATURE,
            top_p=TOP_P,
            top_k=TOP_K,
        )

        for segment in output:
            segment = segment["choices"][0]["delta"]
            if "content" in segment:
                yield segment["content"]


class TransformersModel:
    tokenizer: PreTrainedTokenizer
    model: PreTrainedModel

    def __init__(self, model_path):
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path, torch_dtype=torch.bfloat16
        )

    def eval(self, system_prompt: str, user_prompt: str, context):
        messages = [
            # {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        tokenized_chat = self.tokenizer.apply_chat_template(
            messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
        )

        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True)
        thread = threading.Thread(
            target=self.model.generate,
            args=(tokenized_chat,),
            kwargs={
                "streamer": streamer,
                "max_new_tokens": MAX_TOKENS if MAX_TOKENS != None else 30,
                "do_sample": True,
                "temperature": TEMPERATURE,
                "top_p": TOP_P,
                "top_k": TOP_K,
            },
        )
        thread.start()
        return streamer


start = time.time()

llm_models = {
    # "em_german_leo_mistral-Q4": LlamaModel("./models/llm/em_german_leo_mistral.Q4_K_M.gguf"),
    # "llama2-7b-Q4": LlamaModel("./models/llm/llama-2-7b-chat.Q4_K_M.gguf"),
    "llama3-8b-Q4": LlamaModel("./models/llm/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf"),
    "phi-3": LlamaModel("models/llm/Phi-3-mini-4k-instruct-q4.gguf"),
    # "llama-3-8b-transformers": TransformersModel("meta-llama/Meta-Llama-3-8B-Instruct"),
    "gemma-2-9b-it": TransformersModel("./models/llm/gemma-2-9b-it"),
}

stt_models: dict[str, STT] = {
    "whisper-base": AutomaticSpeechRecognitionPipeline("./models/stt/whisper-base"),
}

tts_models: dict[str, TTS] = {
    "piper-thorsten": PiperTTS(
        model="models/tts/piper/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx",
        config="models/tts/piper/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json",
    ),
    "piper-eva": PiperTTS(
        model="models/tts/piper/de/de_DE/eva_k/x_low/de_DE-eva_k-x_low.onnx",
        config="models/tts/piper/de/de_DE/eva_k/x_low/de_DE-eva_k-x_low.onnx.json",
    ),
    "facebook_mms-deu": VitsTTS(model="./models/tts/facebook_mms-tts-deu"),
}

end = time.time()

print(f"Load time: {end - start}")


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


@socketio.on("send_message")
def assistant_io(request):
    input_text = request.get("text")
    context = request.get("context")
    input_audio = request.get("audio")

    match (input_text, input_audio):
        case (None, None):
            raise Exception("400")
        case (a, b) if a != None and b != None:
            raise Exception("400")

    stt_model_name = request["stt_model"]
    if input_audio:
        if stt_model_name not in stt_models:
            raise Exception(f"stt model '{stt_model_name}' does not exist")
        stt_model = stt_models[stt_model_name]

        print(f"Using models stt={stt_model_name}")
        input_text, time_stt = time_function(
            lambda: stt_model.speech_to_text(input_audio)
        )
        emit("response_stt_finished", {"time": time_stt, "transcription": input_text})

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
    llm_stream = llm_model.eval(system_prompt, input_text, context)
    result_text = ""
    for segment in llm_stream:
        result_text += segment
        print(segment, end="", flush=True)
        emit("response_llm_update", {"segment": segment})
        socketio.sleep(0)
    llm_eval_time = time.time() - llm_eval_start
    emit("response_llm_finished", {"time": llm_eval_time})

    speech_file, time_tts = time_function(lambda: tts_model.text_to_speech(result_text))
    emit(
        "response_tts_finished",
        {
            "time": time_tts,
            "url": f"/api/audio/{speech_file}",
        },
    )


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


def main():
    socketio.run(app, debug=False, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
