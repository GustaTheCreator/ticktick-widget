#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
sleep 10  # aguarda rede e ambiente
nohup ./node_modules/.bin/electron . --no-sandbox > /dev/null 2>&1 &
disown
