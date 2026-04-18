#!/bin/bash
# Script para ejecutar sincronización WorldOffice
# Se ejecuta cada 12 horas via cron

# Cargar variables de entorno
export $(cat /app/backend/.env | xargs)
export $(cat /app/backend/.env.worldoffice | xargs)

# Activar entorno virtual si existe
if [ -f /root/.venv/bin/activate ]; then
    source /root/.venv/bin/activate
fi

# Ejecutar script de sincronización
cd /app/backend
python3 scripts/sync_worldoffice.py

# Resultado
if [ $? -eq 0 ]; then
    echo "✅ Sincronización completada exitosamente - $(date)"
else
    echo "❌ Error en sincronización - $(date)"
fi
