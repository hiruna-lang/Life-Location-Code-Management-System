import axios from 'axios'

const USER_TOKEN_KEY = 'llcms_token'
const USER_EXPIRY_KEY = 'llcms_token_expires_at'
const GUEST_TOKEN_KEY = 'llcms_guest_token'
const GUEST_EXPIRY_KEY = 'llcms_guest_token_expires_at'
let guestTokenRequest = null

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
})

const tokenIssuer = axios.create({
  baseURL: '/api',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
})

function isLocationListingRequest(config) {
  return String(config.url || '').startsWith('/v1/locations/')
}

function hasExpired(expiry) {
  return !expiry || Date.parse(expiry) <= Date.now() + 30000
}

export function clearGuestToken() {
  sessionStorage.removeItem(GUEST_TOKEN_KEY)
  sessionStorage.removeItem(GUEST_EXPIRY_KEY)
}

export async function getGuestAccessToken() {
  const cachedToken = sessionStorage.getItem(GUEST_TOKEN_KEY)
  const cachedExpiry = sessionStorage.getItem(GUEST_EXPIRY_KEY)
  if (cachedToken && !hasExpired(cachedExpiry)) return cachedToken

  clearGuestToken()
  if (!guestTokenRequest) {
    guestTokenRequest = tokenIssuer.post('/v1/auth/guest-token')
      .then(({ data }) => {
        sessionStorage.setItem(GUEST_TOKEN_KEY, data.token)
        sessionStorage.setItem(GUEST_EXPIRY_KEY, data.expires_at)
        return data.token
      })
      .finally(() => { guestTokenRequest = null })
  }
  return guestTokenRequest
}

// Attach the signed-in token, or a short-lived guest token for location listings.
api.interceptors.request.use(async cfg => {
  const userToken = localStorage.getItem(USER_TOKEN_KEY)
  if (userToken) {
    cfg.headers.Authorization = `Bearer ${userToken}`
  } else if (isLocationListingRequest(cfg)) {
    cfg.headers.Authorization = `Bearer ${await getGuestAccessToken()}`
    cfg._usedGuestToken = true
  }
  return cfg
})

api.interceptors.response.use(
  res => res,
  async err => {
    const config = err.config
    if (err.response?.status === 401) {
      if (config?._usedGuestToken && !config._guestRetry) {
        config._guestRetry = true
        clearGuestToken()
        config.headers.Authorization = `Bearer ${await getGuestAccessToken()}`
        return api(config)
      }

      localStorage.removeItem(USER_TOKEN_KEY)
      localStorage.removeItem(USER_EXPIRY_KEY)
      localStorage.removeItem('llcms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
