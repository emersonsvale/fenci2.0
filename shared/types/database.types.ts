export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          bank_name: string | null
          color: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          icon: string | null
          id: string
          include_in_total: boolean | null
          initial_balance: number | null
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          icon?: string | null
          id?: string
          include_in_total?: boolean | null
          initial_balance?: number | null
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          icon?: string | null
          id?: string
          include_in_total?: boolean | null
          initial_balance?: number | null
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_threshold: number | null
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          is_recurring: boolean | null
          name: string
          reference_month: string
          spent_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          reference_month: string
          spent_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          reference_month?: string
          spent_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_invoices: {
        Row: {
          closing_date: string
          created_at: string | null
          credit_card_id: string
          due_date: string
          id: string
          paid_amount: number | null
          reference_month: string
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closing_date: string
          created_at?: string | null
          credit_card_id: string
          due_date: string
          id?: string
          paid_amount?: number | null
          reference_month: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closing_date?: string
          created_at?: string | null
          credit_card_id?: string
          due_date?: string
          id?: string
          paid_amount?: number | null
          reference_month?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_invoices_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          account_id: string | null
          available_limit: number | null
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string | null
          credit_limit: number | null
          due_day: number
          id: string
          is_active: boolean | null
          last_digits: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          available_limit?: number | null
          brand?: string | null
          closing_day: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number | null
          due_day: number
          id?: string
          is_active?: boolean | null
          last_digits?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          available_limit?: number | null
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number | null
          due_day?: number
          id?: string
          is_active?: boolean | null
          last_digits?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          contribution_date: string
          created_at: string | null
          goal_id: string
          id: string
          notes: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_date?: string
          created_at?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          created_at?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          account_id: string | null
          color: string | null
          contribution_frequency: string | null
          created_at: string | null
          current_amount: number | null
          description: string | null
          icon: string | null
          id: string
          name: string
          priority: number | null
          status: string | null
          suggested_contribution: number | null
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          color?: string | null
          contribution_frequency?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          priority?: number | null
          status?: string | null
          suggested_contribution?: number | null
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          color?: string | null
          contribution_frequency?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          priority?: number | null
          status?: string | null
          suggested_contribution?: number | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_transactions: {
        Row: {
          created_at: string | null
          fees: number | null
          id: string
          investment_id: string
          notes: string | null
          price: number
          quantity: number
          taxes: number | null
          total_amount: number
          transaction_date: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          created_at?: string | null
          fees?: number | null
          id?: string
          investment_id: string
          notes?: string | null
          price: number
          quantity: number
          taxes?: number | null
          total_amount: number
          transaction_date?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          created_at?: string | null
          fees?: number | null
          id?: string
          investment_id?: string
          notes?: string | null
          price?: number
          quantity?: number
          taxes?: number | null
          total_amount?: number
          transaction_date?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "investment_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_wallets: {
        Row: {
          broker: string | null
          color: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          total_invested: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker?: string | null
          color?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          total_invested?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker?: string | null
          color?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_invested?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          asset_type: string
          average_price: number | null
          created_at: string | null
          currency: string | null
          current_price: number | null
          current_value: number | null
          id: string
          name: string
          price_updated_at: string | null
          profit_loss: number | null
          profit_loss_percent: number | null
          quantity: number | null
          ticker: string
          total_dividends: number | null
          total_invested: number | null
          updated_at: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          asset_type: string
          average_price?: number | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          current_value?: number | null
          id?: string
          name: string
          price_updated_at?: string | null
          profit_loss?: number | null
          profit_loss_percent?: number | null
          quantity?: number | null
          ticker: string
          total_dividends?: number | null
          total_invested?: number | null
          updated_at?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          asset_type?: string
          average_price?: number | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          current_value?: number | null
          id?: string
          name?: string
          price_updated_at?: string | null
          profit_loss?: number | null
          profit_loss_percent?: number | null
          quantity?: number | null
          ticker?: string
          total_dividends?: number | null
          total_invested?: number | null
          updated_at?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "investment_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          due_date_days_before: number | null
          email_enabled: boolean | null
          id: string
          large_expense_threshold: number | null
          notify_budget_alerts: boolean | null
          notify_due_dates: boolean | null
          notify_goal_progress: boolean | null
          notify_large_expenses: boolean | null
          notify_monthly_report: boolean | null
          notify_overdue: boolean | null
          notify_weekly_summary: boolean | null
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          due_date_days_before?: number | null
          email_enabled?: boolean | null
          id?: string
          large_expense_threshold?: number | null
          notify_budget_alerts?: boolean | null
          notify_due_dates?: boolean | null
          notify_goal_progress?: boolean | null
          notify_large_expenses?: boolean | null
          notify_monthly_report?: boolean | null
          notify_overdue?: boolean | null
          notify_weekly_summary?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          due_date_days_before?: number | null
          email_enabled?: boolean | null
          id?: string
          large_expense_threshold?: number | null
          notify_budget_alerts?: boolean | null
          notify_due_dates?: boolean | null
          notify_goal_progress?: boolean | null
          notify_large_expenses?: boolean | null
          notify_monthly_report?: boolean | null
          notify_overdue?: boolean | null
          notify_weekly_summary?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          planning_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          planning_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          planning_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_categories_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_entries: {
        Row: {
          amount_actual: number | null
          amount_planned: number
          created_at: string | null
          description: string | null
          entry_date: string
          id: string
          is_active: boolean | null
          phase: string
          planning_category_id: string
          planning_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_actual?: number | null
          amount_planned: number
          created_at?: string | null
          description?: string | null
          entry_date: string
          id?: string
          is_active?: boolean | null
          phase: string
          planning_category_id: string
          planning_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_actual?: number | null
          amount_planned?: number
          created_at?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          is_active?: boolean | null
          phase?: string
          planning_category_id?: string
          planning_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_entries_planning_category_id_fkey"
            columns: ["planning_category_id"]
            isOneToOne: false
            referencedRelation: "planning_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_entries_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_installments: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          installment_number: number
          paid_at: string | null
          planning_id: string
          total_installments: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          installment_number: number
          paid_at?: string | null
          planning_id: string
          total_installments: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          planning_id?: string
          total_installments?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_installments_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_savings: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          planning_id: string
          saved_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          planning_id: string
          saved_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          planning_id?: string
          saved_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_savings_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
        ]
      }
      plannings: {
        Row: {
          budget_total: number | null
          created_at: string | null
          date_end: string | null
          date_start: string | null
          id: string
          name: string
          notes: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_total?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_total?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          preferred_currency: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          preferred_currency?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          preferred_currency?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: string
          amount: number
          auto_confirm: boolean | null
          category_id: string | null
          created_at: string | null
          credit_card_id: string | null
          current_installment: number | null
          day_of_month: number | null
          day_of_week: number | null
          description: string
          destination_account_id: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          is_installment: boolean | null
          next_occurrence: string | null
          notes: string | null
          start_date: string
          total_installments: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          auto_confirm?: boolean | null
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          current_installment?: number | null
          day_of_month?: number | null
          day_of_week?: number | null
          description: string
          destination_account_id?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          is_installment?: boolean | null
          next_occurrence?: string | null
          notes?: string | null
          start_date: string
          total_installments?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          auto_confirm?: boolean | null
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          current_installment?: number | null
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string
          destination_account_id?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          is_installment?: boolean | null
          next_occurrence?: string | null
          notes?: string | null
          start_date?: string
          total_installments?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_destination_account_id_fkey"
            columns: ["destination_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string | null
          credit_card_id: string | null
          description: string
          destination_account_id: string | null
          id: string
          installment_group_id: string | null
          installment_number: number | null
          invoice_id: string | null
          is_paid: boolean | null
          is_recurring: boolean | null
          notes: string | null
          recurring_transaction_id: string | null
          status: string | null
          tags: string[] | null
          total_installments: number | null
          transaction_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          description: string
          destination_account_id?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          invoice_id?: string | null
          is_paid?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          recurring_transaction_id?: string | null
          status?: string | null
          tags?: string[] | null
          total_installments?: number | null
          transaction_date?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          description?: string
          destination_account_id?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          invoice_id?: string | null
          is_paid?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          recurring_transaction_id?: string | null
          status?: string | null
          tags?: string[] | null
          total_installments?: number | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_credit_card_fk"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_destination_account_id_fkey"
            columns: ["destination_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_fk"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "credit_card_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_fk"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// ============================================
// TIPOS AUXILIARES PARA USO NO APP
// ============================================

// Tipos de linha (Row) para facilitar uso
export type Profile = Tables<'profiles'>
export type Account = Tables<'accounts'>
export type Category = Tables<'categories'>
export type Transaction = Tables<'transactions'>
export type CreditCard = Tables<'credit_cards'>
export type CreditCardInvoice = Tables<'credit_card_invoices'>
export type RecurringTransaction = Tables<'recurring_transactions'>
export type Goal = Tables<'goals'>
export type GoalContribution = Tables<'goal_contributions'>
export type Budget = Tables<'budgets'>
export type InvestmentWallet = Tables<'investment_wallets'>
export type Investment = Tables<'investments'>
export type InvestmentTransaction = Tables<'investment_transactions'>
export type Planning = Tables<'plannings'>
export type PlanningCategory = Tables<'planning_categories'>
export type PlanningEntry = Tables<'planning_entries'>
export type PlanningInstallment = Tables<'planning_installments'>
export type PlanningSaving = Tables<'planning_savings'>

// Tipos para Insert
export type ProfileInsert = TablesInsert<'profiles'>
export type AccountInsert = TablesInsert<'accounts'>
export type CategoryInsert = TablesInsert<'categories'>
export type TransactionInsert = TablesInsert<'transactions'>
export type CreditCardInsert = TablesInsert<'credit_cards'>
export type CreditCardInvoiceInsert = TablesInsert<'credit_card_invoices'>
export type RecurringTransactionInsert = TablesInsert<'recurring_transactions'>
export type GoalInsert = TablesInsert<'goals'>
export type GoalContributionInsert = TablesInsert<'goal_contributions'>
export type BudgetInsert = TablesInsert<'budgets'>
export type InvestmentWalletInsert = TablesInsert<'investment_wallets'>
export type InvestmentInsert = TablesInsert<'investments'>
export type InvestmentTransactionInsert = TablesInsert<'investment_transactions'>
export type PlanningInsert = TablesInsert<'plannings'>
export type PlanningCategoryInsert = TablesInsert<'planning_categories'>
export type PlanningEntryInsert = TablesInsert<'planning_entries'>
export type PlanningInstallmentInsert = TablesInsert<'planning_installments'>
export type PlanningSavingInsert = TablesInsert<'planning_savings'>

// Tipos para Update
export type ProfileUpdate = TablesUpdate<'profiles'>
export type AccountUpdate = TablesUpdate<'accounts'>
export type CategoryUpdate = TablesUpdate<'categories'>
export type TransactionUpdate = TablesUpdate<'transactions'>
export type CreditCardUpdate = TablesUpdate<'credit_cards'>
export type CreditCardInvoiceUpdate = TablesUpdate<'credit_card_invoices'>
export type RecurringTransactionUpdate = TablesUpdate<'recurring_transactions'>
export type GoalUpdate = TablesUpdate<'goals'>
export type GoalContributionUpdate = TablesUpdate<'goal_contributions'>
export type BudgetUpdate = TablesUpdate<'budgets'>
export type InvestmentWalletUpdate = TablesUpdate<'investment_wallets'>
export type InvestmentUpdate = TablesUpdate<'investments'>
export type InvestmentTransactionUpdate = TablesUpdate<'investment_transactions'>
export type PlanningUpdate = TablesUpdate<'plannings'>
export type PlanningCategoryUpdate = TablesUpdate<'planning_categories'>
export type PlanningEntryUpdate = TablesUpdate<'planning_entries'>
export type PlanningInstallmentUpdate = TablesUpdate<'planning_installments'>
export type PlanningSavingUpdate = TablesUpdate<'planning_savings'>

// Tipos para NotificationPreferences
export type NotificationPreferences = Tables<'notification_preferences'>
export type NotificationPreferencesInsert = TablesInsert<'notification_preferences'>
export type NotificationPreferencesUpdate = TablesUpdate<'notification_preferences'>

// ============================================
// ENUMS PARA USO NO APP
// ============================================

export type AccountType = 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'pending' | 'confirmed' | 'cancelled'
export type CategoryType = 'income' | 'expense' | 'transfer'
export type CreditCardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'partial' | 'overdue'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'
export type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type ContributionFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type AssetType = 'stock' | 'fii' | 'etf' | 'bdr' | 'crypto' | 'fixed_income' | 'fund' | 'other'
export type InvestmentTransactionType = 'buy' | 'sell' | 'dividend' | 'split' | 'bonus' | 'transfer_in' | 'transfer_out'
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired'
