# 👑 Mundo da Luize e da Carmel

Jogo 3D de navegador para crianças: um reino de princesas para explorar, com moedas, corações,
pets, guarda-roupa e desafios de matemática, leitura, inglês e lógica.

## Como publicar no Railway

1. Suba esta pasta para um repositório no GitHub.
2. No Railway: **New Project → Deploy from GitHub repo** e escolha o repositório.
3. Não precisa configurar nada: o Railway detecta Node.js, roda `npm start` e usa a porta
   da variável `PORT` automaticamente.
4. Em **Settings → Networking → Generate Domain**, gere o endereço público.
   Se quiser, aponte um domínio seu em **Custom Domain**.

Pelo Railway CLI, dentro desta pasta:

```bash
railway login
railway init
railway up
railway domain
```

## Rodar no seu computador

```bash
npm start      # abre em http://localhost:3000
```

Não há dependências: o servidor usa só o Node puro.

## O que tem aqui

```
public/index.html            o jogo inteiro (um arquivo só)
public/manifest.webmanifest  faz o jogo virar aplicativo instalável
public/sw.js                 guarda o jogo no aparelho; funciona sem internet depois da 1ª visita
public/icon-192.png          ícone do aplicativo
public/icon-512.png
server.js                    servidor estático
railway.json                 configuração do deploy
```

## Instalar no celular (tela cheia, sem barra do navegador)

Com o endereço do Railway aberto no celular:

- **iPhone/iPad (Safari):** Compartilhar → **Adicionar à Tela de Início**
- **Android (Chrome):** ⋮ → **Adicionar à tela inicial** (ou **Instalar aplicativo**)

O jogo abre pelo ícone 👑 ocupando a tela toda.

## Progresso das crianças

O progresso (princesas, moedas, roupas, pets) fica salvo no próprio aparelho, no navegador.
Fora do claude.ai não há salvamento em nuvem, então cada aparelho guarda o seu progresso.

## Alterar o jogo

O código-fonte organizado em módulos está no pacote `mundo-das-princesas.zip`
(pasta `src/` e `build.py`). Depois de editar, rode `python3 build.py` e copie o
`index.html` gerado para `public/`.
