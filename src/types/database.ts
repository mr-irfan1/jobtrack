/**
-- Supabase Database Types for JobTrack
-- Mirrors public schema tables and relationships defined in 20260912000001_production_backend_schema.sql
*/

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          headline: string | null
          location: string | null
          bio: string | null
          skills: Json
          achievements: Json
          social_links: Json
          preferences: Json
          read_notification_ids: string[]
          dismissed_notification_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          headline?: string | null
          location?: string | null
          bio?: string | null
          skills?: Json
          achievements?: Json
          social_links?: Json
          preferences?: Json
          read_notification_ids?: string[]
          dismissed_notification_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          headline?: string | null
          location?: string | null
          bio?: string | null
          skills?: Json
          achievements?: Json
          social_links?: Json
          preferences?: Json
          read_notification_ids?: string[]
          dismissed_notification_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          name: string
          file_name: string
          file_type: 'pdf' | 'doc' | 'docx' | 'other'
          file_size: number
          storage_path: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          file_name: string
          file_type: 'pdf' | 'doc' | 'docx' | 'other'
          file_size: number
          storage_path: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          file_name?: string
          file_type?: 'pdf' | 'doc' | 'docx' | 'other'
          file_size?: number
          storage_path?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          company: string
          job_title: string
          location: string
          job_url: string
          application_date: string
          status: 'Wishlist' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
          notes: string
          interview_date: string | null
          interview_time: string | null
          interview_type: string | null
          meeting_link: string | null
          resume_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          company: string
          job_title: string
          location?: string
          job_url?: string
          application_date: string
          status: 'Wishlist' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
          notes?: string
          interview_date?: string | null
          interview_time?: string | null
          interview_type?: string | null
          meeting_link?: string | null
          resume_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          company?: string
          job_title?: string
          location?: string
          job_url?: string
          application_date?: string
          status?: 'Wishlist' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
          notes?: string
          interview_date?: string | null
          interview_time?: string | null
          interview_type?: string | null
          meeting_link?: string | null
          resume_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      follow_ups: {
        Row: {
          id: string
          user_id: string
          application_id: string
          scheduled_date: string
          scheduled_time: string | null
          scheduled_for: string
          note: string | null
          status: 'pending' | 'completed' | 'cancelled'
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          application_id: string
          scheduled_date: string
          scheduled_time?: string | null
          scheduled_for: string
          note?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          application_id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          scheduled_for?: string
          note?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          title: string
          company: string
          company_logo: string | null
          location: string
          workplace_type: string
          employment_type: string
          category: string | null
          salary: string | null
          apply_url: string
          posted_date: string | null
          source: string
          skills: string[]
          saved_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          job_id: string
          title: string
          company: string
          company_logo?: string | null
          location?: string
          workplace_type?: string
          employment_type?: string
          category?: string | null
          salary?: string | null
          apply_url?: string
          posted_date?: string | null
          source?: string
          skills?: string[]
          saved_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          title?: string
          company?: string
          company_logo?: string | null
          location?: string
          workplace_type?: string
          employment_type?: string
          category?: string | null
          salary?: string | null
          apply_url?: string
          posted_date?: string | null
          source?: string
          skills?: string[]
          saved_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      cover_letters: {
        Row: {
          id: string
          user_id: string
          job_id: string | null
          application_id: string | null
          job_title: string
          company: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          job_id?: string | null
          application_id?: string | null
          job_title: string
          company: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string | null
          application_id?: string | null
          job_title?: string
          company?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      job_alerts: {
        Row: {
          id: string
          user_id: string
          name: string
          criteria: Json
          frequency: 'daily' | 'weekly'
          status: 'active' | 'paused'
          last_checked_at: string | null
          last_notified_at: string | null
          notified_job_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          criteria?: Json
          frequency?: 'daily' | 'weekly'
          status?: 'active' | 'paused'
          last_checked_at?: string | null
          last_notified_at?: string | null
          notified_job_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          criteria?: Json
          frequency?: 'daily' | 'weekly'
          status?: 'active' | 'paused'
          last_checked_at?: string | null
          last_notified_at?: string | null
          notified_job_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      interview_prep_checklists: {
        Row: {
          id: string
          user_id: string
          key_id: string
          items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          key_id: string
          items?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key_id?: string
          items?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
