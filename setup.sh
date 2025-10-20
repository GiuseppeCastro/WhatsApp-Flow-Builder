#!/bin/bash

echo "🚀 WhatsApp Flow Builder - Setup Script"
echo "========================================"
echo ""

# Check for pnpm
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm found"
    PM="pnpm"
elif command -v npm &> /dev/null; then
    echo "⚠️  pnpm not found, using npm"
    PM="npm"
else
    echo "❌ Neither pnpm nor npm found. Please install Node.js first."
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
$PM install

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Copy backend/.env.example to backend/.env (optional)"
echo "  2. Copy frontend/.env.local.example to frontend/.env.local (optional)"
echo "  3. Run: $PM dev"
echo ""
echo "🌐 The app will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
