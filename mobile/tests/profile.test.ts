import assert from 'node:assert/strict'
import { test } from 'node:test'

function isValidHttpUrl(stringUrl: string): boolean {
  try {
    const url = new URL(stringUrl)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateSocialUrl(
  platform: 'linkedin' | 'github' | 'portfolio' | 'resume',
  url: string,
): string | null {
  if (!url.trim()) return null
  if (!isValidHttpUrl(url.trim())) {
    return 'Must be a valid URL starting with http:// or https://'
  }
  const clean = url.trim().toLowerCase()
  if (platform === 'linkedin' && !clean.includes('linkedin.com')) {
    return 'Must be a valid LinkedIn URL (e.g. https://linkedin.com/in/username)'
  }
  if (platform === 'github' && !clean.includes('github.com')) {
    return 'Must be a valid GitHub URL (e.g. https://github.com/username)'
  }
  return null
}

test('Profile: social URL validation enforces domain and scheme rules', () => {
  // Valid URLs
  assert.equal(validateSocialUrl('linkedin', 'https://linkedin.com/in/alexdev'), null)
  assert.equal(validateSocialUrl('github', 'https://github.com/alexdev'), null)
  assert.equal(validateSocialUrl('portfolio', 'https://alex.dev'), null)
  assert.equal(validateSocialUrl('resume', 'https://drive.google.com/file/d/123/view'), null)

  // Empty string is valid (optional field)
  assert.equal(validateSocialUrl('linkedin', ''), null)

  // Invalid scheme
  assert.equal(
    validateSocialUrl('linkedin', 'ftp://linkedin.com/in/alexdev'),
    'Must be a valid URL starting with http:// or https://',
  )
  assert.equal(
    validateSocialUrl('github', 'javascript:alert(1)'),
    'Must be a valid URL starting with http:// or https://',
  )

  // Mismatched domain
  assert.equal(
    validateSocialUrl('linkedin', 'https://twitter.com/alexdev'),
    'Must be a valid LinkedIn URL (e.g. https://linkedin.com/in/username)',
  )
  assert.equal(
    validateSocialUrl('github', 'https://gitlab.com/alexdev'),
    'Must be a valid GitHub URL (e.g. https://github.com/username)',
  )
})

test('Profile: skill deduplication and addition', () => {
  const existingSkills = ['React Native', 'TypeScript']
  const addSkill = (skills: string[], newSkill: string) => {
    const trimmed = newSkill.trim()
    if (!trimmed || skills.includes(trimmed)) return skills
    return [...skills, trimmed]
  }

  const updated1 = addSkill(existingSkills, 'GraphQL')
  assert.deepEqual(updated1, ['React Native', 'TypeScript', 'GraphQL'])

  // Duplicate add should be ignored
  const updated2 = addSkill(updated1, 'TypeScript')
  assert.deepEqual(updated2, ['React Native', 'TypeScript', 'GraphQL'])
})
