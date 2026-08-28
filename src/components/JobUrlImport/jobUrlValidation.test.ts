import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isValidJobUrl, validateJobUrl } from './jobUrlValidation.ts'

test('isValidJobUrl rejects an empty or whitespace URL', () => {
  assert.equal(isValidJobUrl(''), false)
  assert.equal(isValidJobUrl('   '), false)
})

test('isValidJobUrl rejects invalid or non-HTTP/HTTPS URLs', () => {
  assert.equal(isValidJobUrl('not-a-url'), false)
  assert.equal(isValidJobUrl('ftp://example.com/job'), false)
  assert.equal(isValidJobUrl('javascript:alert(1)'), false)
  assert.equal(isValidJobUrl('example.com/jobs/1'), false)
})

test('isValidJobUrl accepts valid HTTPS URLs', () => {
  assert.equal(isValidJobUrl('https://example.com/jobs/software-engineer'), true)
  assert.equal(isValidJobUrl('https://linkedin.com/jobs/view/12345'), true)
})

test('isValidJobUrl accepts valid HTTP URLs', () => {
  assert.equal(isValidJobUrl('http://example.com/careers/123'), true)
  assert.equal(isValidJobUrl('http://jobs.company.org/listing'), true)
})

test('validateJobUrl returns appropriate error message for empty input', () => {
  assert.equal(validateJobUrl(''), 'Job posting URL is required.')
  assert.equal(validateJobUrl('  '), 'Job posting URL is required.')
})

test('validateJobUrl returns appropriate error message for malformed URL', () => {
  const error = validateJobUrl('invalid-url')
  assert.ok(error !== null)
  assert.ok(error.includes('Please enter a valid HTTP or HTTPS URL'))
})

test('validateJobUrl returns null for valid HTTP and HTTPS URLs', () => {
  assert.equal(validateJobUrl('https://example.com/jobs/software-engineer'), null)
  assert.equal(validateJobUrl('http://company.com/careers/456'), null)
})
