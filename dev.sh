#!/bin/bash

echo "🔍 Checking for processes using ports 3000 and 4000..."

# Kill processes on port 3000
PORT_3000_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PORT_3000_PID" ]; then
  echo "⚠️  Port 3000 is in use by PID $PORT_3000_PID. Killing..."
  kill -9 $PORT_3000_PID 2>/dev/null
  echo "✅ Port 3000 freed"
else
  echo "✅ Port 3000 is free"
fi

# Kill processes on port 4000
PORT_4000_PID=$(lsof -ti:4000 2>/dev/null)
if [ -n "$PORT_4000_PID" ]; then
  echo "⚠️  Port 4000 is in use by PID $PORT_4000_PID. Killing..."
  kill -9 $PORT_4000_PID 2>/dev/null
  echo "✅ Port 4000 freed"
else
  echo "✅ Port 4000 is free"
fi

echo ""
echo "🚀 Starting development servers..."
echo ""

pnpm run dev
