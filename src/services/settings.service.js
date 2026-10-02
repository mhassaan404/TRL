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
