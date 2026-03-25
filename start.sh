#!/bin/bash
# 网络相册平台启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtual environment
source venv/bin/activate

# Start server
echo "🚀 启动网络相册平台..."
echo "📷 访问地址: http://localhost:8080"
echo "📖 API 文档: http://localhost:8080/docs"
echo ""
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
