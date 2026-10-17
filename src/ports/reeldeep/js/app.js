// Main application code for ReelDeep

// Import modules


import {
  generateJoke,
  generateImage,
  generateContent
} from './api-service.js';

import {
  playTextAsAudio,
  stopAudio
} from './audio-service.js';

import {
  initCanvas,
  displayOnCanvas,
  displayJokeOnCanvas,
  clearCanvas
} from './canvas-renderer.js';

import {
  showLoading,
  hideLoading,
  showMessage,
  initUserSelector,
  initSplashScreen,
  renderJokeCollection
} from './ui-handlers.js';

import {
  handleApiError,
  logError
} from './error-handler.js';

// DOM Elements
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
const canvasContainer = document.getElementById('canvasContainer');
const goFishinBtn = document.getElementById('goFishinBtn');
const playAudioBtn = document.getElementById('playAudioBtn');

const loadingScreen = document.getElementById('loadingScreen');
const splashScreen = document.getElementById('splashScreen');
const startButton = document.getElementById('startButton');
const userSelectorSplash = document.getElementById('userSelectorSplash');
const userSelector = document.getElementById('userSelector');
const mainApp = document.getElementById('mainApp');


// Application state
let currentJoke = null;
let songAudio = null;
const users = ["Fish", "Kiwi", "Josh", 'Lady Awesomest', `Ba"nana"`, "Hamma", "Baxturd", "Wood"];

// Initialize canvas
const { ctx, resizeCanvas } = initCanvas(canvas, canvasContainer);

// Initialize application
const initApp = async () => {
  try {
    // Initialize splash screen
    const userDisplayName = await initSplashScreen(
      loadingScreen,
      splashScreen,
      mainApp,
      userSelector,
      userSelectorSplash,
      startButton,
      users
    );
    
    // Add event listeners
    addEventListeners();
    
  } catch (error) {
    logError(error, 'App Initialization');
    handleApiError(error, (msg, type) => showMessage(jokeDisplay, msg, type));
  }
};

// Generate joke
const handleGenerateJoke = async () => {
  stopAudio(songAudio);
  showLoading(spinner);
  currentJoke = null;
  saveBtn.classList.add('hidden');
  
  try {
    const jokeData = await generateJoke();
    currentJoke = jokeData;
    
    displayJokeOnCanvas(ctx, canvas, canvasContainer, {
      joke: jokeData.joke,
      fish: jokeData.fish,
      image: null,
      authorName: userDisplayName
    });
    
    playTextAsAudio(jokeData.joke);
    playAudioBtn.classList.remove('hidden');
    
  } catch (error) {
    logError(error, 'Joke Generation');
    handleApiError(error, (msg, type) => showMessage(jokeDisplay, msg, type));
  } finally {
    hideLoading(spinner);
  }
};

// Add event listeners
const addEventListeners = () => {
  // Generate joke
  jokeGeneratorBtn.addEventListener('click', handleGenerateJoke);
  
  // TODO: Add other event listeners
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);