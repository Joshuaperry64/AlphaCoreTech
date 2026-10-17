// UI Handlers for ReelDeep

/**
 * Show loading spinner
 * @param {HTMLElement} spinner - The spinner element
 */
const showLoading = (spinner) => {
  spinner.classList.remove('hidden');
  document.querySelectorAll('button').forEach(btn => btn.disabled = true);
};

/**
 * Hide loading spinner
 * @param {HTMLElement} spinner - The spinner element
 */
const hideLoading = (spinner) => {
  spinner.classList.add('hidden');
  document.querySelectorAll('button').forEach(btn => btn.disabled = false);
};

/**
 * Show message
 * @param {HTMLElement} container - The container element
 * @param {string} message - The message to display
 * @param {string} type - The message type (info, error, success)
 */
// UI Handlers for ReelDeep

/**
 * Show loading spinner
 * @param {HTMLElement} spinner - The spinner element
 */
const showLoading = (spinner) => {
  spinner.classList.remove('hidden');
  document.querySelectorAll('button').forEach(btn => btn.disabled = true);
};

/**
 * Hide loading spinner
 * @param {HTMLElement} spinner - The spinner element
 */
const hideLoading = (spinner) => {
  spinner.classList.add('hidden');
  document.querySelectorAll('button').forEach(btn => btn.disabled = false);
};

/**
 * Show message
 * @param {HTMLElement} container - The container element
 * @param {string} message - The message to display
 * @param {string} type - The message type (info, error, success)
 */
const showMessage = (container, message, type = 'info') => {
  const bgColor = type === 'error' ? 'bg-red-500' : 
                  type === 'success' ? 'bg-green-500' : 
                  'bg-gray-700';
  
  container.innerHTML = `<div class="p-4 rounded-lg mt-4 text-center ${bgColor} text-white">${message}</div>`;
};

/**
 * Initialize user selector
 * @param {HTMLSelectElement} selector - The selector element
 * @param {Array<string>} users - List of users
 * @param {Function} onChange - Change handler
 */
const initUserSelector = (selector, users, onChange) => {
  // Clear existing options
  selector.innerHTML = '';
  
  // Add users to selector
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user;
    option.textContent = user;
    selector.appendChild(option);
  });
  
  // Set default selection from localStorage if available
  const savedUser = localStorage.getItem('selectedUser');
  if (savedUser && users.includes(savedUser)) {
    selector.value = savedUser;
  }
  
  // Add change listener
  selector.addEventListener('change', () => {
    const selectedUser = selector.value;
    localStorage.setItem('selectedUser', selectedUser);
    if (onChange) onChange(selectedUser);
  });
  
  // Return initial value
  return selector.value;
};

/**
 * Initialize splash screen
 * @param {HTMLElement} loadingScreen - Loading screen element
 * @param {HTMLElement} splashScreen - Splash screen element
 * @param {HTMLElement} mainApp - Main app element
 * @param {HTMLSelectElement} userSelector - User selector element
 * @param {HTMLSelectElement} userSelectorSplash - Splash user selector element
 * @param {HTMLElement} startButton - Start button element
 * @param {Array<string>} users - List of users
 * @returns {Promise<string>} - Selected user
 */
const initSplashScreen = (loadingScreen, splashScreen, mainApp, userSelector, userSelectorSplash, startButton, users) => {
  return new Promise((resolve) => {
    // Initialize user selectors
    const syncSelectors = (value) => {
      userSelector.value = value;
      userSelectorSplash.value = value;
      localStorage.setItem('selectedUser', value);
    };
    
    initUserSelector(userSelectorSplash, users, syncSelectors);
    const selectedUser = initUserSelector(userSelector, users, syncSelectors);
    syncSelectors(selectedUser);
    
    // Show splash screen after loading
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      splashScreen.classList.remove('hidden');
    }, 1500);
    
    // Start button handler
    startButton.addEventListener('click', () => {
      splashScreen.classList.add('hidden');
      mainApp.classList.remove('hidden');
      resolve(userSelectorSplash.value);
    });
  });
};

// Export UI functions
export {
  showLoading,
  hideLoading,
  showMessage,
  initUserSelector,
  initSplashScreen
};

/**
 * Initialize user selector
 * @param {HTMLSelectElement} selector - The selector element
 * @param {Array<string>} users - List of users
 * @param {Function} onChange - Change handler
 */
const initUserSelector = (selector, users, onChange) => {
  // Clear existing options
  selector.innerHTML = '';
  
  // Add users to selector
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user;
    option.textContent = user;
    selector.appendChild(option);
  });
  
  // Set default selection from localStorage if available
  const savedUser = localStorage.getItem('selectedUser');
  if (savedUser && users.includes(savedUser)) {
    selector.value = savedUser;
  }
  
  // Add change listener
  selector.addEventListener('change', () => {
    const selectedUser = selector.value;
    localStorage.setItem('selectedUser', selectedUser);
    if (onChange) onChange(selectedUser);
  });
  
  // Return initial value
  return selector.value;
};

/**
 * Initialize splash screen
 * @param {HTMLElement} loadingScreen - Loading screen element
 * @param {HTMLElement} splashScreen - Splash screen element
 * @param {HTMLElement} mainApp - Main app element
 * @param {HTMLSelectElement} userSelector - User selector element
 * @param {HTMLSelectElement} userSelectorSplash - Splash user selector element
 * @param {HTMLElement} startButton - Start button element
 * @param {Array<string>} users - List of users
 * @returns {Promise<string>} - Selected user
 */
const initSplashScreen = (loadingScreen, splashScreen, mainApp, startButton, users) => {
  return new Promise((resolve) => {
    // Initialize user selectors
    const syncSelectors = (value) => {
      localStorage.setItem('selectedUser', value);
    };
    
    initUserSelector(userSelectorSplash, users, syncSelectors);
    const selectedUser = initUserSelector(userSelector, users, syncSelectors);
    syncSelectors(selectedUser);
    
    // Show splash screen after loading
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      splashScreen.classList.remove('hidden');
    }, 1500);
    
    // Start button handler
    startButton.addEventListener('click', () => {
      splashScreen.classList.add('hidden');
      mainApp.classList.remove('hidden');
      resolve(userSelectorSplash.value);
    });
  });
};

// Export UI functions
export {
  showLoading,
  hideLoading,
  showMessage,
  initUserSelector,
  initSplashScreen
};