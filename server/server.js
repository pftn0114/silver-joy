const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const app = express();

// 配置 CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API路由
app.post('/api/predict', upload.single('data'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('data', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // 添加其他参数
        const params = JSON.parse(req.body.params || '{}');
        Object.keys(params).forEach(key => {
            formData.append(key, params[key]);
        });

        const response = await fetch('https://s5k.cn/api/v1/studio/modelscope/E2-F5-TTS/gradio/predict/1', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.send('OK');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 