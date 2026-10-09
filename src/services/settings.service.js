import api, { request } from '../api/axios'

// Late fee settings. Both calls throw an Error with the API's message: the settings page shows a load
// failure in place of the form (it must not show made-up values), and save errors as a toast.
export const settingsService = {
  getLateFeeSettings: () =>
    request(() => api.get('/LateFeeSettings/Get'), 'Failed to load late fee settings'),

  saveLateFeeSettings: ({ paymentDueDays, lateFeePerDay, maxLateFeeMultiplier }) =>
    request(
      () =>
        api.post('/LateFeeSettings/Save', {
          PaymentDueDays: paymentDueDays,
          LateFeePerDay: lateFeePerDay,
          MaxLateFeeMultiplier: maxLateFeeMultiplier,
        }),
      'Failed to save late fee settings',
    ),
}

// Company profile (Administration > Company Profile). Both calls throw an Error with the API's message.
// logo: undefined = keep the current logo, a data URL = replace it; removeLogo = delete it.
export const companyProfileService = {
  get: () => request(() => api.get('/CompanyProfile/Get'), 'Failed to load company profile'),

  save: ({ phone, email, ntn, address, website, footerNote, logo, removeLogo }) =>
    request(
      () =>
        api.post('/CompanyProfile/Save', {
          Phone: phone,
          Email: email,
          Ntn: ntn,
          Address: address,
          Website: website,
          FooterNote: footerNote,
          Logo: logo ?? null,
          RemoveLogo: !!removeLogo,
        }),
      'Failed to save company profile',
    ),
}
