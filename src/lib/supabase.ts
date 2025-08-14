import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          type: 'audio' | 'video'
          payment_amount: number
          requirements: string | null
          status: 'open' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          type: 'audio' | 'video'
          payment_amount: number
          requirements?: string | null
          status?: 'open' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: 'audio' | 'video'
          payment_amount?: number
          requirements?: string | null
          status?: 'open' | 'closed'
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          job_id: string
          user_id: string
          file_url: string
          file_type: string
          status: 'submitted' | 'approved' | 'rejected'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          file_url: string
          file_type: string
          status?: 'submitted' | 'approved' | 'rejected'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          file_url?: string
          file_type?: string
          status?: 'submitted' | 'approved' | 'rejected'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ledger: {
        Row: {
          id: string
          user_id: string
          submission_id: string | null
          amount: number
          type: 'credit' | 'debit'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          submission_id?: string | null
          amount: number
          type: 'credit' | 'debit'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          submission_id?: string | null
          amount?: number
          type?: 'credit' | 'debit'
          created_at?: string
        }
      }
      balances: {
        Row: {
          user_id: string
          available: number
          pending_payout: number
          total_earned: number
          updated_at: string
        }
        Insert: {
          user_id: string
          available: number
          pending_payout?: number
          total_earned: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          available?: number
          pending_payout?: number
          total_earned?: number
          updated_at?: string
        }
      }
      payouts: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'processing' | 'paid' | 'failed'
          stripe_transfer_id: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: 'processing' | 'paid' | 'failed'
          stripe_transfer_id?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'processing' | 'paid' | 'failed'
          stripe_transfer_id?: string | null
          processed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
