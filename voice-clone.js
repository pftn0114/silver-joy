document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const startRecord = document.getElementById('startRecord');
    const stopRecord = document.getElementById('stopRecord');
    const saveRecord = document.getElementById('saveRecord');
    const recordingTimer = document.getElementById('recordingTimer');
    const recordedAudioContainer = document.getElementById('recordedAudioContainer');
    const recordedAudio = document.getElementById('recordedAudio');
    const generateBtn = document.getElementById('generateBtn');
    const inputText = document.getElementById('inputText');
    const speedControl = document.getElementById('speedControl');
    const pitchControl = document.getElementById('pitchControl');
    
    let mediaRecorder;
    let audioChunks = [];
    let timerInterval;
    let startTime;
    let audioContext;
    let sourceNode;
    let pitchNode;
    let currentStep = 1;

    // API配置
    const API_ENDPOINT = process.env.NODE_ENV === 'production' 
        ? 'https://your-app-name.herokuapp.com/api'
        : 'http://localhost:3000/api';
    let modelId = null; // 用于存储训练后的模型ID

    // 初始化Web Audio API
    async function initAudioContext() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return audioContext;
    }

    // 更新步骤显示
    function updateSteps(step) {
        currentStep = step;
        document.querySelectorAll('.step').forEach((el, index) => {
            el.classList.remove('active', 'completed');
            if (index + 1 === step) {
                el.classList.add('active');
            } else if (index + 1 < step) {
                el.classList.add('completed');
            }
        });

        // 显示/隐藏相应的section
        document.querySelectorAll('.step-section').forEach((section, index) => {
            section.style.display = index + 1 === step ? 'block' : 'none';
        });
    }

    // 开始录音
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                recordedAudio.src = audioUrl;
                recordedAudioContainer.style.display = 'block';
                saveRecord.disabled = false;
                updateSteps(2); // 进入下一步
            });

            mediaRecorder.start();
            startRecord.disabled = true;
            stopRecord.disabled = false;
            startTimer();
        } catch (err) {
            console.error('录音失败:', err);
            alert('无法访问麦克风，请确保已授予权限');
        }
    }

    // 停止录音
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            stopTimer();
            startRecord.disabled = false;
            stopRecord.disabled = true;
        }
    }

    // 计时器功能
    function startTimer() {
        startTime = Date.now();
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        recordingTimer.textContent = `${minutes}:${seconds}`;
    }

    // 添加加载状态管理函数
    function setLoading(isLoading) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = isLoading;
        });
        
        // 显示/隐藏加载提示
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    // 添加重试函数
    async function fetchWithRetry(url, options, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    return response;
                }
                console.warn(`Attempt ${i + 1} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                console.warn(`Attempt ${i + 1} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        throw new Error('Max retries reached');
    }

    // 添加CORS错误检查
    function checkCORSError(error) {
        if (error instanceof TypeError && error.message.includes('CORS')) {
            alert('由于浏览器安全限制，无法直接访问API。请确保API支持跨域访问。');
            return true;
        }
        return false;
    }

    // 修改handleAudioFile函数
    async function handleAudioFile(file) {
        setLoading(true);
        try {
            // 显示加载状态
            const statusText = document.querySelector('.status-text');
            statusText.textContent = '正在上传音频...';
            
            // 创建FormData对象
            const formData = new FormData();
            formData.append('data', [
                file,           // ref_audio_orig
                '你好',         // ref_text
                '你好',         // gen_text
                'F5-TTS',      // model
                false,         // remove_silence
                0.15,          // cross_fade_duration
                1,             // speed
                '/infer'       // api_name
            ]);

            // 上传音频文件
            const response = await fetchWithRetry(`${API_ENDPOINT}/predict`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Upload response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            // 存储返回的音频URL
            const audioUrl = data.data[0]; // 第一个返回值是合成的音频
            const spectrogramUrl = data.data[1]; // 第二个返回值是频谱图

            // 更新音频播放器
            recordedAudio.src = audioUrl;
            recordedAudioContainer.style.display = 'block';
            
            // 更新界面状态
            updateSteps(2);
            
            // 直接进入第三步（因为这个API不需要训练过程）
            setTimeout(() => {
                const progressFill = document.querySelector('.progress-fill');
                progressFill.style.width = '100%';
                statusText.textContent = '准备就绪！';
                updateSteps(3);
            }, 1000);

        } catch (error) {
            if (!checkCORSError(error)) {
                alert('处理音频文件时出错：' + error.message);
            }
            console.error('Error details:', error);
        } finally {
            setLoading(false);
        }
    }

    // 修改generateVoice函数
    async function generateVoice(text, speed, pitch) {
        try {
            const generatedResult = document.querySelector('.generated-result');
            const generatedAudio = document.getElementById('generatedAudio');
            
            // 获取已上传的音频文件
            const audioResponse = await fetch(recordedAudio.src);
            const audioBlob = await audioResponse.blob();
            
            // 创建FormData对象
            const formData = new FormData();
            formData.append('data', [
                audioBlob,     // ref_audio_orig
                '你好',        // ref_text
                text,         // gen_text
                'F5-TTS',     // model
                false,        // remove_silence
                0.15,         // cross_fade_duration
                speed,        // speed
                '/infer'      // api_name
            ]);

            // 调用生成API
            const response = await fetch(`${API_ENDPOINT}/predict/1`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Generate response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            // 获取生成的音频URL
            const audioUrl = data.data[0];
            
            // 更新音频播放器
            generatedAudio.src = audioUrl;
            generatedResult.style.display = 'block';

            // 设置下载按钮
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = `生成语音_${new Date().toISOString()}.wav`;
                a.click();
            };

        } catch (error) {
            if (!checkCORSError(error)) {
                alert('生成语音失败：' + error.message);
            }
            console.error('Error details:', error);
        }
    }

    // 添加音频格式转换函数
    async function convertToWav(audioBlob) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
            
            const wavBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                wavBuffer.copyToChannel(audioBuffer.getChannelData(channel), channel);
            }
            
            const wavBlob = await new Promise(resolve => {
                const offlineContext = new OfflineAudioContext(
                    audioBuffer.numberOfChannels,
                    audioBuffer.length,
                    audioBuffer.sampleRate
                );
                
                const source = offlineContext.createBufferSource();
                source.buffer = wavBuffer;
                source.connect(offlineContext.destination);
                source.start();
                
                offlineContext.startRendering().then(renderedBuffer => {
                    const wav = new Blob([exportWAV(renderedBuffer)], { type: 'audio/wav' });
                    resolve(wav);
                });
            });
            
            return wavBlob;
        } catch (error) {
            console.error('Error converting audio:', error);
            throw error;
        }
    }

    // WAV格式导出函数
    function exportWAV(audioBuffer) {
        const interleaved = interleaveChannels(audioBuffer);
        const dataView = encodeWAV(interleaved, audioBuffer.sampleRate);
        return dataView;
    }

    function interleaveChannels(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numberOfChannels;
        const result = new Float32Array(length);
        
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                result[i * numberOfChannels + channel] = audioBuffer.getChannelData(channel)[i];
            }
        }
        
        return result;
    }

    function encodeWAV(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 2, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, samples.length * 2, true);
        
        floatTo16BitPCM(view, 44, samples);
        
        return buffer;
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function floatTo16BitPCM(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    // 事件监听器设置
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleAudioFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleAudioFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    startRecord.addEventListener('click', startRecording);
    stopRecord.addEventListener('click', stopRecording);
    
    saveRecord.addEventListener('click', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '录音_' + new Date().toISOString() + '.wav';
        a.click();
    });

    // 生成按钮点击事件
    generateBtn.addEventListener('click', () => {
        const text = inputText.value.trim();
        if (!text) {
            alert('请输入要转换的文字');
            return;
        }
        generateVoice(
            text,
            parseFloat(speedControl.value),
            parseFloat(pitchControl.value)
        );
    });

    // 范围控制器值显示更新
    [speedControl, pitchControl].forEach(control => {
        control.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
        });
    });

    // 字数统计
    inputText.addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.querySelector('.char-count').textContent = `${count}/500`;
        if (count > 500) {
            e.target.value = e.target.value.slice(0, 500);
        }
    });

    // 初始化显示第一步
    updateSteps(1);
}); 