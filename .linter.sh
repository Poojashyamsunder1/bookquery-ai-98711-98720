#!/bin/bash
cd /home/kavia/workspace/code-generation/bookquery-ai-98711-98720/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

