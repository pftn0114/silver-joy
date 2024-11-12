const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

// 配置 CORS 和文件上传
app.use(cors());
const upload = multer({ dest: 'uploads/' });

// 配置静态文件服务
app.use(express.static('public'));

// 代理 API 请求
app.post('/api/predict', upload.single('audio'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('data', req.file);
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
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 