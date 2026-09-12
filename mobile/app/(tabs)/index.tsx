import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  addApplication,
  deleteApplication,
  getApplications,
} from '../../src/services/mobileApplicationRepository'
import { supabase } from '../../src/services/supabaseNativeClient'
import type { ApplicationStatus, JobApplication } from '../../src/types/application'

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string }> = {
  Wishlist: { bg: '#F3F4F6', text: '#4B5563' },
  Applied: { bg: '#DBEAFE', text: '#1E40AF' },
  Interview: { bg: '#FEF3C7', text: '#92400E' },
  Offer: { bg: '#D1FAE5', text: '#065F46' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
}

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter] = useState<string>('ALL')

  // Auth state
  const [session, setSession] = useState<unknown | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newCompany, setNewCompany] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newJobUrl, setNewJobUrl] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const loadData = useCallback(async () => {
    try {
      const data = await getApplications()
      setApplications(data)
    } catch {
      // User might be unauthenticated
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadData()
      else setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession)
        if (currentSession) loadData()
      },
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [loadData])

  async function handleLogin() {
    if (!emailInput || !passwordInput) return
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    })
    setAuthLoading(false)
    if (error) setAuthError(error.message)
  }

  async function handleCreateApplication() {
    if (!newCompany.trim() || !newTitle.trim()) return
    const app: JobApplication = {
      id: String(Date.now()),
      company: newCompany.trim(),
      jobTitle: newTitle.trim(),
      location: newLocation.trim(),
      jobUrl: newJobUrl.trim(),
      applicationDate: new Date().toISOString().slice(0, 10),
      status: 'Applied',
      notes: newNotes.trim(),
    }
    try {
      const created = await addApplication(app)
      setApplications((prev) => [...prev, created])
      setIsAddModalOpen(false)
      setNewCompany('')
      setNewTitle('')
      setNewLocation('')
      setNewJobUrl('')
      setNewNotes('')
    } catch (err: unknown) {
      console.error(err)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteApplication(id)
      setApplications((prev) => prev.filter((a) => a.id !== id))
    } catch (err: unknown) {
      console.error(err)
    }
  }

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !search ||
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      app.location.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!session) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.brandTitle}>JobTrack</Text>
          <Text style={styles.authSubtitle}>Sign in to access your applications</Text>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#9CA3AF"
            value={emailInput}
            onChangeText={setEmailInput}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={passwordInput}
            onChangeText={setPasswordInput}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Job Applications</Text>
          <Text style={styles.subtitle}>
            {applications.length} total applications
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search applications..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* APPLICATIONS LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList<JobApplication>
          data={filteredApps}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
          renderItem={({ item }: { item: JobApplication }) => {
            const badge = STATUS_COLORS[item.status] || STATUS_COLORS.Applied
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.company.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.companyInfo}>
                      <Text style={styles.companyName}>{item.company}</Text>
                      <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                    </View>
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                  >
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {item.location ? (
                  <Text style={styles.metaText}>📍 {item.location}</Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>Applied {item.applicationDate}</Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySubtitle}>
                Add your first job application to start tracking.
              </Text>
            </View>
          }
        />
      )}

      {/* ADD APPLICATION MODAL */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Job Application</Text>

            <TextInput
              style={styles.input}
              placeholder="Company name *"
              placeholderTextColor="#9CA3AF"
              value={newCompany}
              onChangeText={setNewCompany}
            />
            <TextInput
              style={styles.input}
              placeholder="Job title *"
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Location (e.g. Remote, NY)"
              placeholderTextColor="#9CA3AF"
              value={newLocation}
              onChangeText={setNewLocation}
            />
            <TextInput
              style={styles.input}
              placeholder="Job posting URL"
              placeholderTextColor="#9CA3AF"
              value={newJobUrl}
              onChangeText={setNewJobUrl}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notes / Description"
              placeholderTextColor="#9CA3AF"
              multiline
              value={newNotes}
              onChangeText={setNewNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButtonModal}
                onPress={handleCreateApplication}
              >
                <Text style={styles.primaryButtonText}>Save Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  authContainer: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', padding: 20 },
  authCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  brandTitle: { fontSize: 24, fontWeight: '700', color: '#4F46E5', textAlign: 'center' },
  authSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  addButton: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  searchBar: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginHorizontal: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#4F46E5', fontWeight: '700', fontSize: 16 },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  jobTitle: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  deleteText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 12 },
  primaryButton: { backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonModal: { backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, flex: 1, alignItems: 'center', marginLeft: 6 },
  secondaryButton: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, flex: 1, alignItems: 'center', marginRight: 6 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  secondaryButtonText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalActions: { flexDirection: 'row', marginTop: 8 },
})
