# Valdoria · Guerra de Cartas

Jogo de cartas e batalha em tempo real que roda no navegador (HTML + JavaScript), com modo contra a máquina e **multiplayer online** (código de sala ou busca de oponente).

## Como salvar no GitHub

Extraia o conteúdo deste pacote **na raiz do repositório**, mantendo as pastas exatamente assim:

```
/                          (raiz do repositório)
├── index.html             página do jogo
├── .nojekyll              (arquivo vazio; evita o processamento do Jekyll no GitHub Pages)
├── LEIA-ME.md             este arquivo
├── css/
│   └── style.css          estilos
├── js/
│   ├── logic.js           regras, cartas, mapas, simulação, IA e sincronização do multiplayer
│   ├── sprites.js         carrega e desenha os sprites (personagens, construções, cenário)
│   ├── net.js             rede: sala por código e busca de oponente (PeerJS / WebRTC)
│   ├── scenery.js         monta o fundo da partida com os sprites de cenário
│   ├── ui-core.js         utilitários, memória dos decks, avisos e troca de telas
│   ├── ui-home.js         tela inicial
│   ├── ui-editor.js       editor de decks
│   ├── ui-menu.js         menu de batalha (máquina / online)
│   ├── ui-battle.js       partida: painel de cartas, entrada e laço de atualização
│   ├── render.js          desenho da partida e efeitos (feitiços, impactos, explosões)
│   └── main.js            tela cheia e inicialização
├── assets/
│   └── sprites/
│       ├── manifest.json  índice de todos os sprites (quadros, âncoras, animações)
│       ├── units/         tropas: <nome>.webp + <nome>.mask.webp (máscara da cor da equipe)
│       ├── structs/       construções e castelo (idem)
│       ├── cards/         retratos das cartas
│       └── scenery/       texturas e decorações de cada mapa
└── tools/                 (opcional) gerador dos sprites
    ├── gerar.js
    ├── gen.html
    ├── gen.js
    └── art-src.js
```

Pelo site do GitHub: **Add file › Upload files**, arraste **o conteúdo** da pasta extraída (as pastas `css`, `js`, `assets`, `tools` e os arquivos soltos) e faça o commit. Pelo terminal:

```bash
git add .
git commit -m "Valdoria: sprites, multiplayer e arquivos separados"
git push
```

Em **Settings › Pages**, use a branch principal e a pasta `/ (root)`. O endereço publicado abre o `index.html`.

## Atualizando

* Mudou um arquivo `.js` ou o `.css`? Aumente o número `?v=1` na tag correspondente do `index.html` para o navegador não usar a versão antiga em cache.
* Trocou imagens em `assets/sprites`? Aumente `VER` no início de `js/sprites.js`.

## Testar no computador

Abrir o `index.html` direto do disco **não funciona** (o navegador bloqueia a leitura do `manifest.json`). Use um servidor local:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Regenerar os sprites (opcional)

Os sprites já vêm prontos. Para alterar o desenho e gerar de novo:

```bash
npm i playwright
npx playwright install chromium
node tools/gerar.js
```

O gerador desenha cada personagem em vários quadros (andar, atacar, parado; de frente, de costas e de lado), aplica luz de borda e sombra, separa a cor da equipe numa máscara e grava tudo em `assets/sprites`.

## Multiplayer

A conexão é direta entre os dois aparelhos (WebRTC) usando o serviço gratuito do PeerJS, carregado de um CDN. Em redes muito restritas pode não conectar. Não há proteção contra trapaça.
