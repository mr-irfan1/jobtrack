import { useState } from 'react'
import AchievementsSettingsSection from './components/AchievementsSettingsSection'
import PreferencesSettingsSection from './components/PreferencesSettingsSection'
import ProfileSettingsSection from './components/ProfileSettingsSection'
import SecuritySettingsSection from './components/SecuritySettingsSection'
import SkillsSettingsSection from './components/SkillsSettingsSection'
import SocialLinksSettingsSection from './components/SocialLinksSettingsSection'

type SettingsTab =
  | 'profile'
  | 'skills'
  | 'achievements'
  | 'social'
  | 'preferences'
  | 'security'

interface TabConfig {
  id: SettingsTab
  label: string
  icon: string
  comingSoon?: boolean
}

const SETTINGS_TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'skills', label: 'Skills', icon: '🛠' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'social', label: 'Social Links', icon: '🔗' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🔐' },
]

function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* PAGE HEADER */}
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, preferences and account.
        </p>
      </header>

      {/* WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* DESKTOP SIDEBAR NAVIGATION / MOBILE HORIZONTAL TAB BAR */}
        <div className="lg:col-span-3">
          <nav
            aria-label="Settings navigation"
            className="flex gap-2 overflow-x-auto border-b border-border pb-4 scrollbar-none lg:flex-col lg:border-b-0 lg:pb-0"
          >
            {SETTINGS_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-surface text-muted-foreground hover:bg-muted hover:text-foreground border border-border lg:border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>

                  {tab.comingSoon ? (
                    <span
                      className={`hidden rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase lg:inline-block ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      Soon
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </div>

        {/* MAIN SETTINGS CONTENT AREA */}
        <div className="lg:col-span-9">
          {activeTab === 'profile' ? (
            <ProfileSettingsSection />
          ) : activeTab === 'skills' ? (
            <SkillsSettingsSection />
          ) : activeTab === 'achievements' ? (
            <AchievementsSettingsSection />
          ) : activeTab === 'social' ? (
            <SocialLinksSettingsSection />
          ) : activeTab === 'preferences' ? (
            <PreferencesSettingsSection />
          ) : activeTab === 'security' ? (
            <SecuritySettingsSection />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
              <span aria-hidden="true" className="text-3xl">
                {SETTINGS_TABS.find((t) => t.id === activeTab)?.icon}
              </span>
              <h2 className="mt-3 text-base font-bold text-foreground">
                {SETTINGS_TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This settings section will be available soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SettingsView
