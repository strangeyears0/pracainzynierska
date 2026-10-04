# Scenariusze Testowe (Rozdział 5 Pracy Inżynierskiej)

Katalog zawiera gotowe skrypty testowe wykorzystywane do weryfikacji wydajności, odporności i bezprzerwowego wdrażania systemu rezerwacji w środowisku Amazon EKS.

---

## 🛠️ 1. Testy Obciążeniowe i Autoskalowania HPA (`load-test.js`)

Test wykorzystuje narzędzie **k6** do symulowania 100 równoległych użytkowników.

### Uruchomienie:
```bash
# Wykonanie testu obciążeniowego (wymagany k6)
k6 run tests/load-test.js -e TARGET_URL="http://<LOAD_BALANCER_IP_LUB_DNS>"
```

### Obserwacja automatycznego skalowania w K8s:
```bash
kubectl get hpa reservation-service-hpa --watch
kubectl get pods -l app=reservation-service --watch
```

---

## 💥 2. Test Odporności i Stanowości Bazy (`resilience-test.sh`)

Skrypt symuluje nagłą awarię poda bazy danych PostgreSQL (`postgres-0`) i sprawdza spójność danych po jego odtworzeniu z wolumenu Amazon EBS.

### Uruchomienie:
```bash
chmod +x tests/resilience-test.sh
./tests/resilience-test.sh
```
