const fs = require('fs');

let code = fs.readFileSync('src/pages/transfer.js', 'utf8');

const audioInsert = `  // ─── Gamified Audio Methods ───────────────────────────────────────────────
  const playMachineStart = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='); // Dummy fast beep
      audio.volume = 0.5;
      audio.play().catch(e => console.warn(e));
    } catch(e) {}
  };
  
  const playTimeTravel = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='); // Dummy swoosh
      audio.volume = 0.5;
      audio.play().catch(e => console.warn(e));
    } catch(e) {}
  };
  
  const playCoinDrop = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='); // Dummy coin
      audio.volume = 0.5;
      audio.play().catch(e => console.warn(e));
    } catch(e) {}
  };

  laundromatAudio.playMachineStart = playMachineStart;
  laundromatAudio.playTimeTravel = playTimeTravel;
  laundromatAudio.playCoinDrop = playCoinDrop;
`;

// Insert it right after laundromatAudio is instantiated
code = code.replace(
  "const laundromatAudio = new LaundromatAudioEngine();",
  "const laundromatAudio = new LaundromatAudioEngine();\n" + audioInsert
);

fs.writeFileSync('src/pages/transfer.js', code);
console.log('Audio methods patched.');
