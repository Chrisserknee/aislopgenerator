'use client'

import MemeGenerator from '@/components/MemeGenerator'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 3s ease infinite'
    }}>
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px) rotate(-2deg); }
          75% { transform: translateX(10px) rotate(2deg); }
        }
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0; }
        }
      `}</style>
      
      {/* Floating weird elements */}
      <div className="fixed top-10 left-10 text-6xl animate-spin" style={{ animationDuration: '5s' }}>🔥</div>
      <div className="fixed top-20 right-20 text-5xl animate-pulse">💀</div>
      <div className="fixed bottom-20 left-20 text-4xl" style={{ animation: 'blink 1s infinite' }}>⚠️</div>
      <div className="fixed bottom-10 right-10 text-7xl animate-bounce">🤡</div>
      
      <div className="container mx-auto p-4 relative z-10">
        <h1 className="text-8xl font-bold text-center mb-2 drop-shadow-2xl" style={{
          fontFamily: 'Comic Sans MS, cursive',
          color: '#000000',
          textShadow: '5px 5px 0px #ff00ff, -5px -5px 0px #00ffff, 5px -5px 0px #ffff00',
          animation: 'shake 0.5s infinite',
          transform: 'rotate(-2deg)'
        }}>
          🤖 AI SLOP GENERATOR 🤖
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-3xl font-bold inline-block px-4 py-2 bg-yellow-300 border-4 border-black transform rotate-1" style={{
            fontFamily: 'Impact, sans-serif',
            textShadow: '3px 3px 0px #ff0000',
            animation: 'shake 2s infinite'
          }}>
            CREATE THE WORST MEMES POSSIBLE
          </p>
        </div>

        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-red-500 text-white font-bold text-xl rotate-3">⚠️ WARNING: EXTREMELY LOW QUALITY ⚠️</span>
        </div>

        <MemeGenerator />
      </div>
    </main>
  )
}
