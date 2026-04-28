export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          created_at: string
          session_date: string
          session_type: string
          location: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          session_date: string
          session_type?: string
          location?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          session_date?: string
          session_type?: string
          location?: string | null
          notes?: string | null
          user_id?: string
        }
      }
      putts: {
        Row: {
          id: string
          session_id: string
          created_at: string
          result: string | null
          miss_direction: string[] | null
          miss_distance: string | null
          putt_length: string | null
          green_speed: string | null
          slope: string | null
          break: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          result?: string | null
          miss_direction?: string[] | null
          miss_distance?: string | null
          putt_length?: string | null
          green_speed?: string | null
          slope?: string | null
          break?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          result?: string | null
          miss_direction?: string[] | null
          miss_distance?: string | null
          putt_length?: string | null
          green_speed?: string | null
          slope?: string | null
          break?: string | null
          notes?: string | null
        }
      }
      shots: {
        Row: {
          id: string
          session_id: string
          created_at: string
          contact: string[] | null
          miss_direction: string[] | null
          proximity: string | null
          lie_surface: string | null
          lie_slope: string[] | null
          ball_position: string[] | null
          club: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          contact?: string | null
          miss_direction?: string[] | null
          proximity?: string | null
          lie_surface?: string | null
          lie_slope?: string[] | null
          ball_position?: string[] | null
          club?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          contact?: string | null
          miss_direction?: string[] | null
          proximity?: string | null
          lie_surface?: string | null
          lie_slope?: string[] | null
          ball_position?: string[] | null
          club?: string | null
          notes?: string | null
        }
      }
    }
  }
}
