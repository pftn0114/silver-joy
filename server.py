from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        audio_file = request.files['audio']
        # 构建请求
        files = {'data': audio_file}
        response = requests.post(
            'https://s5k.cn/api/v1/studio/modelscope/E2-F5-TTS/gradio/predict/1',
            files=files
        )
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000) 