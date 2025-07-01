#!/bin/bash
# .devcontainer/start.sh

# Iniciar backend
cd lora-backend
npm run dev &

# Iniciar frontend
cd ../lora-frontend
ng serve --host 0.0.0.0
