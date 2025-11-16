#!/bin/bash

# Script de prueba rápida de validaciones y rate limiting
# Uso: ./test-robustez.sh

BASE_URL="http://localhost:3000"
TOKEN="tu-token-aqui"  # Actualiza con un token válido

echo "🧪 Testing validaciones Zod..."
echo ""

# 1. Test validación cliente (email inválido)
echo "1️⃣ POST /api/clientes con email inválido (debe retornar 400):"
curl -s -X POST "$BASE_URL/api/clientes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Test","email":"invalid","telefono":"123456789"}' | jq .

echo ""
echo "---"
echo ""

# 2. Test validación membresía (precio negativo)
echo "2️⃣ POST /api/membresias con precio negativo (debe retornar 400):"
curl -s -X POST "$BASE_URL/api/membresias" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Test","tipo":"mensual","modalidad":"libre","precio":-100,"duracion":30}' | jq .

echo ""
echo "---"
echo ""

# 3. Test validación asistencia (cliente_id inválido)
echo "3️⃣ POST /api/asistencias con cliente_id no-UUID (debe retornar 400):"
curl -s -X POST "$BASE_URL/api/asistencias" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cliente_id":"not-a-uuid"}' | jq .

echo ""
echo "---"
echo ""

# 4. Test rate limiting (100 requests rápidos)
echo "4️⃣ Rate limiting - enviando 105 requests..."
BLOCKED=0
for i in {1..105}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/clientes" \
    -H "Authorization: Bearer $TOKEN")
  if [ "$STATUS" == "429" ]; then
    ((BLOCKED++))
  fi
done

echo "✅ Requests bloqueados (429): $BLOCKED"
if [ "$BLOCKED" -gt 0 ]; then
  echo "✅ Rate limiting funcionando correctamente"
else
  echo "⚠️  No se detectó rate limiting (verifica UPSTASH_REDIS_REST_URL en .env)"
fi

echo ""
echo "🎉 Tests completados"
