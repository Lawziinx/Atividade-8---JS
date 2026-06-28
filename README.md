# 🪢 Jogo da Forca — Atividade #08 (WEB I)

**Aluno(a):** Iarley Oliveira de Jesus
**Curso:** Bacharelado em Sistemas de Informação (BSI)
**Disciplina:** WEB I — "JS: A Linguagem"

Jogo da Forca em **JavaScript puro** (zero dependências externas), executado inteiramente pelo terminal com **Node.js**.

---

## 📜 Regras do jogo

1. Ao iniciar, você escolhe jogar **sozinho** ou **em dupla** e informa o(s) nome(s) do(s) jogador(es).
2. Em cada rodada, você escolhe uma **categoria** de palavras (ou pede para o jogo sortear uma).
3. O jogo sorteia uma palavra secreta dessa categoria e mostra quantas letras ela tem.
4. A cada jogada, você digita **uma letra**:
   - Se a letra existir na palavra, todas as posições em que ela aparece são reveladas.
   - Se não existir, você perde uma tentativa (o boneco da forca ganha uma parte) e a letra entra na lista de erradas.
5. Você tem **6 tentativas** (erros) no total por rodada.
6. **Vitória:** todas as letras da palavra são descobertas antes de esgotar as 6 tentativas.
7. **Derrota:** as 6 tentativas se esgotam antes da palavra ser completada — a palavra correta é revelada.
8. Ao final de cada rodada, o jogo mostra: nome do(s) jogador(es), resultado (vitória/derrota), a palavra correta e a pontuação obtida, e pergunta se você quer jogar outra rodada.
9. Quando você decide parar, a pontuação total da partida (soma de todas as rodadas) é salva no ranking.

### Como pontuar

| Evento | Efeito na pontuação |
|---|---|
| Acertar uma letra | `+10 pontos × número de vezes que a letra aparece na palavra` |
| Errar uma letra | `-8 pontos` |
| Usar a dica (1x por rodada) | `-20 pontos` |
| Vencer a rodada sem nenhum erro | `+25 pontos` (bônus de rodada perfeita) |

A pontuação de uma rodada nunca fica negativa (o mínimo é 0).

---

## 🎮 Como jogar

```
node forca.js
# ou, depois de configurado:
npm start
```

No menu principal, escolha uma opção digitando o número correspondente:

```
MENU PRINCIPAL
  1. Jogar (1 jogador)
  2. Jogar (2 jogadores)
  3. Ver ranking
  4. Sair
```

Durante uma rodada:
- Digite uma única letra (A–Z) e pressione Enter para tentar.
- Digite `DICA` para receber uma pista sobre a palavra (penaliza a pontuação e só pode ser usada uma vez por rodada).
- Ao final da rodada, responda `s` ou `n` quando perguntado se quer jogar outra.

---

## ▶️ Como executar

Pré-requisitos: **Node.js 18 ou superior** (o projeto usa apenas módulos nativos do Node, sem dependências externas).

```bash
git clone <link-do-seu-repositorio>
cd jogo-da-forca-bsi
npm start
```

> `npm install` não é necessário porque o projeto não possui dependências de terceiros, mas pode ser executado sem problemas.

---

## 🧩 Personalizações e variações implementadas

A atividade deixou propositalmente algumas decisões em aberto. Esta versão resolveu cada uma delas assim:

- **Categorias escolhidas:** em vez de usar exatamente os exemplos do enunciado, o banco de palavras traz *Tecnologia*, *Mitologia Grega*, *Instrumentos Musicais* e *Esportes Olímpicos* (4 categorias, 24 palavras no total — acima do mínimo de 3 categorias / 20 palavras).
- **Palavras sem acento:** as palavras são gravadas em letras maiúsculas sem acentuação (ex.: `ACORDEAO`, `NATACAO`) para simplificar a comparação dos palpites digitados no terminal, evitando bugs com normalização de caracteres especiais.
- **Sorteio sem repetição:** dentro da mesma sessão, o jogo evita sortear a mesma palavra duas vezes em uma categoria até que todas as outras já tenham aparecido.
- **Pontuação por letra (e não só por rodada):** cada letra acertada vale pontos proporcionais ao número de vezes que ela aparece na palavra, recompensando palavras com letras repetidas.
- **Boneco da forca desenhado em ASCII**, que cresce a cada erro, além do contador numérico de tentativas restantes — as duas formas de visualizar o "erro" pedidas no enunciado.
- **Leitura de terminal sem perda de linhas:** ao contrário do padrão mais comum (`readline/promises` perguntando uma linha por vez), este projeto usa uma fila manual sobre o módulo `readline` para garantir que nenhuma resposta seja perdida mesmo se o jogador colar várias respostas de uma vez ou digitar muito rápido.

---

## 🏆 Bônus implementados

### 💡 Sistema de Dicas
Cada palavra do banco tem uma dica associada. Durante a rodada, o jogador pode digitar `DICA` no lugar de uma letra para receber essa pista.
**Penalidade escolhida:** usar a dica **reduz 20 pontos da pontuação final da rodada** (não consome uma tentativa). A dica só pode ser usada **uma vez por rodada**.

### 🏅 Ranking dos melhores jogadores
Ao final de cada partida (quando o jogador decide não jogar outra rodada), o nome e a pontuação total são salvos no arquivo `ranking.json`, na mesma pasta do projeto. O ranking é ordenado da maior para a menor pontuação e exibido automaticamente ao final da partida, além de poder ser consultado a qualquer momento pelo menu principal (opção 3). O arquivo é criado automaticamente na primeira vez que alguém termina uma partida.

### 👥 Modo 2 jogadores
Regras próprias implementadas para este modo:
- As **vidas (tentativas) são compartilhadas**: os dois jogadores torcem pela mesma palavra e qualquer erro de qualquer um deles consome uma das 6 tentativas do time.
- A **pontuação é individual**: cada jogador soma pontos apenas pelas letras que ele mesmo acertou (ou perde pontos pelos erros e dicas que ele mesmo usou).
- Os jogadores se **alternam a cada jogada válida** (acerto, erro ou uso de dica). Entradas inválidas ou letras repetidas não passam a vez.
- Se a palavra for descoberta com 0 erros, o bônus de rodada perfeita é dividido igualmente entre os dois jogadores.

---

## 📁 Estrutura de arquivos

```
.
├── forca.js        # todo o código do jogo (único arquivo .js do projeto)
├── package.json     # script "npm start"
├── ranking.json      # gerado automaticamente após a primeira partida
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🙏 Créditos — fontes de referência utilizadas

- [Documentação oficial do Node.js](https://nodejs.org/docs/latest/api/) — módulos `readline`, `fs` e `path`.
- [MDN Web Docs](https://developer.mozilla.org/pt-BR/) — referência da linguagem JavaScript (strings, `Set`, métodos de array, etc.).
- Material da disciplina **WEB I — JS: A Linguagem** (atividade #08), que definiu os requisitos mínimos do jogo.
- Banco de palavras, dicas, desenhos ASCII do boneco da forca e lógica de pontuação são de autoria própria.

---

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** — veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
