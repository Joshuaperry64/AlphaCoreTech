        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, getDocs, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        setLogLevel('debug');
        
        import { apiKey } from "./config.js";
        const jokeDisplay = document.getElementById('jokeDisplay');
        const jokeGeneratorBtn = document.getElementById('generateJokeBtn');
        const imageGeneratorBtn = document.getElementById('generateImageBtn');
        const saveBtn = document.getElementById('saveJokeBtn');
        const playGameBtn = document.getElementById('playGameBtn');
        const generateBioBtn = document.getElementById('generateBioBtn');
        const generateHaikuBtn = document.getElementById('generateHaikuBtn');
        const generateCaptionBtn = document.getElementById('generateCaptionBtn');
        const generateDuetBtn = document.getElementById('generateDuetBtn');
        const generateSongBtn = document.getElementById('generateSongBtn');
        const generatePickupBtn = document.getElementById('generatePickupBtn');
        const generateSongTitleBtn = document.getElementById('generateSongTitleBtn');
        const haikuKeywordInput = document.getElementById('haikuKeyword');
        const songTopicInput = document.getElementById('songTopic');
        const pickupNameInput = document.getElementById('pickupName');
        const imageInput = document.getElementById('imageInput');
        const jokeCollectionDiv = document.getElementById('jokeCollection');
        const spinner = document.getElementById('spinner');
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const userSelector = document.getElementById('userSelector');
        const canvasContainer = document.getElementById('canvasContainer');
        const goFishinBtn = document.getElementById('goFishinBtn');
        
        const loadingScreen = document.getElementById('loadingScreen');
        const splashScreen = document.getElementById('splashScreen');
        const startButton = document.getElementById('startButton');
        const userSelectorSplash = document.getElementById('userSelectorSplash');
        const mainApp = document.getElementById('mainApp');


        let db, auth, uid, userDisplayName;
        let currentJoke = null;
        let songAudio = null;

        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        
        const users = ["Fish", "Kiwi", "Josh", 'Lady Awesomest', `Ba"nana"`, "Hamma", "Baxturd", "Wood"];
        
        const showLoading = () => {
            spinner.classList.remove('hidden');
            document.querySelectorAll('button').forEach(btn => btn.disabled = true);
        };

        const hideLoading = () => {
            spinner.classList.add('hidden');
            document.querySelectorAll('button').forEach(btn => btn.disabled = false);
        };

        const showMessage = (message, type = 'info') => {
            jokeDisplay.innerHTML = `<div class="p-4 rounded-lg mt-4 text-center ${type === 'error' ? 'bg-red-500' : 'bg-gray-700'} text-white">${message}</div></div>`;
        };
        
        const displayOnCanvas = ({ text, color, bgColor = '#118AB2' }) => {
            const currentContentHeight = canvas.height;
            const lines = text.split('\n').map(line => line.trim());
            const newContentHeight = lines.length * 30 + 50; 
            canvas.height = currentContentHeight + newContentHeight;
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, currentContentHeight, canvas.width, newContentHeight);
            
            ctx.font = '24px Inter';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            lines.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, currentContentHeight + 50 + (index * 30));
            });
            
            canvasContainer.scrollTop = canvasContainer.scrollHeight;
        };

        const displayJokeOnCanvas = ({ joke, fish, image, authorName }) => {
            const currentContentHeight = canvas.height;
            const textLines = joke.match(/.{1,40}(\s|$)/g).map(line => line.trim());
            const textHeight = (textLines.length * 30) + 70;
            const newContentHeight = image ? 300 + textHeight + 20 : textHeight;
            canvas.height = currentContentHeight + newContentHeight;

            ctx.fillStyle = '#118AB2';
            ctx.fillRect(0, currentContentHeight, canvas.width, newContentHeight);
            
            let yOffset = currentContentHeight;

            if (image) {
                const img = new Image();
                img.onload = () => {
                    const imgWidth = canvas.width * 0.8;
                    const imgHeight = (img.height / img.width) * imgWidth;
                    ctx.drawImage(img, (canvas.width - imgWidth) / 2, yOffset + 20, imgWidth, imgHeight);
                    
                    const textY = yOffset + 20 + imgHeight + 40;
                    ctx.font = '24px Inter';
                    ctx.fillStyle = '#FFFFFF';
                    ctx.textAlign = 'center';
                    textLines.forEach((line, index) => {
                        ctx.fillText(line, canvas.width / 2, textY + (index * 30));
                    });
                    
                    ctx.font = '16px Inter';
                    ctx.fillStyle = '#FFD166';
                    ctx.fillText(`- Caught a ${fish} -`, canvas.width / 2, textY + (textLines.length * 30) + 20);
                    if (authorName) {
                         ctx.fillStyle = '#FFFFFF';
                         ctx.fillText(`By: ${authorName}`, canvas.width / 2, textY + (textLines.length * 30) + 50);
                    }
                    canvasContainer.scrollTop = canvasContainer.scrollHeight;
                };
                img.src = image;
            } else {
                const textY = yOffset + newContentHeight / 2;
                ctx.font = '24px Inter';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                textLines.forEach((line, index) => {
                    ctx.fillText(line, canvas.width / 2, textY + (index * 30) - (textLines.length * 15));
                });
                
                ctx.font = '16px Inter';
                ctx.fillStyle = '#FFD166';
                ctx.fillText(`- Caught a ${fish} -`, canvas.width / 2, textY + (textLines.length * 15) + 20);
                if (authorName) {
                     ctx.fillStyle = '#FFFFFF';
                     ctx.fillText(`By: ${authorName}`, canvas.width / 2, textY + (textLines.length * 15) + 50);
                }
                 canvasContainer.scrollTop = canvasContainer.scrollHeight;
            }
            saveBtn.classList.remove('hidden');
        };

        const playTextAsAudio = (textToSpeak) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const payload = {
                        contents: [{ parts: [{ text: textToSpeak }] }],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                        },
                        model: "gemini-2.5-flash-preview-tts"
                    };
                    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
                    const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    
                    const audioData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    const mimeType = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;

                    if (!audioData || !mimeType) throw new Error('Failed to generate audio.');
                    
                    const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
                    const pcmData = base64ToArrayBuffer(audioData);
                    const pcm16 = new Int16Array(pcmData);
                    const wavBlob = pcmToWav(pcm16, sampleRate);
                    const audioUrl = URL.createObjectURL(wavBlob);

                    const audio = new Audio(audioUrl);
                    audio.addEventListener('ended', resolve);
                    audio.play().catch(reject);
                    
                } catch (e) {
                    reject(e);
                }
            });
        };

        const fetchWithRetry = async (url, options, retries = 3) => {
            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
                    return await response.json();
                } catch (error) {
                    if (i < retries - 1) {
                        await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
                    } else {
                        throw error;
                    }
                }
            }
        };

        const base64ToArrayBuffer = (base64) => {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        };

        const pcmToWav = (pcm16, sampleRate) => {
            const dataLength = pcm16.length * 2;
            const buffer = new ArrayBuffer(44 + dataLength);
            const view = new DataView(buffer);
            let offset = 0;

            const writeString = (str) => {
                for (let i = 0; i < str.length; i++) {
                    view.setUint8(offset + i, str.charCodeAt(i));
                }
                offset += str.length;
            };

            writeString('RIFF');
            view.setUint32(offset, 36 + dataLength, true);
            offset += 4;
            writeString('WAVE');
            writeString('fmt ');
            view.setUint32(offset, 16, true);
            offset += 4;
            view.setUint16(offset, 1, true);
            offset += 2;
            view.setUint16(offset, 1, true);
            offset += 2;
            view.setUint32(offset, sampleRate, true);
            offset += 4;
            view.setUint32(offset, sampleRate * 2, true);
            offset += 4;
            view.setUint16(offset, 2, true);
            offset += 2;
            view.setUint16(offset, 16, true);
            offset += 2;
            writeString('data');
            view.setUint32(offset, dataLength, true);
            offset += 4;

            for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(offset, pcm16[i], true);
                offset += 2;
            }

            return new Blob([view], { type: 'audio/wav' });
        };

        const stopAllAudio = () => {
            if (songAudio) {
                songAudio.pause();
                songAudio.currentTime = 0;
            }
        };

        jokeGeneratorBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            currentJoke = null;
            saveBtn.classList.add('hidden');
            try {
                const prompt = "Generate a single, very humorous, and sexually suggestive fish-themed joke. The joke should be a play on words related to fish, fishing, or sea life. The response must be in JSON format with two properties: 'joke' (the joke text) and 'fish' (a fish or sea creature name).";
                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                "joke": { "type": "STRING" },
                                "fish": { "type": "STRING" }
                            },
                            "propertyOrdering": ["joke", "fish"]
                        }
                    }
                };
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const jsonString = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!jsonString) throw new Error('Failed to generate joke.');

                const jokeData = JSON.parse(jsonString);
                currentJoke = jokeData;
                displayJokeOnCanvas({ joke: jokeData.joke, fish: jokeData.fish, image: null, authorName: userDisplayName });
                playTextAsAudio(jokeData.joke);

            } catch (e) {
                showMessage(`Failed to reel in a joke. Please check your internet connection or try again later. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });

        imageGeneratorBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            currentJoke = null;
            saveBtn.classList.add('hidden');
            try {
                const userPrompt = "Generate a suggestive and humorous image of a fish with a pun. Focus on a single, clear image.";
                const payload = {
                    instances: { prompt: userPrompt },
                    parameters: { "sampleCount": 1 }
                };
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const base64Data = response?.predictions?.[0]?.bytesBase64Encoded;
                if (!base64Data) throw new Error('Failed to generate image.');
                
                const imageUrl = `data:image/png;base64,${base64Data}`;
                currentJoke = {
                    joke: "I'll show you my bass if you show me your rod.",
                    fish: "Largemouth Bass",
                    image: imageUrl
                };
                displayJokeOnCanvas({ joke: currentJoke.joke, fish: currentJoke.fish, image: currentJoke.image, authorName: userDisplayName });
                playTextAsAudio(currentJoke.joke);

            } catch (e) {
                showMessage(`Failed to generate image. The AI might be busy or your prompt was too naughty. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });

        playGameBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            try {
                const publicJokesCollectionRef = collection(db, `artifacts/${appId}/public/data/reel_deep_catches`);
                const querySnapshot = await getDocs(publicJokesCollectionRef);

                if (querySnapshot.empty) {
                    showMessage("No public jokes available. Time to make some, you scamp.", 'info');
                    return;
                }

                const allJokes = querySnapshot.docs.map(doc => doc.data());
                const randomJoke = allJokes[Math.floor(Math.random() * allJokes.length)];
                
                displayJokeOnCanvas({ 
                    joke: randomJoke.joke, 
                    fish: randomJoke.fish, 
                    image: randomJoke.image,
                    authorName: `???????` 
                });
                
                setTimeout(() => {
                    displayJokeOnCanvas({ 
                        joke: randomJoke.joke, 
                        fish: randomJoke.fish, 
                        image: randomJoke.image,
                        authorName: randomJoke.displayName
                    });
                    playTextAsAudio(`By: ${randomJoke.displayName}`);
                }, 3000);
                playTextAsAudio(randomJoke.joke);

            } catch (e) {
                showMessage(`Couldn't start the social guessing game. Perhaps the fish aren't biting today, or there's a network issue. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });

        generateBioBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            try {
                const prompt = `Write a very short, humorous, and sexually suggestive online dating bio for a man named Fish. The bio should use fish and sea-related puns.`;
                const systemPrompt = `You are a creative copywriter specializing in short-form, humor. Keep the tone playful and suggestive, but not overly explicit.`;
                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    model: "gemini-2.5-flash-preview-05-20"
                };

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const bioText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!bioText) throw new Error('Failed to generate bio.');

                displayOnCanvas({ text: bioText, color: '#FFD166', bgColor: '#073B4C' });
                playTextAsAudio(bioText);

            } catch (e) {
                showMessage(`Failed to generate a flirty bio. Maybe the AI is feeling shy, or there's a network issue. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });
        
        generateHaikuBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            try {
                const keyword = haikuKeywordInput.value;
                const prompt = `Write a single, sexually suggestive haiku about fish or fishing, incorporating the keyword "${keyword}". The haiku must follow a 5-7-5 syllable structure.`;

                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    model: "gemini-2.5-flash-preview-05-20"
                };

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                
                const haikuText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!haikuText) throw new Error('Failed to generate haiku.');

                displayOnCanvas({ text: haikuText, color: '#06D6A0', yOffset: -50 });
                playTextAsAudio(haikuText);

            } catch (e) {
                showMessage(`Couldn't compose a haiku. Perhaps the muse is busy, or there's a network issue. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });

        generateCaptionBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            imageInput.click();
        });

        imageInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            showLoading();
            saveBtn.classList.add('hidden');
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64Data = e.target.result.split(',')[1];
                    
                    try {
                        const prompt = `Look at this image and generate a single, short, humorous, and suggestive caption that is a play on words related to fish, fishing, or sea life. The caption should be brief.`;
                        const payload = {
                            contents: [{ 
                                parts: [
                                    { text: prompt },
                                    {
                                        inlineData: {
                                            mimeType: file.type,
                                            data: base64Data
                                        }
                                    }
                                ]
                            }]
                        };
                        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                        const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                        const captionText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (!captionText) throw new Error('Failed to generate caption.');
                        
                        const img = new Image();
                        img.onload = () => {
                            const imgWidth = canvas.width * 0.8;
                            const imgHeight = (img.height / img.width) * imgWidth;
                            ctx.drawImage(img, (canvas.width - imgWidth) / 2, 20, imgWidth, imgHeight);
                            
                            const yOffset = 20 + imgHeight + 40;
                            ctx.font = '24px Inter';
                            ctx.fillStyle = '#FFD166';
                            ctx.textAlign = 'center';
                            const lines = captionText.match(/.{1,40}(\s|$)/g).map(line => line.trim());
                            lines.forEach((line, index) => {
                                ctx.fillText(line, canvas.width / 2, yOffset + (index * 30));
                            });
                             playTextAsAudio(captionText);
                        };
                        img.src = e.target.result;

                    } catch (e) {
                        showMessage(`Failed to generate a caption for your image. Did you upload something I can work with, or is the network playing games? Details: ${e.message}`, 'error');
                        console.error(e);
                    } finally {
                        hideLoading();
                    }
                };
                reader.readAsDataURL(file);
            } catch (e) {
                showMessage(`Couldn't read your image file. Please ensure it's a valid image and try again. Details: ${e.message}`, 'error');
                console.error(e);
                hideLoading();
            }
        });

        generateDuetBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');

            const jokeDuet = "TTS the following conversation between Joe and Jane:\nJoe: How's your catch coming along, Jane?\nJane: Not bad, Joe. I've got a great catch on my line. It's a real handful.\nJoe: Sounds like you've hooked a good one. What do you plan to do with it?\nJane: I'm just going to reel it in slowly and enjoy the struggle. What about you?\nJoe: I'm just looking for something to pull on my rod.";

            try {
                const payload = {
                    contents: [{ parts: [{ text: jokeDuet }] }],
                    generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            multiSpeakerVoiceConfig: {
                                speakerVoiceConfigs: [
                                    { speaker: "Joe", voiceConfig: { prebuiltVoiceConfig: { voiceName: "Rasalgethi" } } },
                                    { speaker: "Jane", voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
                                ]
                            }
                        }
                    },
                    model: "gemini-2.5-flash-preview-tts"
                };

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const audioData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mimeType = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;

                if (!audioData || !mimeType) throw new Error('Failed to generate audio.');
                
                const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
                const pcmData = base64ToArrayBuffer(audioData);
                const pcm16 = new Int16Array(pcmData);
                const wavBlob = pcmToWav(pcm16, sampleRate);
                const audioUrl = URL.createObjectURL(wavBlob);

                const audio = new Audio(audioUrl);
                audio.play();

                displayOnCanvas({ text: jokeDuet, color: '#FF6B6B', bgColor: '#073B4C' });

            } catch (e) {
                showMessage(`Couldn't get the duet going. Perhaps the singers are shy, or there's a network issue. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });

        generateSongBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            
            songAudio = new Audio("https://cdn.pixabay.com/download/audio/2022/04/22/audio_03d9715112.mp3");
            songAudio.loop = true;
            songAudio.play();

            const topic = songTopicInput.value || "reeling in a big one";
            const prompt = `Write a short, sexually suggestive song with at least one chorus and one verse about the topic "${topic}". The lyrics should use fish and fishing puns.`;

            try {
                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    model: "gemini-2.5-flash-preview-05-20"
                };

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const songLyrics = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!songLyrics) throw new Error('Failed to generate song.');

                displayOnCanvas({ text: songLyrics, color: '#06D6A0', yOffset: -50 });
                playTextAsAudio(`Sing the following lyrics: ${songLyrics}`, { prebuiltVoiceConfig: { voiceName: "Puck" } });

            } catch (e) {
                showMessage(`Couldn't compose a song. My vocal cords might be tied in knots, or there's a network issue. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });
        
        generatePickupBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            try {
                const name = pickupNameInput.value || "there";
                const prompt = `Write a single, very humorous, and sexually suggestive fish-themed pickup line for someone named "${name}". The line should be a play on words related to fish, fishing, or sea life.`;

                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    model: "gemini-2.5-flash-preview-05-20"
                };

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const pickupLine = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!pickupLine) throw new Error('Failed to generate pickup line.');

                displayOnCanvas({ text: pickupLine, color: '#FFD166', yOffset: -50 });
                playTextAsAudio(pickupLine);

            } catch (e) {
                showMessage(`My pickup line fell flat. Perhaps the AI is having an off day, or there's a network issue. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });

        generateSongTitleBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            try {
                const prompt = `Generate a single, very short, humorous, and sexually suggestive song title with a fish or fishing pun.`;

                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    model: "gemini-2.5-flash-preview-05-20"
                };

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const songTitle = response?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!songTitle) throw new Error('Failed to generate song title.');

                displayOnCanvas({ text: songTitle, color: '#118AB2', yOffset: -50 });
                playTextAsAudio(songTitle);

            } catch (e) {
                showMessage(`Couldn't come up with a catchy song title. My creative juices might be running dry, or there's a network issue. Details: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });

        saveBtn.addEventListener('click', async () => {
            stopAllAudio();
            if (!currentJoke || !uid) {
                showMessage('Please sign in and generate a joke before saving.', 'error');
                return;
            }
            showLoading();
            try {
                const publicJokesCollectionRef = collection(db, `artifacts/${appId}/public/data/reel_deep_catches`);
                
                await addDoc(publicJokesCollectionRef, {
                    ...currentJoke,
                    userId: uid,
                    displayName: userDisplayName,
                    createdAt: serverTimestamp()
                });
                showMessage(`Saved to your public collection!`, 'success');
                saveBtn.classList.add('hidden');
            } catch (e) {
                showMessage(`Error saving: ${e.message}`, 'error');
            } finally {
                hideLoading();
            }
        });

        const renderJokes = (jokes) => {
            jokeCollectionDiv.innerHTML = '';
            if (jokes.length === 0) {
                jokeCollectionDiv.innerHTML = `<p class="text-center text-gray-500">This collection is currently empty. Start making some "catches"!</p>`;
                return;
            }
            jokes.forEach(jokeDoc => {
                const data = jokeDoc.data();
                const jokeElement = document.createElement('div');
                jokeElement.className = 'bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-between';
                
                let imageHtml = '';
                if (data.image) {
                    imageHtml = `<img src="${data.image}" class="w-full h-auto rounded-lg mb-4 object-cover" />`;
                }
                const deleteButtonHtml = (data.userId === uid) ? 
                    `<button class="delete-btn mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors" data-id="${jokeDoc.id}">
                        Delete
                    </button>` : '';

                jokeElement.innerHTML = `
                    ${imageHtml}
                    <p class="text-xl text-[#FFD166] font-semibold">"${data.joke}"</p>
                    <p class="text-sm text-gray-400 mt-2">from a ${data.fish}</p>
                    <p class="text-xs text-gray-500">By: ${data.displayName || 'Anonymous'}</p>
                    ${deleteButtonHtml}
                `;
                jokeCollectionDiv.appendChild(jokeElement);
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const docId = e.target.dataset.id;
                    const publicJokesCollectionRef = collection(db, `artifacts/${appId}/public/data/reel_deep_catches`);
                    try {
                        await deleteDoc(doc(publicJokesCollectionRef, docId));
                    } catch (e) {
                        showMessage(`Error deleting joke: ${e.message}`, 'error');
                    }
                });
            });
        };

        const setupUserSelectors = () => {
            const users = ["Fish", "Kiwi", "Josh", 'Lady Awesomest', `Ba"nana"`, "Hamma", "Baxturd", "Wood"];
            [userSelector, userSelectorSplash].forEach(selector => {
                selector.innerHTML = '';
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.replace(/[^a-zA-Z0-9]/g, '');
                    option.textContent = user;
                    selector.appendChild(option);
                });
            });
        };
        
        const updateCollectionListener = (selectedUser) => {
            if (!uid) {
                jokeCollectionDiv.innerHTML = `<p class="text-center text-gray-500">Sign in to view your collection.</p>`;
                return;
            }
            const publicJokesCollectionRef = collection(db, `artifacts/${appId}/public/data/reel_deep_catches`);
            const q = query(publicJokesCollectionRef, where('displayName', '==', selectedUser));
            onSnapshot(q, (querySnapshot) => {
                const jokes = [];
                querySnapshot.forEach(doc => jokes.push(doc));
                renderJokes(jokes);
            });
        };

        const playIntro = async () => {
            try {
                const introText = `
                    <speak>
                        <voice name="Orus">
                            <prosody rate="medium">Welcome to Reel Deep</prosody>
                        </voice>
                        <break time="500ms"/>
                        <voice name="Puck">
                            <prosody rate="medium">The Uncensored Fishing Experience</prosody>
                        </voice>
                        <break time="500ms"/>
                        <voice name="Fenrir">
                            <prosody rate="medium">Go ahead, swim around a little, don't be shy.</prosody>
                        </voice>
                    </speak>`;
                const payload = {
                    contents: [{ parts: [{ text: introText }] }],
                    generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: "Orus"
                                }
                            }
                        }
                    },
                    model: "gemini-2.5-flash-preview-tts"
                };

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
                const response = await fetchWithRetry(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

                const audioData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                const mimeType = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;

                if (!audioData || !mimeType) throw new Error('Failed to generate audio.');
                
                const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
                const pcmData = base64ToArrayBuffer(audioData);
                const pcm16 = new Int16Array(pcmData);
                const wavBlob = pcmToWav(pcm16, sampleRate);
                const audioUrl = URL.createObjectURL(wavBlob);

                const audio = new Audio(audioUrl);
                audio.play();

            } catch (e) {
                console.error('Initial audio failed:', e);
                showMessage(`Audio generation failed. Please try again.`, 'error');
            }
        };

        const setupAuthAndFirestore = async () => {
            const app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    uid = user.uid;
                    document.getElementById('userIdDisplay').textContent = `UID: ${uid}`;
                } else {
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(auth, initialAuthToken);
                        } else {
                            await signInAnonymously(auth);
                        }
                    } catch (e) {
                        showMessage(`Authentication failed: ${e.message}`, 'error');
                    }
                }
            });
        };
        
        goFishinBtn.addEventListener('click', async () => {
            stopAllAudio();
            showLoading();
            saveBtn.classList.add('hidden');
            const user = userDisplayName || 'an angler';
            const caughtFish = ['Moby Dick', 'Master Bait', 'Slippery Dick', 'Tuna Sub', 'Reel Naughty', 'Codpiece', 'Big Bass', 'The Flounderer', 'Stingray-daddy'];
            const castingSound = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_92425164d1.mp3');
            const bloopSound = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_347c6a9924.mp3');
            const reelSound = new Audio('https://cdn.pixabay.com/audio/2022/03/17/audio_e409ec62c4.mp3');

            try {
                const castMessage = `${user} casts his rod into the fishy waters...`;
                displayOnCanvas({ text: castMessage, color: '#FFFFFF' });
                await playTextAsAudio(castMessage);
                
                await new Promise(resolve => setTimeout(resolve, 50));
                castingSound.play();
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const bloopMessage = `*bloop*`;
                displayOnCanvas({ text: bloopMessage, color: '#FFD166' });
                await bloopSound.play();
                
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                if (Math.random() > 0.5) {
                    const catchMessage = `...and got a bite!`;
                    displayOnCanvas({ text: catchMessage, color: '#06D6A0' });
                    await playTextAsAudio(catchMessage, { prebuiltVoiceConfig: { voiceName: "Puck" } });
                    await new Promise(resolve => setTimeout(resolve, 50));
                    reelSound.play();
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const fishCaught = caughtFish[Math.floor(Math.random() * caughtFish.length)];
                    const catchFinalMessage = `Congratulations, ${user}! You caught a ${fishCaught}!`;
                    displayOnCanvas({ text: catchFinalMessage, color: '#06D6A0' });
                    playTextAsAudio(catchFinalMessage, { prebuiltVoiceConfig: { voiceName: "Puck" } });
                } else {
                    const lossMessage = `...but it looks like you lost your worm.`;
                    displayOnCanvas({ text: lossMessage, color: '#FF6B6B' });
                    await playTextAsAudio(lossMessage);
                }
            } catch (e) {
                showMessage(`Go Fishin' failed: ${e.message}`, 'error');
                console.error(e);
            } finally {
                hideLoading();
            }
        });
        
        window.onload = () => {
            const resizeCanvas = () => {
                canvas.width = canvasContainer.clientWidth;
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            setupAuthAndFirestore();
            setupUserSelectors();
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                splashScreen.classList.remove('hidden');
            }, 2000); // Simulate a 2-second loading time

            startButton.addEventListener('click', () => {
                splashScreen.classList.add('hidden');
                mainApp.classList.remove('hidden');
                userDisplayName = userSelectorSplash.options[userSelectorSplash.selectedIndex].textContent;
                userSelector.value = userSelectorSplash.value;
                userSelector.addEventListener('change', (e) => {
                    userDisplayName = userSelector.options[userSelector.selectedIndex].textContent;
                    updateCollectionListener(userDisplayName);
                });
                updateCollectionListener(userDisplayName);
                playIntro();
            });
        };
