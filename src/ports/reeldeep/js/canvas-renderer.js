// Canvas Renderer for ReelDeep

/**
 * Initialize the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {HTMLElement} container - The container element
 * @returns {Object} - Canvas context and utility functions
 */
const initCanvas = (canvas, container) => {
  const ctx = canvas.getContext('2d');
  
  // Resize canvas to fit container
  const resizeCanvas = () => {
    canvas.width = container.clientWidth;
    canvas.height = 0; // Will be dynamically increased as content is added
  };
  
  // Call resize on init
  resizeCanvas();
  
  // Add window resize listener
  window.addEventListener('resize', resizeCanvas);
  
  return {
    ctx,
    resizeCanvas
  };
};

/**
 * Display text on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Display options
 */
const displayOnCanvas = (ctx, canvas, container, { text, color, bgColor = '#118AB2' }) => {
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
  
  container.scrollTop = container.scrollHeight;
};

/**
 * Display joke on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Joke options
 */
const displayJokeOnCanvas = (ctx, canvas, container, { joke, fish, image, authorName }) => {
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
      container.scrollTop = container.scrollHeight;
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
    container.scrollTop = container.scrollHeight;
  }
};

/**
 * Clear canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
const clearCanvas = (ctx, canvas) => {
  canvas.height = 0;
};

// Export canvas functions
export {
  initCanvas,
  displayOnCanvas,
  displayJokeOnCanvas,
  clearCanvas
};