// src/config/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://11bf41f6df7a.ngrok-free.app ';
//'http://172.25.109.44:5000';

export const API_ENDPOINTS = {
  // YouTube
  YOUTUBE_LOAD: `${API_BASE_URL}/api/youtube/load`,
  YOUTUBE_SUMMARIZE: `${API_BASE_URL}/api/youtube/summarize`,
  YOUTUBE_SESSION: `${API_BASE_URL}/api/youtube/session`,
  
  // Quiz
  QUIZ_GENERATE: `${API_BASE_URL}/api/quiz/generate`,
  QUIZ_SCHEDULE: `${API_BASE_URL}/api/quiz/schedule`,
  QUIZ_SUBMIT: `${API_BASE_URL}/api/quiz/submit`,
  
  // Chat
  CHAT: `${API_BASE_URL}/api/chat`,
  
  // Whisper / Upload
  WHISPER_TRANSCRIBE: `${API_BASE_URL}/api/whisper/transcribe`,
  WHISPER_EXTRACT: `${API_BASE_URL}/api/whisper/extract`,
  UPLOAD_SESSION: `${API_BASE_URL}/api/upload/session`,
  
  // Offline
  OFFLINE_SESSION: `${API_BASE_URL}/api/offline/session`,
  
  // Video
  VIDEO_COMPLETE: `${API_BASE_URL}/api/video/complete`,
  
  // Bookmark
  BOOKMARK_ADD: `${API_BASE_URL}/api/bookmark/add`,
  BOOKMARK_LIST: `${API_BASE_URL}/api/bookmark/list`,
  BOOKMARK_REMOVE: `${API_BASE_URL}/api/bookmark/remove`,
  
  // Ranking
  RANKING_LIST: `${API_BASE_URL}/api/ranking/list`,
  RANKING_MY: `${API_BASE_URL}/api/ranking/my`,
  RANKING_VISIBILITY: `${API_BASE_URL}/api/ranking/visibility`,
  
  // User
  USER_PROFILE: `${API_BASE_URL}/api/user/profile`,
  USER_WATCHED: `${API_BASE_URL}/api/user/watched`,
  USER_SETTINGS: `${API_BASE_URL}/api/user/settings`,
  
  // Lectures
  LECTURES_LIST: `${API_BASE_URL}/api/lectures/list`,
  LECTURES_GET: `${API_BASE_URL}/api/lectures/get`,
  LECTURES_UPLOAD: `${API_BASE_URL}/api/lectures/upload`,
  LECTURES_DELETE: `${API_BASE_URL}/api/lectures/delete`,
  LECTURES_SESSION: `${API_BASE_URL}/api/lectures/session`,

  // Offline
  OFFLINE_SESSION: `${API_BASE_URL}/api/offline/session`,
  OFFLINE_TRANSCRIPTS_SAVE: `${API_BASE_URL}/api/offline/transcripts/save`,
  OFFLINE_TRANSCRIPTS_LIST: `${API_BASE_URL}/api/offline/transcripts/list`,
  OFFLINE_TRANSCRIPTS_GET: `${API_BASE_URL}/api/offline/transcripts/get`,
  OFFLINE_TRANSCRIPTS_DELETE: `${API_BASE_URL}/api/offline/transcripts/delete`,
    
  // Messages (쪽지)
  MESSAGES_LIST: `${API_BASE_URL}/api/messages/list`,
  MESSAGES_SEND: `${API_BASE_URL}/api/messages/send`,
  MESSAGES_READ: `${API_BASE_URL}/api/messages/read`,
  MESSAGES_DELETE: `${API_BASE_URL}/api/messages/delete`,
  MESSAGES_UNREAD: `${API_BASE_URL}/api/messages/unread-count`,
  
  // Community
  COMMUNITY_LIST: `${API_BASE_URL}/api/community/list`,
  COMMUNITY_CREATE: `${API_BASE_URL}/api/community/create`,
  COMMUNITY_SCRAP: `${API_BASE_URL}/api/community/scrap`
};
