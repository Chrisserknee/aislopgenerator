'use client'

import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'

const VIRAL_TEMPLATES = [
  { prompt: 'weird distorted face meme', top: 'ME WHEN', bottom: 'REALITY HITS' },
  { prompt: 'ugly crying cat meme', top: 'MY VIBES', bottom: 'ALL THE TIME' },
  { prompt: 'deformed wojak sad', top: 'EXPECTATION', bottom: 'WHAT I GOT' },
  { prompt: 'glitchy broken image', top: 'WHEN LIFE', bottom: 'DOESNT WORK' },
  { prompt: 'weird creature blob', top: 'ME AS A', bottom: 'PERSON' },
  { prompt: 'distorted nightmare fuel', top: 'THIS IS FINE', bottom: 'NOT REALLY' },
]

const generateAutoText = (prompt: string) => {
  const lower = prompt.toLowerCase()
  
  // Weird/distorted prompts
  if (lower.includes('weird') || lower.includes('distorted') || lower.includes('ugly')) {
    return { top: 'ME WHEN', bottom: 'I SEE MYSELF' }
  }
  if (lower.includes('crying') || lower.includes('sad') || lower.includes('wojak')) {
    return { top: 'MY VIBES', bottom: 'ALL THE TIME' }
  }
  if (lower.includes('nightmare') || lower.includes('fuel')) {
    return { top: 'THIS IS FINE', bottom: 'NOT REALLY' }
  }
  if (lower.includes('glitch') || lower.includes('broken')) {
    return { top: 'WHEN LIFE', bottom: 'DOESNT WORK' }
  }
  if (lower.includes('blob') || lower.includes('creature')) {
    return { top: 'ME AS A', bottom: 'PERSON' }
  }
  if (lower.includes('cat') || lower.includes('pet')) {
    return { top: 'ME WHEN I SEE', bottom: 'MY PET' }
  }
  if (lower.includes('game') || lower.includes('gamer')) {
    return { top: 'ME: JUST ONE GAME', bottom: '5 HOURS LATER...' }
  }
  if (lower.includes('drake') || lower.includes('pointing')) {
    return { top: 'NOT THAT', bottom: 'THIS ONE' }
  }
  
  // Random viral slop patterns
  const slopPatterns = [
    { top: 'EXPECTATION', bottom: 'REALITY' },
    { top: 'ME TRYING TO', bottom: 'BE NORMAL' },
    { top: 'THE PLAN', bottom: 'WHAT HAPPENED' },
    { top: 'SMALL BRAIN', bottom: 'BIG BRAIN' },
    { top: 'BEFORE COFFEE', bottom: 'AFTER COFFEE' },
    { top: '2020 ME', bottom: '2024 ME' },
    { top: 'WHAT I ORDERED', bottom: 'WHAT I GOT' },
    { top: 'MY CONFIDENCE', bottom: 'MY ACTUAL SKILLS' },
    { top: 'NORMAL PEOPLE', bottom: 'ME' },
    { top: 'WHEN SOMEONE', bottom: 'ACTUALLY UNDERSTANDS' },
  ]
  
  return slopPatterns[Math.floor(Math.random() * slopPatterns.length)]
}

export default function MemeGenerator() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [topText, setTopText] = useState('TOP TEXT')
  const [bottomText, setBottomText] = useState('BOTTOM TEXT')
  const [fontSize, setFontSize] = useState(48)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)

  const generateImage = useCallback(async (imagePrompt: string) => {
    if (!imagePrompt.trim()) {
      toast.error('Enter a prompt!')
      return
    }

    setGenerating(true)
    setGenerationProgress(0)
    
    // Auto text immediately
    const auto = generateAutoText(imagePrompt)
    setTopText(auto.top)
    setBottomText(auto.bottom)

    const startTime = Date.now()
    const estimatedTime = 8000 // 8 seconds estimated
    
    // Progress tracker based on time elapsed
    const progressTracker = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / estimatedTime) * 95, 95) // Cap at 95% until loaded
      setGenerationProgress(progress)
    }, 100)

    try {
      const encoded = encodeURIComponent(imagePrompt)
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=256&height=256&seed=${Date.now()}&nologo=true`
      
      // Load image with actual progress tracking
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await Promise.race([
        new Promise((resolve) => {
          // Track image loading progress
          let loadedBytes = 0
          let totalBytes = 0
          
          // Use fetch to track actual download progress
          fetch(url)
            .then(response => {
              const contentLength = response.headers.get('content-length')
              totalBytes = contentLength ? parseInt(contentLength) : 0
              
              const reader = response.body?.getReader()
              if (!reader) {
                // Fallback: just set image src and wait
                img.onload = () => {
                  clearInterval(progressTracker)
                  setGenerationProgress(100)
                  setImageUrl(url)
                  setTimeout(() => {
                    setGenerating(false)
                    setGenerationProgress(0)
                  }, 300)
                  toast.success('✨ SLOP READY!', { id: 'gen' })
                  resolve(null)
                }
                img.onerror = () => {
                  clearInterval(progressTracker)
                  setGenerationProgress(100)
                  setImageUrl(url)
                  setTimeout(() => {
                    setGenerating(false)
                    setGenerationProgress(0)
                  }, 300)
                  toast.success('✨ SLOP READY!', { id: 'gen' })
                  resolve(null)
                }
                img.src = url
                return
              }
              
              const stream = new ReadableStream({
                start(controller) {
                  const currentReader = reader
                  if (!currentReader) {
                    controller.close()
                    return
                  }
                  
                  function pump(): Promise<void> {
                    return currentReader.read().then(({ done, value }) => {
                      if (done) {
                        controller.close()
                        // Image loaded
                        clearInterval(progressTracker)
                        setGenerationProgress(100)
                        setImageUrl(url)
                        setTimeout(() => {
                          setGenerating(false)
                          setGenerationProgress(0)
                        }, 300)
                        toast.success('✨ SLOP READY!', { id: 'gen' })
                        resolve(null)
                        return Promise.resolve()
                      }
                      
                      if (value) {
                        loadedBytes += value.length
                        if (totalBytes > 0) {
                          const progress = Math.min((loadedBytes / totalBytes) * 95, 95)
                          setGenerationProgress(progress)
                        }
                        
                        controller.enqueue(value)
                      }
                      return pump()
                    }).catch((error) => {
                      controller.close()
                      // Fallback
                      img.onload = () => {
                        clearInterval(progressTracker)
                        setGenerationProgress(100)
                        setImageUrl(url)
                        setTimeout(() => {
                          setGenerating(false)
                          setGenerationProgress(0)
                        }, 300)
                        toast.success('✨ SLOP READY!', { id: 'gen' })
                        resolve(null)
                      }
                      img.src = url
                    })
                  }
                  return pump()
                }
              })
              
              // Create blob URL from stream
              new Response(stream).blob().then(blob => {
                const blobUrl = URL.createObjectURL(blob)
                img.onload = () => {
                  setImageUrl(url) // Use original URL, not blob
                  URL.revokeObjectURL(blobUrl)
                }
                img.src = blobUrl
              }).catch(() => {
                // Fallback to direct image loading
                img.onload = () => {
                  clearInterval(progressTracker)
                  setGenerationProgress(100)
                  setImageUrl(url)
                  setTimeout(() => {
                    setGenerating(false)
                    setGenerationProgress(0)
                  }, 300)
                  toast.success('✨ SLOP READY!', { id: 'gen' })
                  resolve(null)
                }
                img.src = url
              })
            })
            .catch(() => {
              // Fallback to simple image loading
              clearInterval(progressTracker)
              img.onload = () => {
                setGenerationProgress(100)
                setImageUrl(url)
                setTimeout(() => {
                  setGenerating(false)
                  setGenerationProgress(0)
                }, 300)
                toast.success('✨ SLOP READY!', { id: 'gen' })
                resolve(null)
              }
              img.onerror = () => {
                setGenerationProgress(100)
                setImageUrl(url)
                setTimeout(() => {
                  setGenerating(false)
                  setGenerationProgress(0)
                }, 300)
                toast.success('✨ SLOP READY!', { id: 'gen' })
                resolve(null)
              }
              img.src = url
            })
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            clearInterval(progressTracker)
            setGenerationProgress(95) // Don't go to 100 if timeout
            setImageUrl(url) // Show loading state
            toast.loading('✨ Taking longer than expected...', { id: 'gen' })
            // Don't resolve, let it keep trying
          }, 10000)
        })
      ]).catch(() => {
        // Keep trying in background
      })

    } catch (error) {
      clearInterval(progressTracker)
      setGenerationProgress(100)
      setImageUrl(url)
      setTimeout(() => {
        setGenerating(false)
        setGenerationProgress(0)
      }, 500)
      toast.success('✨ LOADING SLOP...', { id: 'gen' })
    }
  }, [])

  const handleTemplate = (template: typeof VIRAL_TEMPLATES[0]) => {
    setPrompt(template.prompt)
    setTopText(template.top)
    setBottomText(template.bottom)
    generateImage(template.prompt)
  }

  const handleAutoText = () => {
    if (!imageUrl) {
      toast.error('Generate an image first!', { id: 'autotext' })
      return
    }
    
    toast.loading('🤖 Generating garbage text...', { id: 'autotext' })
    
    // Small delay for effect
    setTimeout(() => {
      const auto = prompt ? generateAutoText(prompt) : generateAutoText('weird meme')
      setTopText(auto.top)
      setBottomText(auto.bottom)
      toast.success('✨ GARBAGE TEXT READY!', { id: 'autotext' })
    }, 300)
  }

  const downloadMeme = useCallback(async () => {
    if (!canvasRef.current) {
      toast.error('No meme to download!')
      return
    }

    try {
      toast.loading('Preparing download...')
      const canvas = await html2canvas(canvasRef.current, { scale: 2 })
      const link = document.createElement('a')
      link.download = `meme-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Downloaded!')
    } catch (error) {
      toast.error('Download failed')
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto relative">
      <style jsx>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .rainbow-text {
          background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: rainbow 3s linear infinite;
        }
      `}</style>
      
      <div className="bg-yellow-200 border-8 border-red-500 p-6 mb-6 transform rotate-1 shadow-2xl" style={{
        background: 'repeating-linear-gradient(45deg, #ffff00, #ffff00 10px, #ff00ff 10px, #ff00ff 20px)'
      }}>
        <div className="flex gap-4 mb-4 items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateImage(prompt)}
            placeholder="TYPE SOME GARBAGE HERE..."
            className="flex-1 px-4 py-4 text-2xl font-bold border-4 border-black bg-white text-black placeholder-gray-500 transform -rotate-1"
            style={{ fontFamily: 'Comic Sans MS, cursive', boxShadow: '10px 10px 0px #000' }}
          />
          <button
            onClick={() => generateImage(prompt)}
            disabled={generating}
            className="px-8 py-4 bg-red-500 hover:bg-red-600 border-4 border-black font-bold text-white text-xl transform rotate-2 disabled:opacity-50"
            style={{ 
              fontFamily: 'Impact, sans-serif',
              textShadow: '3px 3px 0px #000',
              boxShadow: '8px 8px 0px #000',
              animation: generating ? 'wiggle 0.3s infinite' : 'none'
            }}
          >
            {generating ? '⚠️ SLOPPING...' : '🚨 GENERATE SLOP 🚨'}
          </button>
        </div>

        <div className="bg-lime-300 border-4 border-green-600 p-3 transform -rotate-1">
          <p className="text-black font-bold text-lg mb-2" style={{ fontFamily: 'Arial Black, sans-serif', textShadow: '2px 2px 0px #fff' }}>
            💩 QUICK SLOP TEMPLATES 💩
          </p>
          <div className="flex flex-wrap gap-2">
            {VIRAL_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => handleTemplate(t)}
                disabled={generating}
                className="px-4 py-2 bg-cyan-400 border-3 border-blue-600 font-bold text-black text-sm transform hover:rotate-3 disabled:opacity-50"
                style={{ 
                  fontFamily: 'Courier New, monospace',
                  boxShadow: '4px 4px 0px #000',
                  animation: i % 2 === 0 ? 'wiggle 2s infinite' : 'none'
                }}
              >
                {t.prompt.substring(0, 18).toUpperCase()}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generating Progress Bar */}
      {generating && (
        <div className="mb-6 bg-black border-4 border-yellow-400 p-4 transform rotate-1" style={{
          boxShadow: '8px 8px 0px #ff00ff'
        }}>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl animate-spin" style={{ animationDuration: '1s' }}>🌀</span>
            <span className="text-2xl font-bold text-yellow-400" style={{ 
              fontFamily: 'Impact, sans-serif',
              textShadow: '3px 3px 0px #000'
            }}>
              GENERATING SLOP...
            </span>
            <span className="text-xl font-bold text-white ml-auto" style={{ fontFamily: 'Arial Black, sans-serif' }}>
              {Math.round(generationProgress)}%
            </span>
          </div>
          <div className="relative w-full h-8 bg-gray-800 border-3 border-black overflow-hidden">
            <div 
              className="h-full transition-all duration-200 ease-out"
              style={{
                width: `${generationProgress}%`,
                background: 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
                backgroundSize: '200% 100%',
                animation: 'rainbow 1s linear infinite',
                boxShadow: 'inset 0 0 10px #000'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ 
                fontFamily: 'Comic Sans MS, cursive',
                textShadow: '2px 2px 0px #000'
              }}>
                {generationProgress < 30 ? 'INITIALIZING CHAOS...' : 
                 generationProgress < 60 ? 'DISTORTING REALITY...' : 
                 generationProgress < 90 ? 'CRANKING SLOP...' : 
                 'ALMOST READY...'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 transform hover:rotate-1 transition-transform">
          <div ref={canvasRef} className="relative bg-black border-8 border-yellow-400 overflow-hidden aspect-square shadow-2xl" style={{
            boxShadow: '15px 15px 0px #ff00ff, -15px -15px 0px #00ffff'
          }}>
            {generating && !imageUrl ? (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-pink-500 via-yellow-500 to-cyan-500">
                <div className="text-center">
                  <div className="text-8xl mb-4 animate-spin" style={{ animationDuration: '1s' }}>🌀</div>
                  <p className="text-4xl font-bold text-black" style={{ 
                    fontFamily: 'Impact, sans-serif', 
                    textShadow: '3px 3px 0px #fff',
                    animation: 'wiggle 0.5s infinite'
                  }}>
                    SLOPPING...
                  </p>
                </div>
              </div>
            ) : imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt="SLOP" 
                  className="w-full h-full object-cover" 
                  crossOrigin="anonymous"
                  loading="eager"
                  decoding="async"
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: 'contrast(150%) saturate(200%)'
                  }}
                />
                <div className="absolute top-2 left-0 right-0 px-4 text-center" style={{
                  fontFamily: 'Comic Sans MS, cursive',
                  fontSize: `${fontSize}px`,
                  color: '#FFFF00',
                  textShadow: '5px 5px 0px #000, -3px -3px 0px #ff00ff, 3px -3px 0px #00ffff',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  transform: 'rotate(-2deg)',
                  WebkitTextStroke: '2px black'
                }}>
                  {topText}
                </div>
                <div className="absolute bottom-2 left-0 right-0 px-4 text-center" style={{
                  fontFamily: 'Comic Sans MS, cursive',
                  fontSize: `${fontSize}px`,
                  color: '#FF00FF',
                  textShadow: '5px 5px 0px #000, -3px -3px 0px #ffff00, 3px -3px 0px #00ffff',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  transform: 'rotate(2deg)',
                  WebkitTextStroke: '2px black'
                }}>
                  {bottomText}
                </div>
                <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 font-bold text-xs border-2 border-black">
                  LOW QUALITY
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-pink-500 to-yellow-500">
                <div className="text-center transform rotate-12">
                  <div className="text-8xl mb-4 animate-bounce">💀</div>
                  <p className="text-3xl font-bold text-black" style={{ fontFamily: 'Impact, sans-serif', textShadow: '3px 3px 0px #fff' }}>
                    NO SLOP YET
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-orange-300 border-6 border-purple-600 p-6 space-y-4 transform -rotate-1" style={{
          background: 'repeating-linear-gradient(90deg, #ffa500, #ffa500 20px, #ff69b4 20px, #ff69b4 40px)',
          boxShadow: '10px 10px 0px #000'
        }}>
          <h2 className="text-3xl font-bold text-black mb-4 text-center" style={{ 
            fontFamily: 'Comic Sans MS, cursive',
            textShadow: '3px 3px 0px #fff',
            WebkitTextStroke: '1px black'
          }}>
            💀 CUSTOMIZE SLOP 💀
          </h2>
          
          <button
            onClick={handleAutoText}
            disabled={!imageUrl}
            className="w-full px-4 py-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 border-4 border-black font-bold text-black disabled:opacity-50"
            style={{ 
              fontFamily: 'Impact, sans-serif',
              textShadow: '2px 2px 0px #fff',
              boxShadow: '6px 6px 0px #000',
              fontSize: '18px'
            }}
          >
            🤖 AUTO GARBAGE TEXT 🤖
          </button>

          <div className="bg-lime-200 border-3 border-green-600 p-3">
            <label className="block text-black mb-2 font-bold text-lg" style={{ fontFamily: 'Arial Black, sans-serif' }}>TOP TEXT:</label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              className="w-full px-3 py-2 bg-white border-3 border-black text-black font-bold"
              style={{ fontFamily: 'Comic Sans MS, cursive', boxShadow: '4px 4px 0px #000' }}
            />
          </div>

          <div className="bg-cyan-200 border-3 border-blue-600 p-3">
            <label className="block text-black mb-2 font-bold text-lg" style={{ fontFamily: 'Arial Black, sans-serif' }}>BOTTOM TEXT:</label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              className="w-full px-3 py-2 bg-white border-3 border-black text-black font-bold"
              style={{ fontFamily: 'Comic Sans MS, cursive', boxShadow: '4px 4px 0px #000' }}
            />
          </div>

          <div className="bg-pink-200 border-3 border-red-600 p-3">
            <label className="block text-black mb-2 font-bold text-lg" style={{ fontFamily: 'Arial Black, sans-serif' }}>
              SIZE: {fontSize}px
            </label>
            <input
              type="range"
              min="24"
              max="100"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: '#ff00ff' }}
            />
          </div>

          <button
            onClick={downloadMeme}
            disabled={!imageUrl}
            className="w-full px-4 py-4 bg-green-500 border-4 border-black font-bold text-white disabled:opacity-50"
            style={{ 
              fontFamily: 'Impact, sans-serif',
              textShadow: '3px 3px 0px #000',
              boxShadow: '6px 6px 0px #000',
              fontSize: '20px'
            }}
          >
            💾 DOWNLOAD SLOP 💾
          </button>
        </div>
      </div>
    </div>
  )
}
