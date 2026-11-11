export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface UserStats {
  diamonds: number;
  has_subscription: boolean;
  days_left: number;
  subscription_end: string | null;
}

export interface PublicStats {
  users: number;
  comments: number;
  chats: number;
  started_bot: number;
  with_username: number;
  with_phone: number;
  only_id: number;
}

export interface ChatActivity {
  date: string;
  count: number;
}

export interface TopChat {
  chat: string;
  messages: number;
}

export interface TopWord {
  word: string;
  count: number;
}

export interface CommentMessage {
  id?: string;
  user_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  chat_title?: string;
  chat?: string;
  message_text?: string;
  text?: string;
  message_date?: string;
  date?: string;
  message_link?: string;
  link?: string;
}

export interface UserProfileData {
  user_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  started_bot?: boolean;
  avatar_url?: string;
  photo_url?: string;
  comments?: CommentMessage[];
  chats?: {
    chat_id?: string | number;
    title: string;
    type?: 'group' | 'supergroup' | 'channel' | string;
    username?: string;
    link?: string;
  }[];
  friends?: {
    id: number;
    name: string;
    username?: string;
  }[];
  words?: {
    word: string;
    count: number;
  }[];
  name_history?: {
    name: string;
    date: string;
  }[];
  profile_changes?: {
    field: string;
    old: string;
    new: string;
    date: string;
  }[];
}

export interface PhoneCheckResult {
  phone: string;
  country: string;
  flag: string;
  region: string;
  operator: string;
  tz: string;
  type: string;
  lat?: number;
  lon?: number;
  telegram_exists?: boolean;
  telegram_username?: string;
  telegram_link?: string;
  whatsapp_exists?: boolean;
  whatsapp_link?: string;
}

export interface InstagramResult {
  full_name?: string;
  username?: string;
  user_id?: string;
  phone?: string;
  email?: string;
  followers?: number;
  following?: number;
  posts?: number;
  bio?: string;
  website?: string;
  location?: string;
  is_private?: boolean;
  is_verified?: boolean;
  joined_date?: string;
  avatar?: string;
  related_accounts?: {
    platform: string;
    username?: string;
    url: string;
    icon?: string;
  }[];
}

export interface HistoryItem {
  id: number;
  search_type: string;
  query: string;
  results_count: number;
  created_at: string;
  results?: any[];
}

export interface ApiTokenItem {
  token: string;
  requests_total: number;
  requests_used: number;
  created_at: string;
  expires_at: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
