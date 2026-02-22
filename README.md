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

## Autostart (Linux)

O ficheiro `~/.config/autostart/ticktick-widget.desktop` aponta para `launch.sh`. Editar manualmente se necessário.

## Notas

- O token nunca deve ser commitado. O `.gitignore` já exclui `.env`.
- O Electron requer `--no-sandbox` neste ambiente (ver `launch.sh`).
