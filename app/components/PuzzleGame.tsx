'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TileValue = number | null;

const PuzzleGame = () => {
  const [tiles, setTiles] = useState<TileValue[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);
  const [timeUp, setTimeUp] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [visualFeedback, setVisualFeedback] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sound effects
  const playSound = (type: 'move' | 'success' | 'error') => {
    if (!soundEnabled || !audioRef.current) return;
    
    const sounds = {
      move: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3',
      success: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
      error: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'
    };
    
    audioRef.current.src = sounds[type];
    audioRef.current.play().catch(e => console.log("Audio play prevented:", e));
  };

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isSolved && !timeUp) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev >= (difficulty === 'easy' ? 900 : difficulty === 'medium' ? 600 : 300)) {
            setTimeUp(true);
            setIsRunning(false);
            playSound('error');
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, isSolved, timeUp, difficulty]);

  useEffect(() => {
    checkIfSolved();
  }, [tiles]);

  const initGame = (): void => {
    const size = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const totalTiles = size * size - 1;
    const numbers = Array.from({ length: totalTiles }, (_, i) => i + 1);
    const shuffled = [...numbers];

    // Easier shuffling for lower difficulty levels
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1 + level));
      [shuffled[i], shuffled[j % shuffled.length]] = [
        shuffled[j % shuffled.length],
        shuffled[i],
      ];
    }

    const inversions = countInversions(shuffled);
    if (inversions % 2 !== 0) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }

    setTiles([...shuffled, null]);
    setMoves(0);
    setIsSolved(false);
    setTimer(0);
    setTimeUp(false);
    setIsRunning(true);
    setShowCelebration(false);
  };

  const countInversions = (arr: number[]): number => {
    let inversions = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inversions++;
      }
    }
    return inversions;
  };

  const handleTileClick = (index: number) => {
    if (isSolved || tiles[index] === null || timeUp) return;

    const emptyIndex = tiles.indexOf(null);
    const size = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    if (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    ) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves((prev) => prev + 1);
      playSound('move');
      
      if (visualFeedback) {
        const tileElement = document.getElementById(`tile-${index}`);
        if (tileElement) {
          tileElement.classList.add('animate-pulse');
          setTimeout(() => tileElement.classList.remove('animate-pulse'), 300);
        }
      }
    } else {
      playSound('error');
    }
  };

  const checkIfSolved = () => {
    const size = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const totalTiles = size * size - 1;
    const correct = Array.from({ length: totalTiles }, (_, i) => i + 1);
    const current = tiles.slice(0, totalTiles);
    
    if (JSON.stringify(current) === JSON.stringify(correct)) {
      setIsSolved(true);
      setIsRunning(false);
      playSound('success');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const handleNextLevel = () => {
    setLevel((prev) => prev + 1);
    initGame();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getGridSize = () => {
    return difficulty === 'easy' ? 'grid-cols-3' : 
           difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-5';
  };

  const getTileSize = () => {
    return difficulty === 'easy' ? 'w-20 h-20 sm:w-24 sm:h-24 text-2xl' : 
           difficulty === 'medium' ? 'w-16 h-16 sm:w-20 sm:h-20 text-xl' : 'w-12 h-12 sm:w-16 sm:h-16 text-lg';
  };

  const getTargetPosition = (value: number): number => {
    const size = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const row = Math.floor((value - 1) / size);
    const col = (value - 1) % size;
    return row * size + col;
  };

  // Confetti colors
  const confettiColors = ['#FF5252', '#FFD740', '#64FFDA', '#448AFF', '#B388FF'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-800 p-6 relative overflow-hidden">
      {/* Hidden audio element for sound effects */}
      <audio ref={audioRef} />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 10 + 5,
              height: Math.random() * 10 + 5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              x: [0, Math.random() * 100 - 50],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>
      
      {/* Celebration confetti */}
      <AnimatePresence>
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                  width: Math.random() * 10 + 5,
                  height: Math.random() * 10 + 5,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ y: -50, x: Math.random() * 100 - 50, opacity: 1 }}
                animate={{
                  y: [0, window.innerHeight],
                  x: [0, Math.random() * 200 - 100],
                  rotate: Math.random() * 360,
                  opacity: [1, 0],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400">
        🧩 NumLock Puzzle
        </h1>
        <p className="text-lg text-purple-200">Slide the tiles to solve the puzzle!</p>
      </motion.div>

      {/* Header with action buttons */}
      <div className="relative z-10 flex gap-4 mb-6">
        <motion.button
          className="px-4 py-2 rounded-xl font-semibold bg-white/20 text-white shadow-lg flex items-center gap-2"
          onClick={() => setShowSettings(!showSettings)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showSettings ? '✖ Close' : '⚙️ Settings'}
        </motion.button>
        <motion.button
          className="px-4 py-2 rounded-xl font-semibold bg-white/20 text-white shadow-lg flex items-center gap-2"
          onClick={() => setShowInfo(!showInfo)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showInfo ? '✖ Close' : 'ℹ️ Info'}
        </motion.button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-white text-xl font-bold mb-4 text-center">Game Settings</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-purple-200 mb-2">Difficulty</h3>
                <div className="flex flex-col gap-2">
                  <motion.button
                    className={`px-3 py-2 rounded-lg font-medium ${difficulty === 'easy' ? 'bg-green-500 text-white' : 'bg-white/10 text-purple-200'}`}
                    onClick={() => { setDifficulty('easy'); initGame(); }}
                    whileHover={{ scale: 1.02 }}
                  >
                    Easy (3×3)
                  </motion.button>
                  <motion.button
                    className={`px-3 py-2 rounded-lg font-medium ${difficulty === 'medium' ? 'bg-yellow-500 text-white' : 'bg-white/10 text-purple-200'}`}
                    onClick={() => { setDifficulty('medium'); initGame(); }}
                    whileHover={{ scale: 1.02 }}
                  >
                    Medium (4×4)
                  </motion.button>
                  <motion.button
                    className={`px-3 py-2 rounded-lg font-medium ${difficulty === 'hard' ? 'bg-red-500 text-white' : 'bg-white/10 text-purple-200'}`}
                    onClick={() => { setDifficulty('hard'); initGame(); }}
                    whileHover={{ scale: 1.02 }}
                  >
                    Hard (5×5)
                  </motion.button>
                </div>
              </div>
              
              <div>
                <h3 className="text-purple-200 mb-2">Preferences</h3>
                <div className="flex flex-col gap-2">
                  <motion.button
                    className={`px-3 py-2 rounded-lg font-medium flex items-center justify-center ${soundEnabled ? 'bg-blue-500 text-white' : 'bg-white/10 text-purple-200'}`}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
                  </motion.button>
                  <motion.button
                    className={`px-3 py-2 rounded-lg font-medium flex items-center justify-center ${visualFeedback ? 'bg-blue-500 text-white' : 'bg-white/10 text-purple-200'}`}
                    onClick={() => setVisualFeedback(!visualFeedback)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {visualFeedback ? '✨ Effects On' : '✨ Effects Off'}
                  </motion.button>
                  <motion.button
                    className={`px-3 py-2 rounded-lg font-medium flex items-center justify-center ${showHints ? 'bg-blue-500 text-white' : 'bg-white/10 text-purple-200'}`}
                    onClick={() => setShowHints(!showHints)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {showHints ? '💡 Hints On' : '💡 Hints Off'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-white text-xl font-bold mb-3 text-center">How to Play</h2>
            <ul className="text-purple-100 space-y-2">
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">•</span>
                <span>Click on a tile next to the empty space to move it</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">•</span>
                <span>Arrange the tiles in numerical order from left to right, top to bottom</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">•</span>
                <span>Green tiles are in their correct position</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">•</span>
                <span>The numbers show (row,column) positions</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">•</span>
                <span>Complete the puzzle before time runs out!</span>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-white font-bold text-xl">🧮</span>
              <span className="ml-2 text-white">{moves}</span>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-white font-bold text-xl">⏱</span>
              <span className="ml-2 text-white">{formatTime(timer)}</span>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <span className="text-white font-bold text-xl">🚀</span>
              <span className="ml-2 text-white">{level}</span>
            </div>
          </div>
        </div>

        <div className={`grid ${getGridSize()} gap-3 mb-6`}>
          {tiles.map((tile, index) => (
            <motion.div
              key={index}
              id={`tile-${index}`}
              className={`${getTileSize()} flex items-center justify-center font-bold rounded-xl cursor-pointer relative
                transition-all duration-200 shadow-md
                ${
                  tile
                    ? timeUp 
                      ? 'bg-red-500/90 text-white'
                      : showHints && getTargetPosition(tile) === index
                        ? 'bg-emerald-400 text-white shadow-emerald-400/50'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 shadow-indigo-500/50'
                    : 'bg-white/20'
                }`}
              onClick={() => handleTileClick(index)}
              whileHover={{ scale: tile ? 1.05 : 1 }}
              whileTap={{ scale: tile ? 0.95 : 1 }}
            >
              {tile}
              {showHints && tile && (
                <div className="absolute bottom-1 right-1 text-xs opacity-70 font-normal">
                  {Math.floor(index / (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5)) + 1},
                  {(index % (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5)) + 1}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <motion.button
            className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg"
            onClick={initGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔁 Restart
          </motion.button>

          {isSolved && !timeUp && (
            <motion.button
              className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg"
              onClick={handleNextLevel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎉 Next Level
            </motion.button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {isSolved && !timeUp && (
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-xl shadow-2xl z-50 text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-2">Level Complete! 🎉</h2>
            <p className="text-lg">You solved it in {moves} moves!</p>
          </motion.div>
        )}

        {timeUp && !isSolved && (
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-400 to-pink-500 text-white px-8 py-4 rounded-xl shadow-2xl z-50 text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-2">Time is Up! ⏰</h2>
            <p className="text-lg">You can try again!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PuzzleGame;