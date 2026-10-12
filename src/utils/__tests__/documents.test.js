import { describe, expect, test } from 'vitest'
import {
  amountInWords,
  hasReceipt,
  invoiceLink,
  invoiceNo,
  invoiceTitle,
  isNonCashPayment,
  numberToWords,
  receiptNo,
  receiptsLink,
} from '../documents'

describe('document numbers and links', () => {
  test('numbers', () => {
    expect(receiptNo(1)).toBe('RCT-000001')
    expect(invoiceNo(45)).toBe('INV-000045')
    expect(invoiceNo(1234567)).toBe('INV-1234567')
  })
  test('links', () => {
    expect(receiptsLink(12)).toBe('#/print/receipts/12')
    expect(receiptsLink([12, 13])).toBe('#/print/receipts/12,13')
    expect(invoiceLink(5)).toBe('#/print/invoice/5')
  })
  test('invoice title', () => {
    expect(invoiceTitle({ chargeType: 'Damage' })).toBe('Damage')
    expect(invoiceTitle({ invoiceMonth: '2026-10-01T00:00:00' })).toBe('Rent – October 2026')
    expect(invoiceTitle({ invoiceDate: '2026-01-15' })).toBe('Rent – January 2026')
    expect(invoiceTitle({})).toBe('Rent')
  })
})

describe('amount in words (Pakistani style)', () => {
  test.each([
    [0, 'Zero'],
    [7, 'Seven'],
    [19, 'Nineteen'],
    [45, 'Forty-Five'],
    [100, 'One Hundred'],
    [1005, 'One Thousand Five'],
    [25000, 'Twenty-Five Thousand'],
    [125000, 'One Lakh Twenty-Five Thousand'],
    [9999999, 'Ninety-Nine Lakh Ninety-Nine Thousand Nine Hundred Ninety-Nine'],
    [12345678, 'One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight'],
  ])('%i', (n, words) => expect(numberToWords(n)).toBe(words))

  test('rupees and paisa', () => {
    expect(amountInWords(25000)).toBe('Rupees Twenty-Five Thousand Only')
    expect(amountInWords(10.5)).toBe('Rupees Ten and Fifty Paisa Only')
    expect(amountInWords(-300)).toBe('Rupees Three Hundred Only')
    expect(amountInWords('abc')).toBe('Rupees Zero Only')
  })
})

describe('receipts', () => {
  test('only cash actually received has a receipt', () => {
    expect(hasReceipt({ paymentAmount: 100, paymentMethod: 'Cash' })).toBe(true)
    expect(hasReceipt({ paymentAmount: 0, discountAmount: 50 })).toBe(false)
    expect(hasReceipt({ paymentAmount: -100 })).toBe(false) // adjustment / reversal
    expect(hasReceipt({ paymentAmount: 100, paymentMethod: 'Security Deposit' })).toBe(false)
    expect(isNonCashPayment({ paymentMethod: 'Credit to Deposit' })).toBe(true)
    expect(hasReceipt(null)).toBe(false)
  })
})
