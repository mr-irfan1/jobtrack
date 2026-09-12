import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Heading } from '../../components/ui/Typography'
import { BorderRadius, Spacing } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { supabase } from '../../lib/supabase'

export interface AchievementItem {
  id: string
  title: string
  description?: string
  date?: string
}

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

export default function MobileProfileScreen() {
  const { colors, isDark } = useTheme()
  const { user, signOut } = useAuth()

  // Profile Form States
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')

  // Skills
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  // Achievements
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [newAchTitle, setNewAchTitle] = useState('')
  const [newAchDesc, setNewAchDesc] = useState('')

  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true)

  // Status & Feedback
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Field validation errors
  const [urlErrors, setUrlErrors] = useState<{
    linkedin?: string
    github?: string
    portfolio?: string
    resume?: string
  }>({})

  // Modals for adding Skill / Achievement
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [isAchModalOpen, setIsAchModalOpen] = useState(false)

  // Load existing metadata on mount / user change
  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata
      setFullName(typeof meta.full_name === 'string' ? meta.full_name : '')
      setHeadline(typeof meta.headline === 'string' ? meta.headline : '')
      setBio(typeof meta.bio === 'string' ? meta.bio : '')
      setAvatarUrl(typeof meta.avatar_url === 'string' ? meta.avatar_url : '')
      setResumeUrl(typeof meta.resume_url === 'string' ? meta.resume_url : '')

      if (Array.isArray(meta.skills)) {
        setSkills(meta.skills.filter((s: unknown) => typeof s === 'string'))
      } else {
        setSkills([])
      }

      if (Array.isArray(meta.achievements)) {
        setAchievements(meta.achievements as AchievementItem[])
      } else {
        setAchievements([])
      }

      const social = (meta.social_links as Record<string, string>) || {}
      setLinkedinUrl(social.linkedin || '')
      setGithubUrl(social.github || '')
      setPortfolioUrl(social.portfolio || '')

      const prefs = meta.preferences || {}
      setEmailNotifications(prefs.emailNotifications !== false)
    }
  }, [user])

  // SAVE ALL CHANGES
  async function handleSaveProfile() {
    // Validate URLs
    const linkedinErr = validateSocialUrl('linkedin', linkedinUrl)
    const githubErr = validateSocialUrl('github', githubUrl)
    const portfolioErr = validateSocialUrl('portfolio', portfolioUrl)
    const resumeErr = validateSocialUrl('resume', resumeUrl)

    const errors = {
      linkedin: linkedinErr || undefined,
      github: githubErr || undefined,
      portfolio: portfolioErr || undefined,
      resume: resumeErr || undefined,
    }

    if (linkedinErr || githubErr || portfolioErr || resumeErr) {
      setUrlErrors(errors)
      setErrorMsg('Please correct the invalid URL fields below.')
      return
    }

    setUrlErrors({})
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const updatedMetadata = {
        ...user?.user_metadata,
        full_name: fullName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        resume_url: resumeUrl.trim(),
        skills,
        achievements,
        social_links: {
          linkedin: linkedinUrl.trim() || undefined,
          github: githubUrl.trim() || undefined,
          portfolio: portfolioUrl.trim() || undefined,
        },
        preferences: {
          ...(user?.user_metadata?.preferences || {}),
          emailNotifications,
        },
      }

      const { error } = await supabase.auth.updateUser({
        data: updatedMetadata,
      })

      if (error) throw error

      setSuccessMsg('Profile and preferences updated successfully!')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to update profile settings.',
      )
    } finally {
      setSaving(false)
    }
  }

  // SKILLS MANAGEMENT
  function handleAddSkill() {
    if (!newSkill.trim()) return
    if (!skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()])
    }
    setNewSkill('')
    setIsSkillModalOpen(false)
  }

  function handleRemoveSkill(skillToRemove: string) {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove))
  }

  // ACHIEVEMENTS MANAGEMENT
  function handleAddAchievement() {
    if (!newAchTitle.trim()) return
    const newItem: AchievementItem = {
      id: String(Date.now()),
      title: newAchTitle.trim(),
      description: newAchDesc.trim() || undefined,
      date: new Date().toISOString().slice(0, 10),
    }
    setAchievements((prev) => [...prev, newItem])
    setNewAchTitle('')
    setNewAchDesc('')
    setIsAchModalOpen(false)
  }

  function handleRemoveAchievement(id: string) {
    setAchievements((prev) => prev.filter((a) => a.id !== id))
  }

  // LOGOUT CONFIRMATION
  function handleSignOutPrompt() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of JobTrack?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
        },
      },
    ])
  }

  const initials = useMemo(() => {
    if (fullName.trim()) {
      return fullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return (user?.email || 'U').charAt(0).toUpperCase()
  }, [fullName, user])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* USER HEADER BANNER */}
          <Card style={styles.headerCard}>
            <View style={styles.avatarRow}>
              {avatarUrl && isValidHttpUrl(avatarUrl) ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarFallbackText}>{initials}</Text>
                </View>
              )}
              <View style={styles.headerUserInfo}>
                <Heading style={{ fontSize: 20 }}>
                  {fullName || 'Job Seeker'}
                </Heading>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                  {user?.email}
                </Text>
                {headline ? (
                  <Text style={[styles.userHeadline, { color: colors.foreground }]}>
                    {headline}
                  </Text>
                ) : null}
              </View>
            </View>
          </Card>

          {/* SUCCESS / ERROR ALERTS */}
          {successMsg ? (
            <View style={[styles.alertBox, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
              <Text style={[styles.alertText, { color: colors.success }]}>
                {successMsg}
              </Text>
            </View>
          ) : null}

          {errorMsg ? (
            <View style={[styles.alertBox, { backgroundColor: colors.danger + '20', borderColor: colors.danger }]}>
              <Text style={[styles.alertText, { color: colors.danger }]}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          {/* BASIC PROFILE INFO */}
          <Card style={styles.sectionCard}>
            <Heading style={styles.sectionTitle}>Basic Information</Heading>

            <Input
              label="Full Name"
              placeholder="Your Name"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Professional Headline"
              placeholder="e.g. Senior Frontend Engineer"
              value={headline}
              onChangeText={setHeadline}
            />

            <Input
              label="Bio / Summary"
              placeholder="A brief summary about your background and interests..."
              value={bio}
              onChangeText={setBio}
              multiline
              style={{ height: 80 }}
            />

            <Input
              label="Profile Photo URL"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
            />
          </Card>

          {/* SKILLS SECTION */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Heading style={styles.sectionTitle}>Skills & Competencies</Heading>
              <TouchableOpacity
                style={[styles.smallAddBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsSkillModalOpen(true)}
              >
                <Text style={styles.smallAddBtnText}>+ Add Skill</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillsWrapper}>
              {skills.length === 0 ? (
                <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                  No skills added yet. Tap &ldquo;+ Add Skill&rdquo; to add your technical skills.
                </Text>
              ) : (
                skills.map((skill) => (
                  <View
                    key={skill}
                    style={[
                      styles.skillChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.skillChipText, { color: colors.foreground }]}>
                      {skill}
                    </Text>
                    <TouchableOpacity
                      style={styles.chipRemoveBtn}
                      onPress={() => handleRemoveSkill(skill)}
                    >
                      <Text style={[styles.chipRemoveText, { color: colors.danger }]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </Card>

          {/* ACHIEVEMENTS SECTION */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Heading style={styles.sectionTitle}>Achievements & Highlights</Heading>
              <TouchableOpacity
                style={[styles.smallAddBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsAchModalOpen(true)}
              >
                <Text style={styles.smallAddBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {achievements.length === 0 ? (
              <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                No achievements recorded yet.
              </Text>
            ) : (
              achievements.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.achievementItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.achTitle, { color: colors.foreground }]}>
                      🏆 {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={[styles.achDesc, { color: colors.mutedForeground }]}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.achRemoveBtn}
                    onPress={() => handleRemoveAchievement(item.id)}
                  >
                    <Text style={[styles.chipRemoveText, { color: colors.danger }]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>

          {/* SOCIAL & CAREER LINKS */}
          <Card style={styles.sectionCard}>
            <Heading style={styles.sectionTitle}>Social & Portfolio Links</Heading>

            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              autoCapitalize="none"
              error={urlErrors.linkedin}
            />

            <Input
              label="GitHub URL"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChangeText={setGithubUrl}
              autoCapitalize="none"
              error={urlErrors.github}
            />

            <Input
              label="Portfolio / Website URL"
              placeholder="https://myportfolio.dev"
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
              autoCapitalize="none"
              error={urlErrors.portfolio}
            />

            <Input
              label="Resume URL / Link"
              placeholder="https://drive.google.com/..."
              value={resumeUrl}
              onChangeText={setResumeUrl}
              autoCapitalize="none"
              error={urlErrors.resume}
            />
          </Card>

          {/* PREFERENCES */}
          <Card style={styles.sectionCard}>
            <Heading style={styles.sectionTitle}>Preferences & System</Heading>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.prefLabel, { color: colors.foreground }]}>
                  App Theme
                </Text>
                <Text style={[styles.prefSub, { color: colors.mutedForeground }]}>
                  Currently following system ({isDark ? 'Dark' : 'Light'})
                </Text>
              </View>
              <View style={[styles.themeBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.themeBadgeText, { color: colors.primary }]}>
                  {isDark ? '🌙 Dark' : '☀️ Light'}
                </Text>
              </View>
            </View>

            <View style={[styles.prefRow, { marginTop: Spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.prefLabel, { color: colors.foreground }]}>
                  Interview & Application Alerts
                </Text>
                <Text style={[styles.prefSub, { color: colors.mutedForeground }]}>
                  Receive interview reminders and status notifications
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: emailNotifications
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => setEmailNotifications((prev) => !prev)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    emailNotifications ? styles.toggleThumbOn : styles.toggleThumbOff,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </Card>

          {/* SAVE BUTTON */}
          <Button
            title="Save Profile & Settings"
            size="lg"
            loading={saving}
            onPress={handleSaveProfile}
          />

          {/* LOGOUT BUTTON */}
          <View style={{ marginTop: Spacing.md }}>
            <Button
              title="Sign Out of Account"
              variant="danger"
              size="lg"
              onPress={handleSignOutPrompt}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ADD SKILL MODAL */}
      <Modal visible={isSkillModalOpen} transparent animationType="fade" onRequestClose={() => setIsSkillModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Heading style={{ fontSize: 18, marginBottom: Spacing.sm }}>Add Skill</Heading>
            <Input
              placeholder="e.g. React Native, TypeScript, Node.js"
              value={newSkill}
              onChangeText={setNewSkill}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                style={{ flex: 1 }}
                onPress={() => setIsSkillModalOpen(false)}
              />
              <Button
                title="Add"
                size="md"
                style={{ flex: 1 }}
                onPress={handleAddSkill}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ADD ACHIEVEMENT MODAL */}
      <Modal visible={isAchModalOpen} transparent animationType="fade" onRequestClose={() => setIsAchModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Heading style={{ fontSize: 18, marginBottom: Spacing.sm }}>Add Achievement</Heading>
            <Input
              label="Title *"
              placeholder="e.g. Promoted to Tech Lead, Hackathon 1st Place"
              value={newAchTitle}
              onChangeText={setNewAchTitle}
              autoFocus
            />
            <Input
              label="Description (Optional)"
              placeholder="Details or impact..."
              value={newAchDesc}
              onChangeText={setNewAchDesc}
            />
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                style={{ flex: 1 }}
                onPress={() => setIsAchModalOpen(false)}
              />
              <Button
                title="Save"
                size="md"
                style={{ flex: 1 }}
                onPress={handleAddAchievement}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  headerCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  headerUserInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userHeadline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  alertBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  smallAddBtn: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  smallAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  emptySectionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipRemoveBtn: {
    padding: 4,
    marginLeft: 4,
  },
  chipRemoveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  achTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  achDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  achRemoveBtn: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  prefSub: {
    fontSize: 12,
    marginTop: 2,
  },
  themeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  themeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    padding: Spacing.xl,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
})
