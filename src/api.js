const BASE_URL = "https://fit-aktiv-backend.onrender.com/api"

export const api = {
  studios:     () => fetch(`${BASE_URL}/studios`).then(r => r.json()),
  mitarbeiter: () => fetch(`${BASE_URL}/mitarbeiter`).then(r => r.json()),
  kurse:       (params={}) => fetch(`${BASE_URL}/kurse?${new URLSearchParams(params)}`).then(r => r.json()),
  dashboard:   () => fetch(`${BASE_URL}/dashboard`).then(r => r.json()),
}