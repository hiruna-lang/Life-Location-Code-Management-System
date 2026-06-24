import api from '../api/axios'

export const normalizeName = (name = '') => {
  return name
    .toLowerCase()
    .trim()
    .replace('province', '')
    .replace('district', '')
    .replaceAll('-', '')
    .replaceAll(' ', '')
    .trim()
}

const warnEmpty = (label, data) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn(`Location API returned empty ${label} response.`)
  }
}

export const locationApi = {
  async provinces() {
    const { data } = await api.get('/provinces')
    warnEmpty('provinces', data)
    return Array.isArray(data) ? data : []
  },

  async districts(provinceId) {
    const { data } = await api.get('/districts', { params: { province_id: provinceId } })
    warnEmpty('districts', data)
    return Array.isArray(data) ? data : []
  },

  async divisionalSecretariats(districtId) {
    const { data } = await api.get('/divisional-secretariats', { params: { district_id: districtId } })
    warnEmpty('divisional secretariats', data)
    return Array.isArray(data) ? data : []
  },

  async gnDivisions(dsId) {
    const { data } = await api.get('/gn-divisions', { params: { ds_id: dsId } })
    warnEmpty('GN divisions', data)
    return Array.isArray(data) ? data : []
  },

  async villages(gnId) {
    const { data } = await api.get('/villages', { params: { gn_id: gnId } })
    warnEmpty('villages', data)
    return Array.isArray(data) ? data : []
  },
}
