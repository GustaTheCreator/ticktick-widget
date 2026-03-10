# ticktick-widget

Widget desktop para o TickTick, feito com Electron. Mostra as tarefas da inbox e de todos os projetos, com suporte a criar, completar e apagar.

## Requisitos

- Node.js
- Uma conta TickTick com um token OAuth (`open/v1`)

## Instalação

```bash
npm install
```

Criar o ficheiro `.env` na raiz do projeto:

```
API_TOKEN=o_teu_token_aqui
```

## Uso

```bash
bash launch.sh
```

## Configuração

Editar [settings.json](settings.json):

- `transparency`: opacidade do fundo (0 a 1)
- `width`: largura da janela
- `height`: altura da janela
- `syncIntervalMs`: intervalo de sincronização em milissegundos (mínimo 5000)
- `alwaysOnTop`: mantém o widget sempre por cima (`true`/`false`)
- `startupDelayMs`: atraso antes de mostrar a janela (ms)
- `defaultX` e `defaultY`: posição inicial da janela (usado quando não existe posição guardada)

## Autostart (Linux)

O ficheiro `~/.config/autostart/ticktick-widget.desktop` aponta para `launch.sh`. Editar manualmente se necessário.

## Notas

- O token nunca deve ser commitado. O `.gitignore` já exclui `.env`.
- O Electron requer `--no-sandbox` neste ambiente (ver `launch.sh`).
