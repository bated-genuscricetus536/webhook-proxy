/**
 * Telegram Bot Webhook Adapter for Cloudflare Workers
 * 
 * 参考文档：
 * - https://core.telegram.org/bots/api#setwebhook
 * - https://core.telegram.org/bots/api#update
 */

export interface TelegramConfig {
  botToken: string;
  secretToken?: string;
  verifySignature: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  inline_query?: any;
  chosen_inline_result?: any;
  callback_query?: any;
  shipping_query?: any;
  pre_checkout_query?: any;
  poll?: any;
  poll_answer?: any;
  my_chat_member?: any;
  chat_member?: any;
  chat_join_request?: any;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  forward_from?: TelegramUser;
  forward_from_chat?: TelegramChat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_sender_name?: string;
  forward_date?: number;
  reply_to_message?: TelegramMessage;
  via_bot?: TelegramUser;
  edit_date?: number;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
  entities?: any[];
  animation?: any;
  audio?: any;
  document?: any;
  photo?: any[];
  sticker?: any;
  video?: any;
  video_note?: any;
  voice?: any;
  caption?: string;
  caption_entities?: any[];
  contact?: any;
  dice?: any;
  game?: any;
  poll?: any;
  venue?: any;
  location?: any;
  new_chat_members?: TelegramUser[];
  left_chat_member?: TelegramUser;
  new_chat_title?: string;
  new_chat_photo?: any[];
  delete_chat_photo?: boolean;
  group_chat_created?: boolean;
  supergroup_chat_created?: boolean;
  channel_chat_created?: boolean;
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: TelegramMessage;
  invoice?: any;
  successful_payment?: any;
  connected_website?: string;
  passport_data?: any;
  reply_markup?: any;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo?: any;
  bio?: string;
  description?: string;
  invite_link?: string;
  pinned_message?: TelegramMessage;
  permissions?: any;
  slow_mode_delay?: number;
  message_auto_delete_time?: number;
  has_protected_content?: boolean;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
  linked_chat_id?: number;
  location?: any;
}

export interface TelegramWebhookEvent {
  id: string;
  platform: 'telegram';
  type: string; // 'message', 'edited_message', 'callback_query', etc.
  timestamp: number;
  headers: Record<string, string>;
  payload: TelegramUpdate;
  data: {
    update_id: number;
    event_type: string;
    chat_id?: number;
    user_id?: number;
    message_text?: string;
  };
}

export class TelegramAdapter {
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  /**
   * 处理 Telegram Webhook 请求
   */
  async handleWebhook(request: Request): Promise<Response> {
    console.log('[Telegram] Incoming webhook request');

    // 读取请求体
    const body = await request.text();
    console.log('[Telegram] Request body preview:', body.substring(0, 200) + '...');

    // 验证签名
    if (this.config.verifySignature && this.config.secretToken) {
      const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      
      if (!secretToken) {
        console.error('[Telegram] Missing X-Telegram-Bot-Api-Secret-Token header');
        return new Response('Unauthorized: Missing secret token', { status: 401 });
      }

      if (secretToken !== this.config.secretToken) {
        console.error('[Telegram] Invalid secret token');
        return new Response('Unauthorized: Invalid secret token', { status: 401 });
      }

      console.log('[Telegram] Secret token verified successfully');
    } else {
      console.log('[Telegram] Signature verification disabled');
    }

    // 解析更新数据
    let update: TelegramUpdate;
    try {
      update = JSON.parse(body);
    } catch (error) {
      console.error('[Telegram] Failed to parse update:', error);
      return new Response('Bad request: Invalid JSON', { status: 400 });
    }

    console.log('[Telegram] Update ID:', update.update_id);
    console.log('[Telegram] Update type:', this.getUpdateType(update));

    // Telegram 期望 200 OK 响应
    return new Response('OK', { status: 200 });
  }

  /**
   * 转换 Telegram 更新为标准事件格式
   */
  transform(update: TelegramUpdate): TelegramWebhookEvent {
    const eventType = this.getUpdateType(update);
    const timestamp = Date.now();

    // 提取核心数据
    let chatId: number | undefined;
    let userId: number | undefined;
    let messageText: string | undefined;

    if (update.message) {
      chatId = update.message.chat.id;
      userId = update.message.from?.id;
      messageText = update.message.text;
    } else if (update.edited_message) {
      chatId = update.edited_message.chat.id;
      userId = update.edited_message.from?.id;
      messageText = update.edited_message.text;
    } else if (update.callback_query) {
      chatId = update.callback_query.message?.chat?.id;
      userId = update.callback_query.from?.id;
    }

    const event: TelegramWebhookEvent = {
      id: `telegram-${update.update_id}-${timestamp}`,
      platform: 'telegram',
      type: eventType,
      timestamp,
      headers: {},
      payload: update,
      data: {
        update_id: update.update_id,
        event_type: eventType,
        chat_id: chatId,
        user_id: userId,
        message_text: messageText,
      },
    };

    console.log('[Telegram] Transformed event:', {
      id: event.id,
      type: event.type,
      chat_id: chatId,
      user_id: userId,
    });

    return event;
  }

  /**
   * 获取更新类型
   */
  private getUpdateType(update: TelegramUpdate): string {
    if (update.message) return 'message';
    if (update.edited_message) return 'edited_message';
    if (update.channel_post) return 'channel_post';
    if (update.edited_channel_post) return 'edited_channel_post';
    if (update.inline_query) return 'inline_query';
    if (update.chosen_inline_result) return 'chosen_inline_result';
    if (update.callback_query) return 'callback_query';
    if (update.shipping_query) return 'shipping_query';
    if (update.pre_checkout_query) return 'pre_checkout_query';
    if (update.poll) return 'poll';
    if (update.poll_answer) return 'poll_answer';
    if (update.my_chat_member) return 'my_chat_member';
    if (update.chat_member) return 'chat_member';
    if (update.chat_join_request) return 'chat_join_request';
    return 'unknown';
  }
}

/**
 * 创建 Telegram 适配器
 */
export function createTelegramAdapter(config: TelegramConfig): TelegramAdapter {
  return new TelegramAdapter(config);
}

