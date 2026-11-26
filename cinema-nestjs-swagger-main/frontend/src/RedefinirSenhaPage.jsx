import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { redefinirSenha } from './api'

// Página aberta pelo link do e-mail de recuperação: /redefinir-senha?token=...
const estilos = {
  pagina: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0c10' },
  cartao: { width: '100%', maxWidth: 400, padding: 40, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24 },
  titulo: { textAlign: 'center', marginBottom: 8, color: '#fff', fontSize: 24 },
  subtitulo: { textAlign: 'center', color: '#888', marginBottom: 32, fontSize: 14 },
  campo: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, color: '#aaa', fontSize: 13 },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 15, boxSizing: 'border-box', WebkitTextFillColor: '#fff' },
  erro: { color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  sucesso: { color: '#4cd98a', background: 'rgba(76,217,138,0.1)', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  botao: { width: '100%', padding: 14, borderRadius: 12, background: '#5c3ce6', border: 'none', color: '#fff', fontWeight: 700, fontSize: 16 },
  link: { display: 'block', textAlign: 'center', color: '#888', fontSize: 13, marginTop: 20 },
}

function RedefinirSenhaPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (novaSenha !== confirmacao) return setErro('As senhas não conferem.')

    setEnviando(true)
    try {
      await redefinirSenha(token, novaSenha)
      setConcluido(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={estilos.pagina}>
      <div style={estilos.cartao}>
        <h2 style={estilos.titulo}>🔑 Redefinir senha</h2>

        {!token ? (
          <p style={estilos.erro}>
            Link inválido. Peça um novo link de recuperação pelo app.
          </p>
        ) : concluido ? (
          <p style={estilos.sucesso}>
            Senha redefinida! Você já pode entrar com a nova senha.
          </p>
        ) : (
          <>
            <p style={estilos.subtitulo}>Escolha uma nova senha para sua conta</p>
            <form onSubmit={handleSubmit}>
              <div style={estilos.campo}>
                <label style={estilos.label}>Nova senha</label>
                <input
                  type="password" placeholder="Mínimo 6 caracteres" value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)} required autoFocus
                  style={estilos.input}
                />
              </div>
              <div style={estilos.campo}>
                <label style={estilos.label}>Confirmar nova senha</label>
                <input
                  type="password" placeholder="Repita a senha" value={confirmacao}
                  onChange={e => setConfirmacao(e.target.value)} required
                  style={estilos.input}
                />
              </div>
              {erro && <p style={estilos.erro}>{erro}</p>}
              <button
                type="submit" disabled={enviando}
                style={{ ...estilos.botao, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}
              >
                {enviando ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}

        <Link to="/" style={estilos.link}>Voltar para o cinema</Link>
      </div>
    </div>
  )
}

export default RedefinirSenhaPage
