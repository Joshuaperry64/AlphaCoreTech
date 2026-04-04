document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const statusText = document.getElementById('status-text');
    const loader = document.getElementById('loader');
    const logPanel = document.getElementById('log-panel');

    function log(message, isError = false) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const div = document.createElement('div');
        div.className = `log-entry ${isError ? 'log-error' : ''}`;
        div.textContent = `[${time}] > ${message}`;
        logPanel.appendChild(div);
        logPanel.scrollTop = logPanel.scrollHeight;
    }

    async function checkJobStatus(endpointId, apiKey, jobId) {
        const statusUrl = `https://api.runpod.ai/v2/${endpointId}/status/${jobId}`;
        
        try {
            const response = await fetch(statusUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return await response.json();
            
        } catch (error) {
            log(`Status check failed: ${error.message}`, true);
            throw error;
        }
    }

    async function pollJob(endpointId, apiKey, jobId, delay = 2000) {
        log(`📡 Polling job status: ${jobId}`);
        while (true) {
            const data = await checkJobStatus(endpointId, apiKey, jobId);
            
            if (data.status === "COMPLETED") {
                log(`✅ Job sequence completed.`);
                return data.output;
            } else if (data.status === "FAILED") {
                log(`❌ Engine failure detected.`, true);
                throw new Error("RunPod job failed.");
            } else if (data.status === "IN_QUEUE" || data.status === "IN_PROGRESS") {
                log(`⏳ Runtime status: ${data.status}...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw new Error(`Unknown job status received: ${data.status}`);
            }
        }
    }

    generateBtn.addEventListener('click', async () => {
        const endpointId = document.getElementById('runpod-id').value.trim();
        const apiKey = document.getElementById('api-key').value.trim();
        const prompt = document.getElementById('prompt').value.trim();
        const width = parseInt(document.getElementById('width').value, 10);
        const height = parseInt(document.getElementById('height').value, 10);
        const steps = parseInt(document.getElementById('steps').value, 10);
        const cfg = parseFloat(document.getElementById('cfg').value);

        if (!endpointId || !apiKey) {
            log('SECURITY VIOLATION: Endpoint ID or API Key missing.', true);
            alert('Supply your RunPod credentials before attempting injection.');
            return;
        }
        if (!prompt) {
            log('INSTRUCTION ERROR: Empty prompt matrix.', true);
            return;
        }

        // Lock UI
        generateBtn.disabled = true;
        generateBtn.textContent = "// EXECUTING...";
        resultImage.style.display = 'none';
        statusText.style.display = 'none';
        loader.style.display = 'block';

        const payload = {
            input: {
                prompt: prompt,
                width: width,
                height: height,
                num_inference_steps: steps,
                guidance_scale: cfg
            }
        };

        log(`🚀 Firing sequence to RunPod Endpoint [${endpointId}]...`);

        try {
            // Using runSync for instant return, but Runpod might redirect to async polling
            const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Endpoint rejected request: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            log(`📦 Job queued successfully. Job ID: ${data.id}`);
            
            // Poll for the artifact
            const output = await pollJob(endpointId, apiKey, data.id);

            if (output && output.image) {
                // Decode base64 
                resultImage.src = `data:image/png;base64,${output.image}`;
                resultImage.style.display = 'block';
                loader.style.display = 'none';
                log(`🖼️ Artifact rendering complete. Process terminated cleanly.`);
            } else if (output && output.error) {
                throw new Error(output.error);
            } else {
                throw new Error("Payload returned empty image data.");
            }

        } catch (err) {
            log(`SYSTEM FAILURE: ${err.message}`, true);
            statusText.textContent = "SYNTHESIS FAILED";
            statusText.style.display = 'block';
            loader.style.display = 'none';
        } finally {
            // Unlock UI
            generateBtn.disabled = false;
            generateBtn.textContent = "INITIATE SYNTHESIS SEQUENCE";
        }
    });

    log(`Network module loaded. Awaiting credential injection.`);
});