import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Rampa w górę do 20 użytkowników
    { duration: '1m',  target: 100 }, // Szczytowe obciążenie 100 użytkowników (wyzwala HPA > 70% CPU)
    { duration: '30s', target: 0 },   // Rampa w dół
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% zapytań poniżej 200ms
    http_req_failed: ['rate<0.01'],   // Odsetek błędów poniżej 1%
  },
};

export default function () {
  const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8000';
  
  // 1. Pobranie dostępnych zasobów biurowych
  const resResources = http.get(`${BASE_URL}/api/resources`);
  check(resResources, {
    'status resources is 200': (r) => r.status === 200,
  });

  // 2. Odczyt listy rezerwacji
  const resReservations = http.get(`${BASE_URL}/api/reservations`);
  check(resReservations, {
    'status reservations is 200': (r) => r.status === 200,
  });

  sleep(1);
}
