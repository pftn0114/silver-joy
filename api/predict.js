import formidable from 'formidable';
import fetch from 'node-fetch';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = new formidable.IncomingForm();
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve({ fields, files });
            });
        });

        const formData = new FormData();
        formData.append('data', files.audio);
        // ... 添加其他参数

        const response = await fetch('https://s5k.cn/api/v1/studio/modelscope/E2-F5-TTS/gradio/predict/1', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
} 