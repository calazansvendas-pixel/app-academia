import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, runTransaction, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

const perfilAdmin = { id: 'calazans', name: 'Calazans', role: 'admin' }
const dadosVazios = { selecionados: [], series: {}, concluidos: {}, videos: {}, historico: [] }

function limparTreino(dados, machines) {
  const nomes = new Set(machines.map((aparelho) => aparelho.name))
  const ids = new Set(machines.map((aparelho) => aparelho.id))
  const filtrarMapa = (mapa, chaves) => Object.fromEntries(Object.entries(mapa || {}).filter(([chave]) => chaves.has(chave)))
  return {
    selecionados: (dados.selecionados || []).filter((nome) => nomes.has(nome)),
    series: filtrarMapa(dados.series, nomes),
    concluidos: filtrarMapa(dados.concluidos, nomes),
    videos: filtrarMapa(dados.videos, ids),
  }
}

function App() {
  const [telaAtual, setTelaAtual] = useState('perfis')
  const [perfis, setPerfis] = useState([])
  const [perfilAtivo, setPerfilAtivo] = useState(null)
  const currentUser = perfis.find((perfil) => perfil.id === perfilAtivo?.id) || null
  const [loadingPerfis, setLoadingPerfis] = useState(true)
  const [loadingMachines, setLoadingMachines] = useState(true)
  const [machinesProntas, setMachinesProntas] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erroPersistencia, setErroPersistencia] = useState('')
  const [filtroHistorico, setFiltroHistorico] = useState('todos')
  const [modoFoco, setModoFoco] = useState(false)
  const [academiaSelecionada, setAcademiaSelecionada] = useState('')
  const [novoAparelhoAberto, setNovoAparelhoAberto] = useState(false)
  const [nomeNovoAparelho, setNomeNovoAparelho] = useState('')
  const [fotoNovoAparelho, setFotoNovoAparelho] = useState('')
  const [videoNovoAparelho, setVideoNovoAparelho] = useState('')
  const [telaFoco, setTelaFoco] = useState('atual')
  const [aparelhoEmExecucao, setAparelhoEmExecucao] = useState('')
  const [descansoSegundos, setDescansoSegundos] = useState(0)
  const [descansoAtivo, setDescansoAtivo] = useState(false)
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
  const [aparelhos, setAparelhos] = useState([])
  const [dadosPerfis, setDadosPerfis] = useState({})
  const [historicos, setHistoricos] = useState({})
  const dadosAtivos = { ...dadosVazios, ...dadosPerfis[currentUser?.id] }
  const aparelhosSelecionados = dadosAtivos.selecionados.filter((nome) => aparelhos.some((aparelho) => aparelho.name === nome))
  const seriesConcluidas = dadosAtivos.series
  const aparelhosConcluidos = dadosAtivos.concluidos
  const catalogoDoPerfil = aparelhos.map((aparelho) => ({ ...aparelho, video: '', videoUrl: dadosAtivos.videos[aparelho.id] || '' }))

  useEffect(() => {
    let ativo = true
    let perfisRecebidos = false
    let machinesRecebidas = false
    const avisoConexao = window.setTimeout(() => {
      if (!perfisRecebidos || !machinesRecebidas) {
        setErroPersistencia('A conexão com o Firestore está demorando. Verifique a rede, a criação do banco (default) e suas regras de acesso.')
      }
    }, 12000)
    const adminRef = doc(db, 'users', perfilAdmin.id)
    getDoc(adminRef).then((snapshot) => {
      if (ativo && (!snapshot.exists() || snapshot.data().role !== 'admin')) {
        return setDoc(adminRef, { name: perfilAdmin.name, role: 'admin' }, { merge: true })
      }
    }).catch(() => { if (ativo) setErroPersistencia('Não foi possível configurar o perfil administrador.') })
    const pararPerfis = onSnapshot(collection(db, 'users'), (snapshot) => {
      perfisRecebidos = true
      setPerfis(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })))
      setLoadingPerfis(false)
    }, () => { setLoadingPerfis(false); setErroPersistencia('Não foi possível carregar os perfis. Verifique a conexão e as permissões do Firestore.') })
    const pararMachines = onSnapshot(collection(db, 'machines'), { includeMetadataChanges: true }, (snapshot) => {
      machinesRecebidas = !snapshot.metadata.fromCache
      const machines = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
      setAparelhos(machines)
      setFotosAparelhos((current) => ({ ...current, ...Object.fromEntries(machines.filter((item) => item.photo).map((item) => [item.id, item.photo])) }))
      setLoadingMachines(false)
      setMachinesProntas(!snapshot.metadata.fromCache)
    }, () => { setLoadingMachines(false); setMachinesProntas(false); setErroPersistencia('Não foi possível carregar o catálogo do Firestore.') })
    return () => { ativo = false; window.clearTimeout(avisoConexao); pararPerfis(); pararMachines() }
  }, [])

  const userId = currentUser?.id
  const userRole = currentUser?.role
  useEffect(() => {
    if (!userId) return undefined
    return onSnapshot(doc(db, 'users', userId, 'workout', 'current'), (snapshot) => {
      setDadosPerfis({ [userId]: { ...dadosVazios, ...(snapshot.exists() ? snapshot.data() : {}) } })
      setLoadingDados(false)
    }, () => { setLoadingDados(false); setErroPersistencia('Não foi possível carregar os dados deste perfil.') })
  }, [userId])

  const perfisHistorico = userRole === 'admin' && telaAtual === 'historico-geral' ? perfis : currentUser ? [currentUser] : []
  const idsHistorico = perfisHistorico.map((perfil) => perfil.id).sort().join('|')
  const loadingHistorico = perfisHistorico.some((perfil) => !Object.hasOwn(historicos, perfil.id))
  useEffect(() => {
    if (!userId || (telaAtual !== 'historico' && telaAtual !== 'historico-geral')) return undefined
    const ids = userRole === 'admin' && telaAtual === 'historico-geral' ? idsHistorico.split('|').filter(Boolean) : [userId]
    const parar = ids.map((id) => onSnapshot(collection(db, 'users', id, 'history'), (snapshot) => {
      setHistoricos((current) => ({ ...current, [id]: snapshot.docs.map((item) => ({ ...item.data(), id: item.id })) }))
    }, () => {
      setHistoricos((current) => ({ ...current, [id]: [] }))
      setErroPersistencia('Não foi possível carregar o histórico solicitado.')
    }))
    return () => parar.forEach((unsubscribe) => unsubscribe())
  }, [userId, userRole, telaAtual, idsHistorico])

  useEffect(() => {
    if (!userId || loadingDados || !machinesProntas) return
    const dados = dadosPerfis[userId]
    if (!dados) return
    const limpos = limparTreino(dados, aparelhos)
    const anteriores = { selecionados: dados.selecionados, series: dados.series, concluidos: dados.concluidos, videos: dados.videos }
    if (JSON.stringify(limpos) === JSON.stringify(anteriores)) return
    setDoc(doc(db, 'users', userId, 'workout', 'current'), limpos, { mergeFields: ['selecionados', 'series', 'concluidos', 'videos'] })
      .catch(() => setErroPersistencia('Não foi possível atualizar as referências do treino.'))
  }, [userId, loadingDados, machinesProntas, dadosPerfis, aparelhos])

  const atualizarDados = async (campo, valor) => {
    if (!currentUser || loadingDados || !machinesProntas || !dadosPerfis[currentUser.id]) return false
    const id = currentUser.id
    const anteriores = dadosAtivos[campo]
    const novoValor = typeof valor === 'function' ? valor(anteriores) : valor
    setDadosPerfis((current) => ({ ...current, [id]: { ...dadosAtivos, [campo]: novoValor } }))
    try {
      await setDoc(doc(db, 'users', id, 'workout', 'current'), { [campo]: novoValor }, { mergeFields: [campo] })
      return true
    } catch {
      setDadosPerfis((current) => ({ ...current, [id]: { ...current[id], [campo]: anteriores } }))
      setErroPersistencia('Não foi possível salvar os dados do treino. Tente novamente.')
      return false
    }
  }
  const setAparelhosSelecionados = (valor) => atualizarDados('selecionados', valor)
  const setSeriesConcluidas = (valor) => atualizarDados('series', valor)
  const setAparelhosConcluidos = (valor) => atualizarDados('concluidos', valor)

  const escolherPerfil = (perfil) => {
    setLoadingDados(true)
    setDadosPerfis({})
    setHistoricos({})
    setPerfilAtivo(perfil)
    setTelaAtual('academias')
    setAvisoSelecao('')
    setFiltroHistorico('todos')
  }

  const trocarPerfil = () => {
    if (salvando) return
    setModoFoco(false)
    setDescansoAtivo(false)
    setDescansoSegundos(0)
    setVideoAtivo(null)
    fecharNovoAparelho()
    setPerfilAtivo(null)
    setDadosPerfis({})
    setHistoricos({})
    setTelaAtual('perfis')
  }

  const cadastrarPerfil = async (nome) => {
    if (salvando || loadingPerfis) return false
    if (perfis.some((perfil) => perfil.name.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) return false
    try {
      setSalvando(true)
      const ref = await addDoc(collection(db, 'users'), { name: nome, role: 'user' })
      escolherPerfil({ id: ref.id, name: nome, role: 'user' })
      return true
    } catch {
      setErroPersistencia('Não foi possível cadastrar o perfil no Firestore.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  const capturarFoto = (aparelho, event) => {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return

    const leitor = new FileReader()
    leitor.onload = async () => {
      const foto = leitor.result
      if (foto.length > 900000) { setErroPersistencia('A foto é grande demais para o Firestore. Escolha uma imagem menor.'); return }
      try {
        await updateDoc(doc(db, 'machines', aparelho.id), { photo: foto })
        setFotosAparelhos((current) => ({ ...current, [aparelho.id]: foto }))
      } catch {
        setErroPersistencia('Não foi possível salvar a foto no Firestore.')
      }
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

  const salvarNovoAparelho = async (event) => {
    event.preventDefault()
    const nome = nomeNovoAparelho.trim()
    if (!nome || !currentUser || salvando || loadingDados || !machinesProntas) return
    if (fotoNovoAparelho.length > 900000) { setErroPersistencia('Escolha uma foto menor para salvar no Firestore.'); return }
    try {
      setSalvando(true)
      const ref = await addDoc(collection(db, 'machines'), { name: nome, photo: fotoNovoAparelho })
      if (videoNovoAparelho.trim()) {
        await atualizarDados('videos', (current) => ({ ...current, [ref.id]: formatarYoutubeUrl(videoNovoAparelho.trim()) }))
      }
      fecharNovoAparelho()
    } catch {
      setErroPersistencia('Não foi possível cadastrar o aparelho no Firestore.')
    } finally {
      setSalvando(false)
    }
  }

  const editarVideo = (aparelhoId) => {
    const novoLink = window.prompt("Cole o novo link do YouTube para este exercício:")
    if (novoLink === null) return // Cancelado

    const videoUrlFormatado = formatarYoutubeUrl(novoLink.trim())
    atualizarDados('videos', (current) => ({ ...current, [aparelhoId]: videoUrlFormatado }))
  }

  const excluirAparelho = async (aparelhoId) => {
    if (currentUser?.role !== 'admin' || salvando || !machinesProntas) return
    const aparelho = aparelhos.find((item) => item.id === aparelhoId)
    if (!aparelho) return
    if (!window.confirm('Deseja realmente excluir este aparelho do catálogo global?')) return

    try {
      setSalvando(true)
      const perfil = await getDoc(doc(db, 'users', currentUser.id))
      if (currentUser?.role !== 'admin' || perfil.data()?.role !== 'admin') return
      await deleteDoc(doc(db, 'machines', aparelhoId))
      const restantes = aparelhos.filter((item) => item.id !== aparelhoId)
      await Promise.all(perfis.map((usuario) => runTransaction(db, async (transaction) => {
        const ref = doc(db, 'users', usuario.id, 'workout', 'current')
        const snapshot = await transaction.get(ref)
        if (snapshot.exists()) transaction.set(ref, limparTreino(snapshot.data(), restantes), { mergeFields: ['selecionados', 'series', 'concluidos', 'videos'] })
      })))
      setFotosAparelhos((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== aparelhoId)))
      setVideoAtivo(null)
    } catch {
      setErroPersistencia('Não foi possível excluir o aparelho. Verifique suas permissões no Firestore.')
    } finally {
      setSalvando(false)
    }
  }

  const limparCache = () => {
    if (window.confirm('Limpar apenas os vídeos salvos neste perfil?')) atualizarDados('videos', {})
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
    if (!machinesProntas || loadingDados || salvando) return
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

  const encerrarTreino = async () => {
    if (!currentUser || salvando || loadingDados || !machinesProntas || !dadosPerfis[currentUser.id]) return
    const exercicios = aparelhosSelecionados.map((nome) => {
      const aparelho = aparelhos.find((item) => item.name === nome)
      return { id: aparelho?.id, nome, series: Number(seriesConcluidas[nome] || 0), status: aparelhosConcluidos[nome] ? 'Concluído' : 'Não concluído' }
    })
    try {
      setSalvando(true)
      const lote = writeBatch(db)
      lote.set(doc(collection(db, 'users', currentUser.id, 'history')), {
        userId: currentUser.id,
        data: new Date().toISOString(),
        academia: academiaSelecionada,
        status: exercicios.every((item) => item.status === 'Concluído') ? 'Concluído' : 'Parcial',
        exercicios,
      })
      lote.set(doc(db, 'users', currentUser.id, 'workout', 'current'), { series: {}, concluidos: {} }, { mergeFields: ['series', 'concluidos'] })
      await lote.commit()
    } catch {
      setErroPersistencia('O histórico não foi salvo. O treino continua aberto para você tentar novamente.')
      return
    } finally {
      setSalvando(false)
    }
    setModoFoco(false)
    setTelaAtual('academias')
    setTelaFoco('atual')
    setAparelhoEmExecucao('')
    setDescansoAtivo(false)
    setDescansoSegundos(0)
  }

  const aparelhoEmFoco = catalogoDoPerfil.find((aparelho) => aparelho.name === aparelhoEmExecucao)
  const fotoEmFoco = aparelhoEmFoco ? fotosAparelhos[aparelhoEmFoco.id] : ''
  const formatarTempo = (segundos) => `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`

  const voltar = modoFoco
    ? () => {
      if (telaFoco === 'atual') sairDoFoco()
      else { setTelaFoco('atual'); setDescansoAtivo(false) }
    }
    : telaAtual !== 'academias' ? () => setTelaAtual('academias') : undefined
  const abrirHistorico = (tela) => {
    setDescansoAtivo(false)
    setModoFoco(false)
    setVideoAtivo(null)
    setHistoricos({})
    setTelaAtual(tela)
  }
  const barraPerfil = currentUser && <>
    <HeaderApp
    perfil={currentUser}
    onTrocar={trocarPerfil}
    isDarkMode={isDarkMode}
    onAlternarTema={() => setIsDarkMode((current) => !current)}
    onVoltar={voltar}
    telaAtual={modoFoco ? 'treino' : telaAtual}
    onHistorico={abrirHistorico}
    />
    {(loadingMachines || loadingDados || salvando) && <p role="status" className="mb-2 text-xs text-slate-500 dark:text-slate-300">{salvando ? 'Salvando…' : 'Carregando dados…'}</p>}
    {erroPersistencia && <p role="alert" className="mb-3 text-xs text-red-600 dark:text-red-300">{erroPersistencia}</p>}
  </>

  if (!currentUser) {
    return <TelaPerfis perfis={perfis} onSelecionar={escolherPerfil} onCadastrar={cadastrarPerfil} loading={loadingPerfis} salvando={salvando} erroPersistencia={erroPersistencia} />
  }

  if (modoFoco) {
    return (
      <>
        {telaFoco === 'atual' || !aparelhoEmFoco ? <TelaTreinoAtual
          barraPerfil={barraPerfil}
          aparelhosSelecionados={aparelhosSelecionados}
          aparelhosConcluidos={aparelhosConcluidos}
          onSelecionar={abrirExecucao}
          onEncerrar={encerrarTreino}
          salvando={salvando}
        /> : <TelaTreinoFoco
          barraPerfil={barraPerfil}
          aparelhoEmFoco={aparelhoEmFoco}
          fotoEmFoco={fotoEmFoco}
          descansoSegundos={descansoSegundos}
          descansoAtivo={descansoAtivo}
          seriesConcluidas={seriesConcluidas[aparelhoEmExecucao] || ''}
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
        <main className="max-w-lg mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative px-5 py-4 text-slate-900 dark:text-white">
          {barraPerfil}

          <div className="flex flex-1 flex-col">
            {telaAtual === 'historico' || (telaAtual === 'historico-geral' && currentUser.role === 'admin') ? (
              <TelaHistorico
                geral={telaAtual === 'historico-geral' && currentUser.role === 'admin'}
                perfis={perfisHistorico}
                dadosPerfis={Object.fromEntries(perfisHistorico.map((perfil) => [perfil.id, { historico: historicos[perfil.id] || [] }]))}
                loading={loadingHistorico}
                filtro={filtroHistorico}
                onFiltro={setFiltroHistorico}
              />
            ) : telaAtual === 'login' ? (
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
            <section className="flex flex-1 flex-col py-2">

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
              loading={loadingMachines || loadingDados || !machinesProntas}
              salvando={salvando}
              currentUser={currentUser}
              onExcluirAparelho={excluirAparelho}
              academiaSelecionada={academiaSelecionada}
              aparelhos={catalogoDoPerfil}
              aparelhosSelecionados={aparelhosSelecionados}
              fotosAparelhos={fotosAparelhos}
              avisoSelecao={avisoSelecao}
              novoAparelhoAberto={novoAparelhoAberto}
              nomeNovoAparelho={nomeNovoAparelho}
              fotoNovoAparelho={fotoNovoAparelho}
              videoNovoAparelho={videoNovoAparelho}
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

function TelaTreinoFoco({ barraPerfil, aparelhoEmFoco, fotoEmFoco, descansoSegundos, descansoAtivo, seriesConcluidas, onAjustarDescanso, onAlternarDescanso, onZerarDescanso, onSeriesChange, onConcluir, formatarTempo, onVerVideo }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0a142f] transition-colors duration-200">
      <main className="max-w-lg mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative px-5 py-4 text-slate-900 dark:text-white">
        {barraPerfil}

        <div className="mt-1 text-center">
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

function TelaTreinoAtual({ barraPerfil, aparelhosSelecionados, aparelhosConcluidos, onSelecionar, onEncerrar, salvando }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#0a142f] transition-colors duration-200">
      <main className="max-w-lg mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative px-5 py-4 text-slate-900 dark:text-white">
        {barraPerfil}
        <div className="mt-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1A3E95] dark:text-blue-300">Modo Foco</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Treino Atual</h1>
        </div>
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
        <button type="button" onClick={onEncerrar} disabled={salvando} className="mt-auto rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">Encerrar Treino</button>
    </main>
    </div>
  )
}

function TelaCatalogo({ loading, salvando, currentUser, onExcluirAparelho, academiaSelecionada, aparelhos, aparelhosSelecionados, fotosAparelhos, avisoSelecao, novoAparelhoAberto, nomeNovoAparelho, fotoNovoAparelho, videoNovoAparelho, onAlternarAparelho, onCapturarFoto, onStart, onAbrirNovo, onFecharNovo, onSalvarNovo, onNomeChange, onFotoNovo, onVideoChange, onVerVideo, onEditarVideo, onLimparCache }) {
  return (
    <section className="flex flex-1 flex-col pt-1 pb-28">
      <header className="mb-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1A3E95] dark:text-blue-300">Catálogo de aparelhos</p><h1 className="mt-1 text-2xl font-bold dark:text-white">Treino na {academiaSelecionada}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Escolha os exercícios para o seu treino de hoje.</p></div>
      </header>
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={onAbrirNovo} className="rounded-full bg-[#1A3E95] px-4 py-2.5 text-xs font-bold text-white shadow-md">+ Novo Aparelho</button>
      </div>
      <div className="space-y-3">
        {!loading && aparelhos.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-300">Nenhum aparelho cadastrado no catálogo global.</p>}
        {aparelhos.map((aparelho) => {
          const selecionado = aparelhosSelecionados.includes(aparelho.name)
          const videoUrl = aparelho.videoUrl || aparelho.video
          return <article key={aparelho.id} className={`relative flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm dark:bg-[#111f42] ${selecionado ? 'border-[#1A3E95] ring-2 ring-[#1A3E95]/20' : 'border-[#CCD5E1] dark:border-slate-600'}`}>
            {currentUser?.role === 'admin' && <button
              type="button"
              disabled={salvando || loading}
              aria-label={`Excluir aparelho ${aparelho.name}`}
              title={`Excluir aparelho ${aparelho.name}`}
              onClick={(event) => { event.stopPropagation(); onExcluirAparelho(aparelho.id) }}
              className="absolute right-1.5 top-1.5 text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
              </svg>
            </button>}
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
      <button type="button" onClick={onStart} disabled={loading || salvando} className="fixed bottom-0 left-1/2 z-10 w-full max-w-lg -translate-x-1/2 bg-[#1A3E95] px-5 py-4 text-sm font-bold text-white disabled:opacity-50">Start (Modo Foco){aparelhosSelecionados.length ? ` · ${aparelhosSelecionados.length} selecionado${aparelhosSelecionados.length > 1 ? 's' : ''}` : ''}</button>
      {novoAparelhoAberto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A142F]/60 px-5 backdrop-blur-sm"><form onSubmit={onSalvarNovo} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#111f42]"><h2 className="text-lg font-bold">Novo Aparelho</h2><label className="mt-4 block text-sm font-semibold">Nome do Aparelho<input required value={nomeNovoAparelho} onChange={(event) => onNomeChange(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:bg-[#0A142F]" /></label><label className="mt-4 inline-flex cursor-pointer rounded-xl border border-[#1A3E95] px-4 py-2.5 text-sm font-bold text-[#1A3E95]">{fotoNovoAparelho ? 'Trocar Foto' : 'Tirar Foto'}<input type="file" accept="image/*" capture="environment" onChange={onFotoNovo} className="sr-only" /></label><label className="mt-4 block text-sm font-semibold">Link do vídeo (opcional)<input type="url" value={videoNovoAparelho} onChange={(event) => onVideoChange(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:bg-[#0A142F]" /></label><div className="mt-6 flex gap-3"><button type="button" onClick={onFecharNovo} className="flex-1 rounded-xl border p-3 font-bold">Cancelar</button><button type="submit" className="flex-1 rounded-xl bg-[#1A3E95] p-3 font-bold text-white">Salvar Aparelho</button></div></form></div>}
    </section>
  )
}

function HeaderApp({ perfil, onTrocar, isDarkMode, onAlternarTema, onVoltar, telaAtual, onHistorico }) {
  const abas = [{ tela: 'historico', nome: 'Meu Histórico' }, ...(perfil.role === 'admin' ? [{ tela: 'historico-geral', nome: 'Histórico Geral' }] : [])]
  return <header className="mb-3 w-full max-w-lg border-b border-slate-200 pb-2 dark:border-slate-700" aria-label="Cabeçalho do aplicativo">
    <div className="flex h-9 items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span title={perfil.name} className="truncate text-sm font-bold">{perfil.name}</span>
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">{perfil.role === 'admin' ? 'Admin' : 'Usuário'}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onTrocar} title="Trocar usuário" className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 focus:ring-2 focus:ring-[#1A3E95] dark:text-slate-300 dark:hover:bg-slate-800">Trocar</button>
        <button type="button" onClick={onAlternarTema} aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'} title={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'} className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[#1A3E95] transition hover:bg-blue-50 focus:ring-2 focus:ring-[#1A3E95] dark:border-slate-700 dark:bg-slate-800 dark:text-blue-200">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {isDarkMode ? <><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></> : <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />}
          </svg>
        </button>
      </div>
    </div>
    <div className="mt-1 flex h-8 items-center justify-between gap-1">
      {onVoltar && <button type="button" onClick={onVoltar} className="shrink-0 whitespace-nowrap rounded-lg px-1 py-1.5 text-xs font-semibold text-[#1A3E95] hover:bg-blue-50 focus:ring-2 focus:ring-[#1A3E95] dark:text-blue-300 dark:hover:bg-slate-800">← Voltar</button>}
      <nav aria-label="Históricos" className="ml-auto inline-flex min-w-0 items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
        {abas.map((aba) => <button key={aba.tela} type="button" aria-pressed={telaAtual === aba.tela} onClick={() => onHistorico(aba.tela)} className={`whitespace-nowrap rounded-md px-2 py-1.5 text-[10px] font-semibold transition focus:ring-2 focus:ring-[#1A3E95] sm:text-xs ${telaAtual === aba.tela ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}`}>{aba.nome}</button>)}
      </nav>
    </div>
  </header>
}

function TelaPerfis({ perfis, onSelecionar, onCadastrar, loading, salvando, erroPersistencia }) {
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const salvar = async (event) => {
    event.preventDefault()
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) { setErro('Informe o nome do perfil.'); return }
    if (!await onCadastrar(nomeLimpo)) setErro('Não foi possível cadastrar. Verifique se o nome já existe ou tente novamente.')
  }
  return <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 dark:bg-[#0A142F] dark:text-white">
    <section className="mx-auto max-w-lg py-8">
      <img src="/logo.png" alt="Calazans" className="mx-auto mb-8 h-16 w-auto object-contain" />
      <h1 className="text-center text-2xl font-bold">Quem vai treinar hoje?</h1>
      {loading && <p role="status" className="mt-3 text-center text-xs text-slate-500 dark:text-slate-300">Carregando perfis…</p>}
      {erroPersistencia && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">{erroPersistencia}</p>}
      <div className="mt-8 space-y-3">{perfis.map((perfil) => <button key={perfil.id} type="button" onClick={() => onSelecionar(perfil)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-5 py-4 text-left hover:border-[#1A3E95] focus:ring-2 focus:ring-[#1A3E95] dark:border-slate-600 dark:bg-slate-900">
        <span className="break-words font-bold">{perfil.name}</span>{perfil.role === 'admin' && <span className="text-xs text-[#1A3E95] dark:text-blue-300">Administrador</span>}
      </button>)}</div>
      <form onSubmit={salvar} className="mt-8 border-t border-slate-300 pt-6 dark:border-slate-700">
        <label htmlFor="nome-perfil" className="mb-2 block text-sm font-semibold">Novo perfil</label>
        <input id="nome-perfil" required maxLength={60} value={nome} onChange={(event) => { setNome(event.target.value); setErro('') }} autoComplete="name" className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-900" />
        {erro && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{erro}</p>}
        <button type="submit" disabled={loading || salvando} className="mt-4 w-full rounded-lg bg-[#1A3E95] px-4 py-3 font-bold text-white hover:bg-[#15357E] disabled:opacity-50">{salvando ? 'Salvando…' : 'Cadastrar Perfil'}</button>
      </form>
    </section>
  </main>
}

function TelaHistorico({ geral, perfis, dadosPerfis, filtro, onFiltro, loading }) {
  const perfisVisiveis = geral && filtro !== 'todos' ? perfis.filter((perfil) => perfil.id === filtro) : perfis
  const registros = perfisVisiveis.flatMap((perfil) => (dadosPerfis[perfil.id]?.historico || []).map((treino) => ({ ...treino, perfil }))).sort((primeiro, segundo) => new Date(segundo.data) - new Date(primeiro.data))
  return <section className="flex-1 pt-1 pb-4">
    <h1 className="text-2xl font-bold">{geral ? 'Histórico Geral' : 'Meu Histórico'}</h1>
    {geral && <label className="mt-5 block text-sm font-semibold">Perfil<select value={filtro} onChange={(event) => onFiltro(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 dark:border-slate-600 dark:bg-slate-800">
      <option value="todos">Todos os usuários</option>{perfis.map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.name}</option>)}
    </select></label>}
    {loading ? <p role="status" className="mt-3 text-xs text-slate-500 dark:text-slate-300">Carregando histórico…</p> : registros.length === 0 && <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">Nenhum treino encerrado.</p>}
    <div className="mt-6 space-y-4">{registros.map((treino) => <article key={treino.id} className="rounded-lg border border-slate-300 p-4 dark:border-slate-600">
      {geral && <h2 className="font-bold">{treino.perfil.name}</h2>}
      <p className="text-sm"><time dateTime={treino.data}>{new Date(treino.data).toLocaleString('pt-BR')}</time></p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{treino.academia} · {treino.status}</p>
      <ul className="mt-3 space-y-2 text-sm">{treino.exercicios.map((exercicio, indice) => <li key={`${exercicio.id}-${indice}`} className="flex flex-wrap justify-between gap-1"><span>{exercicio.nome} · {exercicio.series} séries</span><span className={exercicio.status === 'Concluído' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-300'}>{exercicio.status}</span></li>)}</ul>
    </article>)}</div>
  </section>
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
