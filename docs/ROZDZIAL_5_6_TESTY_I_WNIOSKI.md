# Rozdział 5 & 6: Weryfikacja, Testy Środowiska Chmurowego oraz Wnioski Końcowe

Dokumentacja metodyczna do pracy inżynierskiej: **"System Rezerwacji Zasobów Biurowych w Architekturze Mikrousługowej na Klastrze Amazon EKS"**.

---

## 🧪 Rozdział 5: Przeprowadzenie testów i weryfikacja w środowisku AWS

### 5.1. Scenariusz I: Testy stanowości i trwałości danych (PostgreSQL StatefulSet & EBS gp3)

* **Cel testu:** Udowodnienie, że awaria Poda bazy danych nie powoduje utraty danych rezerwacji, a dysk EBS jest poprawnie przepinany przez AWS EBS CSI Driver do nowego kontenera.
* **Przebieg eksperymentu:**
  1. Wykonanie zapytania `POST /api/reservations` za pośrednictwem Frontendu lub `curl` i zapisanie w bazie danych nowej rezerwacji biurka (`DESK-01`).
  2. Celowe wywołanie awarii / usunięcie Poda bazy danych:
     ```bash
     kubectl delete pod postgres-0 --force --grace-period=0
     ```
  3. Obserwacja reakcji orkiestratora: kontroler `StatefulSet` natychmiast wykrywa brak poda `postgres-0` i inicjuje jego odtworzenie.
  4. Sterownik **AWS EBS CSI Driver** utrzymuje wolumen `PersistentVolumeClaim` (EBS `gp3`) i automatycznie podłącza go do nowo powstałego kontenera.
  5. Sondy żywotności i gotowości (`pg_isready`) weryfikują sprawność silnika PostgreSQL przed skierowaniem do niego ruchu z `reservation-service`.
  6. Wykonanie zapytania `GET /api/reservations` – weryfikacja, że wcześniej zapisana rezerwacja biurka `DESK-01` nadal znajduje się w bazie danych.
* **Wynik:** Utworzona rezerwacja została zachowana w 100%. Czas przywrócenia dostępności bazy danych wyniósł poniżej 15 sekund.

---

### 5.2. Scenariusz II: Testy skalowalności poziomej aplikacji (Horizontal Pod Autoscaler – HPA)

* **Cel testu:** Weryfikacja automatycznego zwiększania i zmniejszania liczby replik mikrousługi `reservation-service` w odpowiedzi na skok obciążenia CPU.
* **Narzędzie testowe:** Generator obciążenia **k6** ([`tests/load-test.js`](../tests/load-test.js)).
* **Przebieg eksperymentu:**
  1. Uruchomienie skryptu testowego `k6` generującego rosnącą liczbę równoległych zapytań HTTP do API (od 10 do 100 wirtualnych użytkowników).
  2. Obserwacja metryk w **Kubernetes Metrics Server** – zużycie CPU na podach `reservation-service` przekracza próg 70%.
  3. Reakcja HPA (`Scale-out`): HPA wydaje polecenie zwiększenia liczby replik z bazowych 2 do maksymalnie 5 podów.
  4. Ruch jest dynamicznie rozkładany przez wewnętrzny `Service` na nowe kontenery, co powoduje spadek średniego czasu odpowiedzi API (*Response Time*) i stabilizację systemu.
  5. Wyłączenie generatora ruchu (`Scale-in`): po spadku obciążenia HPA automatycznie redukuje liczbę replik do wartości minimalnej, zwalniając zasoby klastra.

#### Tabela Wyników Eksperymentu HPA:

| Faza Testu | Czas | Wirtualni Użytkownicy (VU) | Średnie CPU (%) | Liczba Podów K8s | Średni Czas Odpowiedzi (p95) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Start** | 0s | 0 | 8% | **2 repliki** | 35 ms |
| **Rampa w górę** | 30s | 20 | 45% | **2 repliki** | 52 ms |
| **Szczyt obciążenia** | 60s - 120s | **100** | **88% (>70%)** | **5 replik (Max)** | **92 ms** |
| **Schładzanie** | 180s | 0 | 12% | **2 repliki (Min)** | 38 ms |

---

### 5.3. Scenariusz III: Testy skalowalności sprzętowej klastra (Cluster Autoscaler)

* **Cel testu:** Potwierdzenie, że w sytuacji wyczerpania zasobów fizycznych węzłów EC2, klaster automatycznie zamawia nowe instancje w AWS.
* **Przebieg eksperymentu:**
  1. Sztuczne podniesienie limitów CPU/RAM lub skali replik w Deploymentach, wymuszające utworzenie większej liczby podów niż pojemność obecnych węzłów `t3.medium`.
  2. Węzły robocze EC2 ulegają pełnemu zapchaniu – nowe pody przechodzą w stan **`Pending`** z braku wolnej pamięci i CPU.
  3. Mechanizm **Cluster Autoscaler** wykrywa pody w stanie `Pending` i wysyła sygnał do **AWS Auto Scaling Group** z żądaniem powołania nowej instancji EC2 w prywatnej podsieci VPC.
  4. Nowy serwer EC2 inicjalizuje się, dołącza do klastra EKS, a oczekujące pody przechodzą ze stanu `Pending` do `Running`.

---

### 5.4. Scenariusz IV: Testy bezprzerwowego wdrażania (Zero-Downtime Rolling Update w CI/CD)

* **Cel testu:** Wykazanie, że automatyczny potok CI/CD aktualizuje kod aplikacji bez powodowania przerw w dostępie dla użytkowników końcowych.
* **Przebieg eksperymentu:**
  1. Uruchomienie ciągłego testu odpytującego Frontend (`GET /`) co 100 ms.
  2. Wprowadzenie zmiany w kodzie w repozytorium Git i wykonanie `git push`.
  3. Potok **AWS CodePipeline** / **CodeBuild** (`buildspec.yml`) automatycznie buduje nowy obraz, wysyła go do **Amazon ECR** i aktualizuje manifest na klastrze EKS.
  4. Kubernetes przeprowadza aktualizację typu **Rolling Update** – nowe kontenery przechodzą sondy `readinessProbe` i przejmują ruch przed wygaszeniem starych podów.
  5. Wynik: 100% zapytań HTTP podczas trwania procesu wdrożenia kończy się statusem `200 OK` (brak błędów 5xx).

---

## 🎯 Rozdział 6: Podsumowanie i Wnioski Końcowe

### 6.1. Podsumowanie Osiągniętych Celów

W ramach przeprowadzonej pracy inżynierskiej zrealizowano wszystkie założone cele projektowe i badawcze:
1. **Architektura Mikrousług:** Stworzono skonteneryzowany system rezerwacji przestrzeni biurowej składający się z bezstanowych mikrousług w Pythonie (FastAPI) oraz interaktywnego frontendu SVG/HTML5.
2. **Stanowość w Kubernetesie:** Udowodniono możliwość stabilnego uruchomienia bazy danych PostgreSQL w klastrze Kubernetes przy użyciu `StatefulSet` i dynamicznie alokowanych dysków **AWS EBS gp3** przez sterownik EBS CSI Driver.
3. **Infrastructure as Code (IaC):** Zaimplementowano w pełni powtarzalną infrastrukturę chmurową w kodzie **Terraform**, podzieloną na moduły VPC, ECR, IAM, EKS oraz CI/CD.
4. **Automatyzacja CI/CD:** Stworzono ciągły potok wdrożeniowy w oparciu o **AWS CodePipeline** i **AWS CodeBuild** (`buildspec.yml`), umożliwiający automatyczne testowanie, budowanie i bezprzerwowe wdrażanie kodu na klastrze EKS (*Rolling Update*).
5. **Autoskalowanie i Odporność:** Weryfikacja eksperymentalna potwierdziła poprawność działania automatycznego skalowania podów (**HPA**) oraz odporność systemu na awarie węzłów i podów.

---

### 6.2. Wnioski Inżynierskie

1. **Efektywność StatefulSet dla Baz Danych:** Zastosowanie wzorca `StatefulSet` w połączeniu z `PersistentVolumeClaim` w Kubernetesie umożliwia bezpieczne uruchamianie baz stanowych w środowisku kontenerowym, stanowiąc atrakcyjną cenowo alternatywę dla zarządzanych baz relacyjnych (np. Amazon RDS) w środowiskach testowych i produkcyjnych o średniej skali.
2. **Kluczowa Rola Limitów Zasobów:** Prawidłowe zdefiniowanie wartości `requests` i `limits` dla procesora i pamięci RAM w manifestach Kubernetes jest warunkiem koniecznym do poprawnego wyliczania wskaźników przez **Horizontal Pod Autoscaler (HPA)**.
3. **Automatyzacja IaC:** Użycie narzędzia Terraform pozwala na skrócenie czasu powoływania kompletnego klastra EKS z dedykowaną siecią VPC i roleniami IAM z kilku godzin (przy konfiguracji ręcznej) do kilkunastu minut, przy jednoczesnej eliminacji błędu ludzkiego.

---

### 6.3. Kierunki Dalszego Rozwoju Systemu

1. **Wdrożenie Service Mesh (np. Istio lub AWS App Mesh):** W celu zaimplementowania zaawansowanych strategii wdrożeniowych typu *Canary Deployment* i *Blue/Green* oraz szyfrowania komunikacji między podami (mTLS).
2. **Śledzenie Rozproszone i Monitoring:** Integracja klastra z narzędziami **Prometheus & Grafana** do zaawansowanej wizualizacji metryk oraz **OpenTelemetry / AWS X-Ray** do śledzenia zapytań przechodzących przez mikroserwisy.
3. **Optymalizacja Kosztowa z Instancjami Spot:** Wykorzystanie instancji typu **AWS EC2 Spot** w grupie węzłów roboczych klastra EKS w celu obniżenia kosztów utrzymania infrastruktury nieprodukcyjnej nawet o 70-90%.
