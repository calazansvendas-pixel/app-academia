import { useEffect, useState } from 'react'

function App() {
  const [telaAtual, setTelaAtual] = useState('login')
  const [modoFoco, setModoFoco] = useState(false)
  const [academiaSelecionada, setAcademiaSelecionada] = useState('')
  const [aparelhosSelecionados, setAparelhosSelecionados] = useState([])
  const [novoAparelhoAberto, setNovoAparelhoAberto] = useState(false)
  const [nomeNovoAparelho, setNomeNovoAparelho] = useState('')
  const [fotoNovoAparelho, setFotoNovoAparelho] = useState('')
  const [videoNovoAparelho, setVideoNovoAparelho] = useState('')
  const [telaFoco, setTelaFoco] = useState('atual')
  const [aparelhoEmExecucao, setAparelhoEmExecucao] = useState('')
  const [descansoSegundos, setDescansoSegundos] = useState(0)
  const [descansoAtivo, setDescansoAtivo] = useState(false)
  const [seriesConcluidas, setSeriesConcluidas] = useState({})
  const [aparelhosConcluidos, setAparelhosConcluidos] = useState({})
  const [avisoSelecao, setAvisoSelecao] = useState('')
  const [fotosAparelhos, setFotosAparelhos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fotos-aparelhos') || '{}')
    } catch {
      return {}
    }
  })
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [videoAtivo, setVideoAtivo] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)

    return () => document.documentElement.classList.remove('dark')
  }, [isDarkMode])

  useEffect(() => {
    if (!descansoAtivo || descansoSegundos <= 0) return undefined

    const intervalo = window.setInterval(() => {
      setDescansoSegundos((current) => {
        if (current <= 1) {
          setDescansoAtivo(false)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalo)
  }, [descansoAtivo, descansoSegundos])

  const handleSubmit = (event) => {
    event.preventDefault()
    setTelaAtual('academias')
  }

  const academias = ['Órbita', 'Vix', 'Panobianco']
  const aparelhosPadrao = [
    { id: 'supino-reto', name: 'Supino Reto', image: '/aparelhos/supino-reto.jpg', videoUrl: 'https://www.youtube.com/embed/EZMYCLKuGow' },
    { id: 'supino-inclinado', name: 'Supino Inclinado', image: '/aparelhos/supino-inclinado.jpg', videoUrl: 'https://www.youtube.com/embed/6jBx5YwAb7E' },
    { id: 'puxador-frente', name: 'Puxador Frente', image: '/aparelhos/puxador-frente.jpg', videoUrl: 'https://www.youtube.com/embed/ftcql3-AMRs' },
    { id: 'puxador-triangulo', name: 'Puxador Triângulo', image: '/aparelhos/puxador-triangulo.jpg', videoUrl: 'https://www.youtube.com/embed/4-PsgYmkDsM' },
    { id: 'maquina-biceps', name: 'Máquina de Bíceps', image: '/aparelhos/maquina-biceps.jpg', videoUrl: 'https://www.youtube.com/embed/U-f3m_H6Fz4' },
    { id: 'maquina-triceps', name: 'Máquina de Tríceps', image: '/aparelhos/maquina-triceps.jpg', videoUrl: 'https://www.youtube.com/embed/m5xXw_fD-pE' },
    { id: 'peck-deck', name: 'Peck Deck', image: '/aparelhos/peck-deck.jpg', videoUrl: 'https://www.youtube.com/embed/466JpXmS2xY' },
    { id: 'polia-peito', name: 'Polia - Peito', image: '/aparelhos/polia-peito.jpg', videoUrl: 'https://www.youtube.com/embed/WEM9fH_Yv68' },
    { id: 'polia-triceps', name: 'Polia - Tríceps', image: '/aparelhos/polia-triceps.jpg', videoUrl: 'https://www.youtube.com/embed/V_L8_yXqW-Y' },
    { id: 'polia-biceps', name: 'Polia - Bíceps', image: '/aparelhos/polia-biceps.jpg', videoUrl: 'https://www.youtube.com/embed/5H7T6XFfO5w' },
    { id: 'crossover', name: 'Crossover', image: '/aparelhos/crossover.jpg', videoUrl: 'https://www.youtube.com/embed/p7-H-3y_oMk' },
    { id: 'polia-manguito-rotador', name: 'Polia - Manguito Rotador', image: '/aparelhos/polia-manguito-rotador.jpg', videoUrl: 'https://www.youtube.com/embed/5uWpYnE0B7c' },
  ]
  const [aparelhos, setAparelhos] = useState(() => {
    try {
      const aparelhosSalvos = JSON.parse(localStorage.getItem('aparelhos') || 'null')
      return Array.isArray(aparelhosSalvos) && aparelhosSalvos.length > 0 ? aparelhosSalvos : aparelhosPadrao
    } catch {
      return aparelhosPadrao
    }
  })

  const capturarFoto = (aparelho, event) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return

    const leitor = new FileReader()
    leitor.onload = () => {
      const foto = leitor.result
      setFotosAparelhos((current) => {
        const novasFotos = { ...current, [aparelho.id]: foto }
        localStorage.setItem('fotos-aparelhos', JSON.stringify(novasFotos))
        return novasFotos
      })
      event.target.value = ''
    }
    leitor.readAsDataURL(arquivo)
  }

  const capturarFotoNovoAparelho = (event) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return

    const leitor = new FileReader()
    leitor.onload = () => {
      setFotoNovoAparelho(leitor.result)
      event.target.value = ''
    }
    leitor.readAsDataURL(arquivo)
  }

  const fecharNovoAparelho = () => {
    setNovoAparelhoAberto(false)
    setNomeNovoAparelho('')
    setFotoNovoAparelho('')
    setVideoNovoAparelho('')
  }

  const salvarNovoAparelho = (event) => {
    event.preventDefault()
    const nome = nomeNovoAparelho.trim()
    if (!nome) return

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `aparelho-${Date.now()}`
    const novoAparelho = { id, name: nome, videoUrl: formatarYoutubeUrl(videoNovoAparelho.trim()) }
    const novaLista = [...aparelhos, novoAparelho]

    setAparelhos(novaLista)
    localStorage.setItem('aparelhos', JSON.stringify(novaLista))
    if (fotoNovoAparelho) {
      setFotosAparelhos((current) => {
        const novasFotos = { ...current, [id]: fotoNovoAparelho }
        localStorage.setItem('fotos-aparelhos', JSON.stringify(novasFotos))
        return novasFotos
      })
    }
    fecharNovoAparelho()
  }

  const editarVideo = (aparelhoId) => {
    const novoLink = window.prompt("Cole o novo link do YouTube para este exercício:")
    if (novoLink === null) return // Cancelado

    const videoUrlFormatado = formatarYoutubeUrl(novoLink.trim())
    setAparelhos((current) => {
      const novaLista = current.map((ap) =>
        ap.id === aparelhoId ? { ...ap, videoUrl: videoUrlFormatado } : ap
      )
      localStorage.setItem('aparelhos', JSON.stringify(novaLista))
      return novaLista
    })
  }

  const limparCache = () => {
    localStorage.clear()
    window.location.reload()
  }

  const abrirCatalogo = (academia) => {
    setAcademiaSelecionada(academia)
    setTelaAtual('catalogo')
  }

  const alternarAparelho = (aparelho) => {
    setAparelhosSelecionados((current) => current.includes(aparelho)
      ? current.filter((item) => item !== aparelho)
      : [...current, aparelho])
  }

  const iniciarFoco = () => {
    if (aparelhosSelecionados.length === 0) {
      setAvisoSelecao('Selecione pelo menos 1 exercício para iniciar o Modo Foco.')
      return
    }

    setAvisoSelecao('')
    setTelaFoco('atual')
    setAparelhoEmExecucao('')
    setDescansoSegundos(0)
    setDescansoAtivo(false)
    setModoFoco(true)
  }

  const sairDoFoco = () => {
    setDescansoAtivo(false)
    setDescansoSegundos(0)
    setTelaFoco('atual')
    setAparelhoEmExecucao('')
    setSeriesConcluidas({})
    setAparelhosConcluidos({})
    setModoFoco(false)
  }

  const ajustarDescanso = (segundos) => {
    setDescansoSegundos((current) => current + segundos)
    setDescansoAtivo(false)
  }

  const alternarDescanso = () => {
    if (descansoSegundos === 0) {
      setDescansoSegundos(60)
    }
    setDescansoAtivo((current) => !current)
  }

  const abrirExecucao = (aparelho) => {
    setAparelhoEmExecucao(aparelho)
    setTelaFoco('execucao')
    setDescansoSegundos(0)
    setDescansoAtivo(false)
  }

  const concluirExercicio = () => {
    setAparelhosConcluidos((current) => ({ ...current, [aparelhoEmExecucao]: true }))
    setTelaFoco('atual')
    setDescansoAtivo(false)
    setDescansoSegundos(0)
  }

  const alterarSeriesConcluidas = (event) => {
    setSeriesConcluidas((current) => ({ ...current, [aparelhoEmExecucao]: event.target.value }))
  }

  const encerrarTreino = () => {
    setModoFoco(false)
    setTelaAtual('academias')
    setTelaFoco('atual')
    setAparelhoEmExecucao('')
    setSeriesConcluidas({})
    setAparelhosConcluidos({})
    setDescansoAtivo(false)
    setDescansoSegundos(0)
  }

  const aparelhoEmFoco = aparelhos.find((aparelho) => aparelho.name === aparelhoEmExecucao)
  const fotoEmFoco = aparelhoEmFoco ? fotosAparelhos[aparelhoEmFoco.id] : ''
  const formatarTempo = (segundos) => `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`

  if (modoFoco) {
    return (
      <>
        {telaFoco === 'atual' ? <TelaTreinoAtual
          aparelhosSelecionados={aparelhosSelecionados}
          aparelhosConcluidos={aparelhosConcluidos}
          onSelecionar={abrirExecucao}
          onEncerrar={encerrarTreino}
          isDarkMode={isDarkMode}
          onAlternarTema={() => setIsDarkMode((current) => !current)}
        /> : <TelaTreinoFoco
          aparelhoEmFoco={aparelhoEmFoco}
          fotoEmFoco={fotoEmFoco}
          isDarkMode={isDarkMode}
          descansoSegundos={descansoSegundos}
          descansoAtivo={descansoAtivo}
          seriesConcluidas={seriesConcluidas[aparelhoEmExecucao] || ''}
          onSair={() => setTelaFoco('atual')}
          onAlternarTema={() => setIsDarkMode((current) => !current)}
          onAjustarDescanso={ajustarDescanso}
          onAlternarDescanso={alternarDescanso}
          onZerarDescanso={() => { setDescansoAtivo(false); setDescansoSegundos(0) }}
          onSeriesChange={alterarSeriesConcluidas}
          onConcluir={concluirExercicio}
          formatarTempo={formatarTempo}
          onVerVideo={setVideoAtivo}
        />}
        {videoAtivo && <VideoModal videoUrl={videoAtivo} onClose={() => setVideoAtivo(null)} />}
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0a142f] transition-colors duration-200">
        <main className="max-w-lg mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative px-5 py-8 text-slate-900 dark:text-white">
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsDarkMode((current) => !current)}
              aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="inline-flex items-center gap-2 rounded-full border border-[#CCD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#1A3E95] shadow-sm transition hover:border-[#1A3E95] focus:outline-none focus:ring-2 focus:ring-[#1A3E95] dark:border-slate-600 dark:bg-[#111f42] dark:text-white dark:hover:border-white"
            >
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M4.2 4.2l1.1 1.1M18.7 18.7l1.1 1.1M3 12h1.5M19.5 12H21M4.2 19.8l1.1-1.1M18.7 5.3l1.1-1.1M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              )}
              {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            </button>
          </div>

          <div className="flex flex-1 flex-col">
            {telaAtual === 'login' ? (
              <>
                <section className="flex flex-1 flex-col justify-center py-12">
                <div className="mb-10 flex flex-col items-center text-center">
                  <img src="/logo.png" alt="Calazans" className="mx-auto mb-8 block h-20 w-auto object-contain" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">E-mail</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="seuemail@exemplo.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-[#CCD5E1] bg-white px-4 py-3 text-sm text-[#0A142F] outline-none transition placeholder:text-slate-400 focus:border-[#1A3E95] focus:ring-2 focus:ring-[#1A3E95]/20 dark:border-slate-600 dark:bg-[#111f42] dark:text-white dark:placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Senha</label>
                      <button type="button" className="text-xs font-semibold text-[#1A3E95] transition hover:text-[#15357E] dark:text-blue-300 dark:hover:text-white">Esqueci minha senha</button>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-[#CCD5E1] bg-white px-4 py-3 pr-12 text-sm text-[#0A142F] outline-none transition placeholder:text-slate-400 focus:border-[#1A3E95] focus:ring-2 focus:ring-[#1A3E95]/20 dark:border-slate-600 dark:bg-[#111f42] dark:text-white dark:placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-[#1A3E95] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1A3E95] dark:text-slate-300 dark:hover:text-white"
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.5 10.5 0 0 1 12 4c5 0 8.5 5 8.5 5a15.7 15.7 0 0 1-3.2 3.8M6.2 6.2C3.8 7.9 2.5 9 2.5 9s3.5 5 9.5 5c1 0 1.9-.2 2.7-.5" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="w-full rounded-xl bg-[#1A3E95] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#15357E] focus:outline-none focus:ring-2 focus:ring-[#1A3E95] focus:ring-offset-2">
                    Entrar
                  </button>
                </form>

                <button type="button" className="mt-4 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 py-3 text-sm font-semibold text-[#1A3E95] transition hover:border-[#1A3E95] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A3E95] focus:ring-offset-2 dark:border-slate-600 dark:bg-[#111f42] dark:text-white dark:hover:bg-[#17284e]">
                  Criar conta
                </button>
              </section>

              <p className="pb-2 text-center text-xs text-slate-400 dark:text-slate-300">Treine com propósito. Evolua com consistência.</p>
            </>
          ) : telaAtual === 'academias' ? (
            <section className="flex flex-1 flex-col justify-center py-12">
              <div className="mb-4">
                <button type="button" onClick={() => setTelaAtual('login')} className="text-sm font-semibold text-[#1A3E95] transition hover:text-[#15357E] focus:outline-none focus:ring-2 focus:ring-[#1A3E95] focus:ring-offset-2 dark:text-blue-300 dark:hover:text-white">
                  ← Voltar
                </button>
              </div>

              <header className="mb-8 text-center">
                <img src="/logo.png" alt="Calazans" className="mx-auto mb-6 block h-12 w-auto object-contain" />
                <h1 className="text-2xl font-bold tracking-tight text-[#0A142F] dark:text-white">Onde você vai treinar hoje?</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Escolha sua academia para continuar.</p>
              </header>

              <div className="space-y-3">
                {academias.map((academia) => (
                  <button key={academia} type="button" onClick={() => abrirCatalogo(academia)} className="group flex w-full items-center justify-between rounded-xl border border-[#CCD5E1] bg-white px-5 py-5 text-left shadow-sm transition hover:border-[#1A3E95] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1A3E95] dark:border-slate-600 dark:bg-[#111f42] dark:hover:border-blue-300">
                    <span className="text-lg font-bold text-[#0A142F] dark:text-white">{academia}</span>
                    <span className="rounded-lg p-2 text-red-500 transition group-hover:bg-red-50 dark:group-hover:bg-red-500/10" aria-label={`Excluir academia ${academia}`}>
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>

              <button type="button" className="mt-6 w-full rounded-xl border border-[#1A3E95] px-4 py-3 text-sm font-bold text-[#1A3E95] transition hover:bg-[#1A3E95]/5 focus:outline-none focus:ring-2 focus:ring-[#1A3E95] dark:text-blue-300 dark:hover:bg-white/5">
                + Nova Academia
              </button>
            </section>
          ) : (
            <TelaCatalogo
              academiaSelecionada={academiaSelecionada}
              aparelhos={aparelhos}
              aparelhosSelecionados={aparelhosSelecionados}
              fotosAparelhos={fotosAparelhos}
              avisoSelecao={avisoSelecao}
              novoAparelhoAberto={novoAparelhoAberto}
              nomeNovoAparelho={nomeNovoAparelho}
              fotoNovoAparelho={fotoNovoAparelho}
              videoNovoAparelho={videoNovoAparelho}
              onVoltar={() => setTelaAtual('academias')}
              onAlternarAparelho={alternarAparelho}
              onCapturarFoto={capturarFoto}
              onStart={iniciarFoco}
              onAbrirNovo={() => setNovoAparelhoAberto(true)}
              onFecharNovo={fecharNovoAparelho}
              onSalvarNovo={salvarNovoAparelho}
              onNomeChange={setNomeNovoAparelho}
              onFotoNovo={capturarFotoNovoAparelho}
              onVideoChange={setVideoNovoAparelho}
              onVerVideo={setVideoAtivo}
              onEditarVideo={editarVideo}
              onLimparCache={limparCache}
            />
          )}
        </div>
      </main>
    </div>
    {videoAtivo && <VideoModal videoUrl={videoAtivo} onClose={() => setVideoAtivo(null)} />}
  </>
)
}

function TelaTreinoFoco({ aparelhoEmFoco, fotoEmFoco, isDarkMode, descansoSegundos, descansoAtivo, seriesConcluidas, onSair, onAlternarTema, onAjustarDescanso, onAlternarDescanso, onZerarDescanso, onSeriesChange, onConcluir, formatarTempo, onVerVideo }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0a142f] transition-colors duration-200">
      <main className="max-w-lg mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative px-5 py-8 text-slate-900 dark:text-white">
        <header className="flex items-center justify-between">
          <button type="button" onClick={onSair} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#1A3E95] transition hover:bg-[#1A3E95]/10 focus:outline-none focus:ring-2 focus:ring-[#1A3E95] dark:text-blue-300 dark:hover:bg-white/10">
            <span aria-hidden="true">&lt;</span> Sair do Treino
          </button>
          <button type="button" onClick={onAlternarTema} className="rounded-full border border-[#CCD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#1A3E95] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </header>

        <div className="mt-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1A3E95] dark:text-blue-300">Execução atual</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{aparelhoEmFoco?.name}</h1>
          {(aparelhoEmFoco?.videoUrl || aparelhoEmFoco?.video) && (
            <button
              type="button"
              onClick={() => onVerVideo(aparelhoEmFoco.videoUrl || aparelhoEmFoco.video)}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#1A3E95]/20 bg-[#1A3E95]/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1A3E95] transition hover:bg-[#1A3E95]/10 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/20"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Ver Execução
            </button>
          )}
        </div>

        <div className="mt-7 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 shadow-sm dark:bg-slate-800">
          {fotoEmFoco ? <img src={fotoEmFoco} alt={`Foto do aparelho ${aparelhoEmFoco?.name}`} className="h-full w-full object-cover brightness-110 contrast-110" /> : <span className="text-5xl text-slate-300 dark:text-slate-600" aria-label="Sem foto cadastrada">+</span>}
        </div>

        <section className="mt-6 rounded-2xl border border-[#CCD5E1] bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Descanso</p>
          <p className="mt-2 text-5xl font-bold tabular-nums text-[#1A3E95] dark:text-blue-300">{formatarTempo(descansoSegundos)}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[30, 45, 60].map((segundos) => <button key={segundos} type="button" onClick={() => onAjustarDescanso(segundos)} className="rounded-lg border border-[#CCD5E1] px-3 py-2 text-xs font-bold dark:border-slate-600">+{segundos}s</button>)}
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={onAlternarDescanso} className="rounded-lg bg-[#1A3E95] px-4 py-2 text-xs font-bold text-white">{descansoAtivo ? 'Pausar' : 'Iniciar'}</button>
            <button type="button" onClick={onZerarDescanso} className="rounded-lg border border-[#CCD5E1] px-4 py-2 text-xs font-bold dark:border-slate-600">Zerar</button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#CCD5E1] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Séries concluídas
            <select value={seriesConcluidas} onChange={onSeriesChange} className="mt-2 w-full rounded-xl border border-[#CCD5E1] bg-white px-4 py-3 text-base dark:border-slate-600 dark:bg-slate-950">
              <option value="">Selecione</option>
              {[1, 2, 3, 4].map((quantidade) => <option key={quantidade} value={quantidade}>{quantidade}</option>)}
            </select>
          </label>
        </section>
        <button type="button" onClick={onConcluir} className="mt-6 w-full rounded-xl bg-[#1A3E95] px-4 py-3 text-sm font-bold text-white">Concluir Exercício</button>
    </main>
    </div>
  )
}

function TelaTreinoAtual({ aparelhosSelecionados, aparelhosConcluidos, onSelecionar, onEncerrar, isDarkMode, onAlternarTema }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0a142f] transition-colors duration-200">
      <main className="max-w-lg mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative px-5 py-8 text-slate-900 dark:text-white">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1A3E95] dark:text-blue-300">Modo Foco</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Treino Atual</h1>
          </div>
          <button type="button" onClick={onAlternarTema} className="rounded-full border border-[#CCD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#1A3E95] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</button>
        </header>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">Escolha livremente qual aparelho está disponível agora.</p>
        <div className="mt-7 space-y-3">
          {aparelhosSelecionados.map((nome) => {
            const concluido = aparelhosConcluidos[nome]
            return <button key={nome} type="button" onClick={() => onSelecionar(nome)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition hover:border-[#1A3E95] ${concluido ? 'border-emerald-300 bg-emerald-50/70 opacity-70 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-[#CCD5E1] bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
              <span className={`font-bold ${concluido ? 'line-through' : ''}`}>{nome}</span>
              {concluido && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Concluído</span>}
            </button>
          })}
        </div>
        <button type="button" onClick={onEncerrar} className="mt-auto rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">Encerrar Treino</button>
    </main>
    </div>
  )
}

function TelaCatalogo({ academiaSelecionada, aparelhos, aparelhosSelecionados, fotosAparelhos, avisoSelecao, novoAparelhoAberto, nomeNovoAparelho, fotoNovoAparelho, videoNovoAparelho, onVoltar, onAlternarAparelho, onCapturarFoto, onStart, onAbrirNovo, onFecharNovo, onSalvarNovo, onNomeChange, onFotoNovo, onVideoChange, onVerVideo, onEditarVideo, onLimparCache }) {
  return (
    <section className="flex flex-1 flex-col py-10 pb-28">
      <div className="flex items-center justify-between gap-4 mb-7">
        <button type="button" onClick={onVoltar} aria-label="Voltar para academias" className="rounded-lg bg-white p-2 text-[#1A3E95] shadow-sm dark:bg-slate-800">&lt;</button>
        <button type="button" onClick={onAbrirNovo} className="rounded-full bg-[#1A3E95] px-4 py-2.5 text-xs font-bold text-white shadow-md">+ Novo Aparelho</button>
      </div>
      <header className="mb-7">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1A3E95] dark:text-blue-300">Catálogo de aparelhos</p><h1 className="mt-1 text-2xl font-bold dark:text-white">Treino na {academiaSelecionada}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Escolha os exercícios para o seu treino de hoje.</p></div>
      </header>
      <div className="space-y-3">
        {aparelhos.map((aparelho) => {
          const selecionado = aparelhosSelecionados.includes(aparelho.name)
          const videoUrl = aparelho.videoUrl || aparelho.video
          return <article key={aparelho.id} className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm dark:bg-[#111f42] ${selecionado ? 'border-[#1A3E95] ring-2 ring-[#1A3E95]/20' : 'border-[#CCD5E1] dark:border-slate-600'}`}>
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">{fotosAparelhos[aparelho.id] ? <img src={fotosAparelhos[aparelho.id]} alt={`Foto do aparelho ${aparelho.name}`} className="h-full w-full object-cover brightness-110 contrast-110" /> : <span className="text-2xl text-slate-300">+</span>}</div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold">{aparelho.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#1A3E95] dark:text-blue-300">
                  {fotosAparelhos[aparelho.id] ? 'Trocar Foto' : 'Tirar Foto'}
                  <input type="file" accept="image/*" capture="environment" onChange={(event) => onCapturarFoto(aparelho, event)} className="sr-only" />
                </label>
                {videoUrl && (
                  <button type="button" onClick={() => onVerVideo(videoUrl)} className="text-xs font-semibold text-[#1A3E95] hover:underline dark:text-blue-300">
                    Ver Execução
                  </button>
                )}
                <button type="button" onClick={() => onEditarVideo(aparelho.id)} className="text-xs font-semibold text-slate-400 hover:text-[#1A3E95] dark:hover:text-blue-300">
                  Editar Vídeo
                </button>
              </div>
            </div>
            <label className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border ${selecionado ? 'border-[#1A3E95] bg-[#1A3E95] text-white' : 'border-[#CCD5E1] text-transparent'}`}><input type="checkbox" checked={selecionado} onChange={() => onAlternarAparelho(aparelho.name)} className="sr-only" /><span>✓</span></label>
          </article>
        })}
      </div>
      {avisoSelecao && <p role="alert" className="mb-4 mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">{avisoSelecao}</p>}
      <div className="mt-8 flex flex-col items-center gap-4">
        <button type="button" onClick={onLimparCache} className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">
          Limpar Cache de Vídeos
        </button>
      </div>
      <button type="button" onClick={onStart} className="fixed bottom-0 left-1/2 z-10 w-full max-w-lg -translate-x-1/2 bg-[#1A3E95] px-5 py-4 text-sm font-bold text-white">Start (Modo Foco){aparelhosSelecionados.length ? ` · ${aparelhosSelecionados.length} selecionado${aparelhosSelecionados.length > 1 ? 's' : ''}` : ''}</button>
      {novoAparelhoAberto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A142F]/60 px-5 backdrop-blur-sm"><form onSubmit={onSalvarNovo} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#111f42]"><h2 className="text-lg font-bold">Novo Aparelho</h2><label className="mt-4 block text-sm font-semibold">Nome do Aparelho<input required value={nomeNovoAparelho} onChange={(event) => onNomeChange(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:bg-[#0A142F]" /></label><label className="mt-4 inline-flex cursor-pointer rounded-xl border border-[#1A3E95] px-4 py-2.5 text-sm font-bold text-[#1A3E95]">{fotoNovoAparelho ? 'Trocar Foto' : 'Tirar Foto'}<input type="file" accept="image/*" capture="environment" onChange={onFotoNovo} className="sr-only" /></label><label className="mt-4 block text-sm font-semibold">Link do vídeo (opcional)<input type="url" value={videoNovoAparelho} onChange={(event) => onVideoChange(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:bg-[#0A142F]" /></label><div className="mt-6 flex gap-3"><button type="button" onClick={onFecharNovo} className="flex-1 rounded-xl border p-3 font-bold">Cancelar</button><button type="submit" className="flex-1 rounded-xl bg-[#1A3E95] p-3 font-bold text-white">Salvar Aparelho</button></div></form></div>}
    </section>
  )
}

export default App

const formatarYoutubeUrl = (url) => {
  if (!url) return ''
  if (typeof url !== 'string') return ''
  
  // Se já for um embed, garante o protocolo correto
  if (url.includes('youtube.com/embed/')) {
    const id = url.split('youtube.com/embed/')[1].split(/[?#]/)[0]
    return `https://www.youtube.com/embed/${id}`
  }

  let videoId = ''
  
  if (url.includes('youtu.be/')) {
    // Ex: https://youtu.be/videoId?t=10
    videoId = url.split('youtu.be/')[1].split(/[?#]/)[0]
  } else if (url.includes('youtube.com/shorts/')) {
    // Ex: https://www.youtube.com/shorts/videoId
    videoId = url.split('youtube.com/shorts/')[1].split(/[?#]/)[0]
  } else if (url.includes('v=')) {
    // Ex: https://www.youtube.com/watch?v=videoId&t=10
    videoId = url.split('v=')[1].split(/[&?#]/)[0]
  } else if (url.includes('youtube.com/watch/')) {
    // Ex: https://www.youtube.com/watch/videoId
    videoId = url.split('youtube.com/watch/')[1].split(/[?#]/)[0]
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}

function VideoModal({ videoUrl, onClose }) {
  if (!videoUrl) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 text-white hover:text-red-400 transition-colors"
          aria-label="Fechar Modal"
        >
          <span className="text-sm font-bold uppercase tracking-widest">Fechar</span>
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={videoUrl}
            title="Vídeo de execução"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  )
}
