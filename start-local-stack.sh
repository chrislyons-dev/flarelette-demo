#!/bin/bash
# Start all flarelette-demo services in separate terminal windows
# Each service runs on its own port without service bindings for local dev

echo "Starting flarelette-demo local development stack..."
echo ""

# Detect terminal emulator
if command -v gnome-terminal &> /dev/null; then
  TERM_CMD="gnome-terminal --"
elif command -v xterm &> /dev/null; then
  TERM_CMD="xterm -e"
elif command -v konsole &> /dev/null; then
  TERM_CMD="konsole -e"
else
  echo "No supported terminal emulator found. Please install gnome-terminal, xterm, or konsole."
  exit 1
fi

# 1. Content Service (port 8788)
$TERM_CMD bash -c "cd workers/content-service && echo 'Content Service starting on port 8788...' && npm run dev -- --port 8788; exec bash" &
sleep 2

# 2. Forms Service (port 8789)
$TERM_CMD bash -c "cd workers/forms-service && echo 'Forms Service starting on port 8789...' && npm run dev -- --port 8789; exec bash" &
sleep 2

# 3. Image Service (port 8790)
$TERM_CMD bash -c "cd workers/image-service && echo 'Image Service starting on port 8790...' && npm run dev -- --port 8790; exec bash" &
sleep 2

# 4. Gateway (port 8787)
$TERM_CMD bash -c "cd workers/gateway && echo 'Gateway starting on port 8787...' && npm run dev -- --port 8787; exec bash" &
sleep 2

# 5. UI (port 4321)
$TERM_CMD bash -c "cd ui && echo 'UI starting on port 4321...' && npm run dev; exec bash" &

echo ""
echo "Local Development Stack Started!"
echo ""
echo "Services:"
echo "  Content Service  -> http://localhost:8788"
echo "  Forms Service    -> http://localhost:8789"
echo "  Image Service    -> http://localhost:8790"
echo "  Gateway          -> http://localhost:8787"
echo "  UI               -> http://localhost:4321"
echo ""
echo "Gateway will proxy to services via HTTP instead of service bindings"
echo ""
