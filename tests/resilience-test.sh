#!/bin/bash
echo "========================================================"
echo " Test Odporności Systemu (Resilience & Chaos Testing) "
echo "========================================================"

# 1. Tworzenie testowej rezerwacji
echo "[1] Tworzenie nowej rezerwacji testowej w bazie PostgreSQL..."
curl -s -X POST "http://localhost:8000/api/reservations" \
  -H "Content-Type: application/json" \
  -d '{
    "resource_id": "DESK-01",
    "user_name": "Test Chaos",
    "user_email": "chaos@test.pl",
    "start_time": "2026-10-04T14:00:00",
    "end_time": "2026-10-04T18:00:00"
  }' | grep "id"

# 2. Symulacja awarii: Usunięcie poda bazy PostgreSQL
echo -e "\n[2] Symulacja awarii: Awaryjne usunięcie poda postgres-0..."
kubectl delete pod postgres-0 --force --grace-period=0

# 3. Oczekiwanie na przywrócenie poda przez StatefulSet
echo -e "\n[3] Oczekiwanie na ponowne uruchomienie poda przez StatefulSet..."
kubectl rollout status statefulset/postgres --timeout=60s

# 4. Weryfikacja spójności danych po awarii
echo -e "\n[4] Weryfikacja czy dane rezerwacji przetrwały w bazie EBS:"
curl -s "http://localhost:8000/api/reservations?user_email=chaos@test.pl"
echo -e "\n========================================================"
