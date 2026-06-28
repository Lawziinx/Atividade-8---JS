#!/usr/bin/env node
'use strict';

/* ============================================================
 *  JOGO DA FORCA — Atividade #08 (WEB I · "JS: A Linguagem")
 *  Curso: Bacharelado em Sistemas de Informação (BSI)
 *  Autor: [SEU NOME COMPLETO AQUI]
 *
 *  Todo o código do projeto está concentrado neste único
 *  arquivo, conforme exigido pela atividade. As regras
 *  completas, o que cada bônus faz e as escolhas de design
 *  estão documentadas no README.md do repositório.
 * ============================================================ */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------
 * 1. CONFIGURAÇÕES E CONSTANTES GERAIS
 * ---------------------------------------------------------- */

const MAX_ERROS = 6;                 // vidas disponíveis por rodada
const PONTOS_POR_LETRA = 10;         // pontos por ocorrência de letra acertada
const PENALIDADE_ERRO = 8;           // pontos perdidos por palpite errado
const PENALIDADE_DICA = 20;          // pontos perdidos ao pedir a dica
const BONUS_RODADA_PERFEITA = 25;    // bônus por vencer sem nenhum erro
const TAMANHO_RANKING = 20;          // quantos registros o ranking guarda
const ARQUIVO_RANKING = path.join(__dirname, 'ranking.json');

const COR = {
  reset: '\x1b[0m',
  negrito: '\x1b[1m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  ciano: '\x1b[36m',
  magenta: '\x1b[35m',
  cinza: '\x1b[90m',
};

const pintar = (texto, cor) => `${cor}${texto}${COR.reset}`;
const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

/* ------------------------------------------------------------
 * 1.1 ENTRADA DE TERMINAL ROBUSTA
 *    O módulo `readline` emite o evento 'line' assim que uma
 *    linha chega, mesmo que ninguém esteja "ouvindo" naquele
 *    instante. Se várias respostas chegarem de uma só vez (por
 *    exemplo, coladas no terminal ou redirecionadas de um
 *    arquivo), perguntas feitas em sequência com `rl.question`
 *    podem perder linhas, porque o listener de uma pergunta só
 *    é registrado depois que a anterior é respondida.
 *
 *    Para o jogo nunca "comer" um palpite do jogador nessas
 *    situações, guardamos toda linha recebida em uma fila;
 *    `perguntar()` consome dessa fila se já houver algo nela,
 *    ou registra um interessado que será atendido assim que a
 *    próxima linha chegar.
 * ---------------------------------------------------------- */

function criarTerminal() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const linhasRecebidas = [];
  const consumidoresEmEspera = [];

  rl.on('line', (linha) => {
    const proximoConsumidor = consumidoresEmEspera.shift();
    if (proximoConsumidor) {
      proximoConsumidor(linha);
    } else {
      linhasRecebidas.push(linha);
    }
  });

  function perguntar(textoDoPrompt) {
    process.stdout.write(textoDoPrompt);
    return new Promise((resolve) => {
      if (linhasRecebidas.length > 0) {
        resolve(linhasRecebidas.shift());
      } else {
        consumidoresEmEspera.push(resolve);
      }
    });
  }

  function fechar() {
    rl.close();
  }

  return { perguntar, fechar };
}

/* ------------------------------------------------------------
 * 2. BANCO DE PALAVRAS — 4 categorias × 6 palavras (24 no total)
 *    Observação de design: as palavras são gravadas sem acento
 *    para simplificar a comparação dos palpites digitados no
 *    terminal. Essa escolha está explicada no README.
 * ---------------------------------------------------------- */

const BANCO_DE_PALAVRAS = {
  'Tecnologia': [
    { palavra: 'JAVASCRIPT', dica: 'Linguagem de programação que dá vida a este jogo' },
    { palavra: 'NAVEGADOR', dica: 'Programa usado para acessar sites' },
    { palavra: 'ALGORITMO', dica: 'Sequência lógica de passos para resolver um problema' },
    { palavra: 'SERVIDOR', dica: 'Máquina que fica ligada para hospedar sistemas' },
    { palavra: 'TECLADO', dica: 'Periférico usado para digitar cada palpite' },
    { palavra: 'PROCESSADOR', dica: 'Componente conhecido como o cérebro do computador' },
  ],
  'Mitologia Grega': [
    { palavra: 'ZEUS', dica: 'Deus do trovão e governante do Olimpo' },
    { palavra: 'MEDUSA', dica: 'Mulher com cobras no lugar dos cabelos' },
    { palavra: 'PEGASO', dica: 'Cavalo alado da mitologia' },
    { palavra: 'MINOTAURO', dica: 'Criatura com corpo de homem e cabeça de touro' },
    { palavra: 'CICLOPE', dica: 'Gigante que possui apenas um olho' },
    { palavra: 'HERCULES', dica: 'Herói conhecido pela força sobre-humana' },
  ],
  'Instrumentos Musicais': [
    { palavra: 'VIOLINO', dica: 'Instrumento de cordas tocado com um arco' },
    { palavra: 'BATERIA', dica: 'Conjunto de tambores e pratos' },
    { palavra: 'SAXOFONE', dica: 'Instrumento de sopro muito usado no jazz' },
    { palavra: 'TROMBONE', dica: 'Instrumento de sopro com uma vara deslizante' },
    { palavra: 'PANDEIRO', dica: 'Instrumento de percussão típico do samba' },
    { palavra: 'ACORDEAO', dica: 'Instrumento de sanfona muito usado no forró' },
  ],
  'Esportes Olímpicos': [
    { palavra: 'NATACAO', dica: 'Esporte disputado dentro da piscina' },
    { palavra: 'GINASTICA', dica: 'Esporte que envolve saltos, equilíbrio e flexibilidade' },
    { palavra: 'ATLETISMO', dica: 'Conjunto de provas de corrida, salto e lançamento' },
    { palavra: 'JUDO', dica: 'Arte marcial japonesa baseada em quedas e imobilizações' },
    { palavra: 'ESGRIMA', dica: 'Esporte de combate disputado com espadas' },
    { palavra: 'REMO', dica: 'Esporte praticado em barcos sobre a água' },
  ],
};

// evita repetir a mesma palavra duas vezes na mesma sessão (enquanto possível)
const palavrasJaSorteadas = new Set();

// um quadro do desenho para cada quantidade de erros, de 0 até MAX_ERROS
const DESENHOS_FORCA = [
`  +---+
  |   |
      |
      |
      |
      |
=========`,
`  +---+
  |   |
  O   |
      |
      |
      |
=========`,
`  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`,
];

const FRASES_VITORIA = [
  'Mandou bem demais!',
  'Reflexos de detetive de palavras!',
  'Essa você não deixou escapar!',
  'Show de bola!',
];

const FRASES_DERROTA = [
  'Não foi dessa vez...',
  'O boneco venceu essa rodada.',
  'Quase! Tenta a próxima.',
  'A forca foi mais rápida hoje.',
];

/* ------------------------------------------------------------
 * 3. FUNÇÕES UTILITÁRIAS SOBRE A PALAVRA
 * ---------------------------------------------------------- */

function sortearPalavra(nomeCategoria) {
  const lista = BANCO_DE_PALAVRAS[nomeCategoria];
  let disponiveis = lista.filter((item) => !palavrasJaSorteadas.has(item.palavra));

  // se a categoria já esgotou todas as palavras nesta sessão, reinicia o controle
  if (disponiveis.length === 0) {
    lista.forEach((item) => palavrasJaSorteadas.delete(item.palavra));
    disponiveis = lista;
  }

  const escolhida = sortear(disponiveis);
  palavrasJaSorteadas.add(escolhida.palavra);
  return escolhida;
}

function montarPalavraOculta(palavra, letrasDescobertas) {
  return palavra
    .split('')
    .map((letra) => (letrasDescobertas.has(letra) ? letra : '_'))
    .join(' ');
}

function palavraFoiDescoberta(palavra, letrasDescobertas) {
  return palavra.split('').every((letra) => letrasDescobertas.has(letra));
}

function contarOcorrencias(palavra, letra) {
  return palavra.split('').filter((l) => l === letra).length;
}

/* ------------------------------------------------------------
 * 4. RANKING — persistido em ranking.json (bônus implementado)
 * ---------------------------------------------------------- */

function carregarRanking() {
  try {
    const conteudo = fs.readFileSync(ARQUIVO_RANKING, 'utf-8');
    return JSON.parse(conteudo);
  } catch {
    return [];
  }
}

function salvarNoRanking(nome, pontuacao) {
  const ranking = carregarRanking();
  ranking.push({ nome, pontuacao, em: new Date().toLocaleString('pt-BR') });
  ranking.sort((a, b) => b.pontuacao - a.pontuacao);
  const topRanking = ranking.slice(0, TAMANHO_RANKING);
  fs.writeFileSync(ARQUIVO_RANKING, JSON.stringify(topRanking, null, 2));
}

function exibirRanking() {
  const ranking = carregarRanking();
  console.log(pintar('\n🏆 RANKING DOS MELHORES JOGADORES 🏆', COR.amarelo + COR.negrito));
  if (ranking.length === 0) {
    console.log(pintar('Ainda não há pontuações registradas. Jogue uma partida!', COR.cinza));
    return;
  }
  ranking.forEach((registro, indice) => {
    const posicao = String(indice + 1).padStart(2, '0');
    console.log(
      `${posicao}. ${registro.nome.padEnd(20)} ${String(registro.pontuacao).padStart(5)} pts  (${registro.em})`
    );
  });
}

/* ------------------------------------------------------------
 * 5. EXIBIÇÃO DO ESTADO DO JOGO NO TERMINAL
 * ---------------------------------------------------------- */

function exibirBanner() {
  console.log(pintar(
`
╔══════════════════════════════════════════╗
║           J O G O   D A   F O R C A       ║
║         versão terminal · BSI / WEB I      ║
╚══════════════════════════════════════════╝`,
    COR.ciano + COR.negrito,
  ));
}

function exibirEstadoDaRodada(estado) {
  const { palavra, letrasDescobertas, letrasErradas, erros, jogadores, turno, categoria } = estado;
  const todasTentadas = [...letrasDescobertas, ...letrasErradas].sort();

  console.log('\n' + '═'.repeat(46));
  console.log(pintar(`Categoria: ${categoria}`, COR.magenta));
  console.log(DESENHOS_FORCA[erros]);
  console.log('\nPalavra: ' + pintar(montarPalavraOculta(palavra, letrasDescobertas), COR.negrito));
  console.log('Letras tentadas: ' + (todasTentadas.length ? todasTentadas.join(', ') : '(nenhuma ainda)'));
  console.log('  └─ erradas: ' + (letrasErradas.size ? [...letrasErradas].join(', ') : 'nenhuma'));
  console.log(`Tentativas restantes: ${MAX_ERROS - erros} de ${MAX_ERROS}`);
  if (jogadores.length > 1) {
    console.log(pintar(`Vez de: ${jogadores[turno].nome}`, COR.verde));
  }
}

function exibirResultadoDaRodada(estado, venceu, palavra) {
  console.log('\n' + '─'.repeat(46));
  if (venceu) {
    console.log(pintar(`✅ Resultado: VITÓRIA — ${sortear(FRASES_VITORIA)}`, COR.verde + COR.negrito));
  } else {
    console.log(pintar(`❌ Resultado: DERROTA — ${sortear(FRASES_DERROTA)}`, COR.vermelho + COR.negrito));
  }
  console.log(`Palavra correta: ${pintar(palavra, COR.negrito)}`);
  estado.jogadores.forEach((j) => {
    console.log(`  ${j.nome.padEnd(20)} pontuação na rodada: ${j.pontuacaoRodada} pts`);
  });
  console.log('─'.repeat(46) + '\n');
}

/* ------------------------------------------------------------
 * 6. ESCOLHA DE CATEGORIA (jogador escolhe ou o jogo sorteia)
 * ---------------------------------------------------------- */

async function escolherCategoria(term) {
  const nomes = Object.keys(BANCO_DE_PALAVRAS);
  console.log(pintar('\nCategorias disponíveis:', COR.ciano));
  nomes.forEach((nome, indice) => console.log(`  ${indice + 1}. ${nome}`));
  console.log('  0. Sortear categoria automaticamente');

  const resposta = (await term.perguntar('Escolha uma categoria: ')).trim();

  if (resposta === '0') {
    return sortear(nomes);
  }
  const indiceEscolhido = parseInt(resposta, 10);
  if (!isNaN(indiceEscolhido) && indiceEscolhido >= 1 && indiceEscolhido <= nomes.length) {
    return nomes[indiceEscolhido - 1];
  }
  console.log(pintar('Opção inválida — sorteando uma categoria para você.', COR.amarelo));
  return sortear(nomes);
}

/* ------------------------------------------------------------
 * 7. MOTOR DE UMA RODADA
 *    Funciona tanto para 1 quanto para 2 jogadores: no modo de
 *    1 jogador o array "jogadores" tem um único elemento e os
 *    turnos simplesmente não alternam. No modo de 2 jogadores,
 *    as vidas (tentativas) são COMPARTILHADAS, mas a pontuação
 *    é INDIVIDUAL — essa é a regra própria do bônus "Modo 2
 *    jogadores" (ver README).
 * ---------------------------------------------------------- */

async function jogarRodada(term, jogadores) {
  const categoria = await escolherCategoria(term);
  const { palavra, dica } = sortearPalavra(categoria);

  jogadores.forEach((j) => { j.pontuacaoRodada = 0; });

  const estado = {
    palavra,
    categoria,
    letrasDescobertas: new Set(),
    letrasErradas: new Set(),
    erros: 0,
    jogadores,
    turno: 0,
    dicaUsada: false,
  };

  while (estado.erros < MAX_ERROS && !palavraFoiDescoberta(palavra, estado.letrasDescobertas)) {
    exibirEstadoDaRodada(estado);
    const jogadorAtual = estado.jogadores[estado.turno];
    const prompt = jogadores.length > 1
      ? `${jogadorAtual.nome}, digite uma letra (ou DICA): `
      : 'Digite uma letra (ou DICA): ';

    const entrada = (await term.perguntar(prompt)).trim().toUpperCase();

    if (entrada === 'DICA') {
      if (estado.dicaUsada) {
        console.log(pintar('A dica desta rodada já foi utilizada.', COR.amarelo));
        continue; // não consome a vez
      }
      console.log(pintar(`💡 Dica: ${dica}`, COR.amarelo));
      jogadorAtual.pontuacaoRodada -= PENALIDADE_DICA;
      estado.dicaUsada = true;
      estado.turno = (estado.turno + 1) % jogadores.length;
      continue;
    }

    const ehLetraValida = /^[A-Z]$/.test(entrada);
    if (!ehLetraValida) {
      console.log(pintar('Digite apenas uma letra de A a Z (ou DICA).', COR.vermelho));
      continue; // não consome a vez
    }
    if (estado.letrasDescobertas.has(entrada) || estado.letrasErradas.has(entrada)) {
      console.log(pintar('Essa letra já foi tentada nesta rodada.', COR.vermelho));
      continue; // não consome a vez
    }

    if (palavra.includes(entrada)) {
      estado.letrasDescobertas.add(entrada);
      const ocorrencias = contarOcorrencias(palavra, entrada);
      jogadorAtual.pontuacaoRodada += ocorrencias * PONTOS_POR_LETRA;
      console.log(pintar(`Acertou! "${entrada}" aparece ${ocorrencias}x na palavra.`, COR.verde));
    } else {
      estado.letrasErradas.add(entrada);
      estado.erros += 1;
      jogadorAtual.pontuacaoRodada -= PENALIDADE_ERRO;
      console.log(pintar(`A letra "${entrada}" não está na palavra.`, COR.vermelho));
    }
    estado.turno = (estado.turno + 1) % jogadores.length;
  }

  const venceu = palavraFoiDescoberta(palavra, estado.letrasDescobertas);

  if (venceu && estado.erros === 0) {
    const bonusPorJogador = Math.floor(BONUS_RODADA_PERFEITA / jogadores.length);
    jogadores.forEach((j) => { j.pontuacaoRodada += bonusPorJogador; });
  }

  jogadores.forEach((j) => {
    j.pontuacaoRodada = Math.max(0, j.pontuacaoRodada);
    j.pontuacaoTotal += j.pontuacaoRodada;
  });

  exibirResultadoDaRodada(estado, venceu, palavra);
  return venceu;
}

/* ------------------------------------------------------------
 * 8. SESSÃO DE JOGO (1 ou 2 jogadores, várias rodadas)
 * ---------------------------------------------------------- */

async function coletarNomes(term, quantidade) {
  const jogadores = [];
  for (let i = 1; i <= quantidade; i++) {
    let nome = '';
    while (!nome) {
      nome = (await term.perguntar(`Nome do jogador ${i}: `)).trim();
      if (!nome) console.log(pintar('O nome não pode ficar em branco.', COR.vermelho));
    }
    jogadores.push({ nome, pontuacaoTotal: 0 });
  }
  return jogadores;
}

async function iniciarSessao(term, quantidadeJogadores) {
  console.log(pintar(
    quantidadeJogadores === 2
      ? '\n👥 Modo 2 jogadores — vidas compartilhadas, pontuação individual.'
      : '\n👤 Modo 1 jogador.',
    COR.ciano,
  ));

  const jogadores = await coletarNomes(term, quantidadeJogadores);

  let continuarJogando = true;
  while (continuarJogando) {
    await jogarRodada(term, jogadores);
    const resposta = (await term.perguntar('Jogar outra rodada? (s/n): ')).trim().toLowerCase();
    continuarJogando = resposta.startsWith('s');
  }

  jogadores.forEach((j) => salvarNoRanking(j.nome, j.pontuacaoTotal));

  console.log(pintar('\nResumo final da partida:', COR.amarelo + COR.negrito));
  jogadores.forEach((j) => console.log(`  ${j.nome.padEnd(20)} total: ${j.pontuacaoTotal} pts`));
  exibirRanking();
}

/* ------------------------------------------------------------
 * 9. MENU PRINCIPAL
 * ---------------------------------------------------------- */

async function exibirMenuPrincipal(term) {
  console.log(pintar('\nMENU PRINCIPAL', COR.negrito));
  console.log('  1. Jogar (1 jogador)');
  console.log('  2. Jogar (2 jogadores)');
  console.log('  3. Ver ranking');
  console.log('  4. Sair');
  return (await term.perguntar('Escolha uma opção: ')).trim();
}

async function main() {
  const term = criarTerminal();
  try {
    exibirBanner();
    let executando = true;
    while (executando) {
      const opcao = await exibirMenuPrincipal(term);
      switch (opcao) {
        case '1': await iniciarSessao(term, 1); break;
        case '2': await iniciarSessao(term, 2); break;
        case '3': exibirRanking(); break;
        case '4': executando = false; break;
        default: console.log(pintar('Opção inválida, tente novamente.', COR.vermelho));
      }
    }
    console.log(pintar('\nAté a próxima partida! 👋\n', COR.ciano));
  } finally {
    term.fechar();
  }
}

main();
