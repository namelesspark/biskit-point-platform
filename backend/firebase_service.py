# backend/firebase_service.py
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os

# Firebase 초기화
cred_path = os.path.join(os.path.dirname(__file__), 'firebase-adminsdk.json')

if not firebase_admin._apps:
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        print("⚠️ Firebase 인증서 없음 - 로컬 모드")

try:
    db = firestore.client()
except:
    db = None
    print("⚠️ Firebase 연결 실패 - 로컬 모드")


# ==================== 사용자 프로필 ====================
def get_user_profile(user_id):
    if not db: return None
    try:
        doc = db.collection('users').document(user_id).get()
        return doc.to_dict() if doc.exists else None
    except:
        return None


def create_user_profile(user_id, email, display_name):
    if not db: return None
    try:
        profile_data = {
            'email': email,
            'displayName': display_name,
            'createdAt': datetime.now(),
            'totalPoints': 0,
            'showInRanking': True,
            'settings': { 'notifications': True, 'darkMode': False }
        }
        db.collection('users').document(user_id).set(profile_data)
        return profile_data
    except:
        return None


def update_user_settings(user_id, settings):
    if not db: return False
    try:
        db.collection('users').document(user_id).update({'settings': settings})
        return True
    except:
        return False


def update_ranking_visibility(user_id, show_in_ranking):
    if not db: return False
    try:
        db.collection('users').document(user_id).update({'showInRanking': show_in_ranking})
        return True
    except:
        return False


# ==================== 시청 기록 ====================
def get_watched_videos(user_id):
    if not db: return []
    try:
        docs = db.collection('users').document(user_id).collection('watchedVideos').stream()
        return [{'videoId': doc.id, **doc.to_dict()} for doc in docs]
    except:
        return []


def is_video_watched(user_id, video_id):
    if not db: return False
    try:
        doc = db.collection('users').document(user_id).collection('watchedVideos').document(video_id).get()
        return doc.exists
    except:
        return False


def add_watched_video(user_id, video_id, video_title, video_type, duration, points_earned, quiz_score=0):
    if not db: return False
    try:
        if is_video_watched(user_id, video_id): return False
        
        watch_data = {
            'videoId': video_id, 'videoTitle': video_title, 'videoType': video_type,
            'duration': duration, 'pointsEarned': points_earned, 'quizScore': quiz_score,
            'completedAt': datetime.now()
        }
        db.collection('users').document(user_id).collection('watchedVideos').document(video_id).set(watch_data)
        
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            current_points = user_doc.to_dict().get('totalPoints', 0)
            user_ref.update({'totalPoints': current_points + points_earned})
        return True
    except:
        return False


def get_total_points(user_id):
    if not db: return 0
    try:
        doc = db.collection('users').document(user_id).get()
        return doc.to_dict().get('totalPoints', 0) if doc.exists else 0
    except:
        return 0


# ==================== 즐겨찾기 ====================
def add_bookmark(user_id, video_id, video_title, video_type, thumbnail_url=''):
    if not db: return False
    try:
        doc = db.collection('users').document(user_id).collection('bookmarks').document(video_id).get()
        if doc.exists: return False
        
        bookmark_data = {
            'videoId': video_id, 'videoTitle': video_title, 'videoType': video_type,
            'thumbnailUrl': thumbnail_url, 'addedAt': datetime.now()
        }
        db.collection('users').document(user_id).collection('bookmarks').document(video_id).set(bookmark_data)
        return True
    except:
        return False


def get_bookmarks(user_id):
    if not db: return []
    try:
        docs = db.collection('users').document(user_id).collection('bookmarks').stream()
        bookmarks = [{'videoId': doc.id, **doc.to_dict()} for doc in docs]
        bookmarks.sort(key=lambda x: x.get('addedAt', datetime.min), reverse=True)
        return bookmarks
    except:
        return []


def remove_bookmark(user_id, video_id):
    if not db: return False
    try:
        db.collection('users').document(user_id).collection('bookmarks').document(video_id).delete()
        return True
    except:
        return False


def is_bookmarked(user_id, video_id):
    if not db: return False
    try:
        doc = db.collection('users').document(user_id).collection('bookmarks').document(video_id).get()
        return doc.exists
    except:
        return False


# ==================== 랭킹 ====================
def get_rankings(limit=50):
    if not db: return []
    try:
        docs = db.collection('users')\
            .where('showInRanking', '==', True)\
            .order_by('totalPoints', direction=firestore.Query.DESCENDING)\
            .limit(limit).stream()
        
        return [{'rank': i, 'userId': doc.id, 'displayName': doc.to_dict().get('displayName', '익명'),
                 'totalPoints': doc.to_dict().get('totalPoints', 0)} for i, doc in enumerate(docs, 1)]
    except:
        return []


def get_user_rank(user_id):
    if not db: return None
    try:
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists: return None
        
        user_data = user_doc.to_dict()
        user_points = user_data.get('totalPoints', 0)
        higher_count = db.collection('users').where('totalPoints', '>', user_points).count().get()[0][0].value
        
        return {'rank': higher_count + 1, 'totalPoints': user_points, 'showInRanking': user_data.get('showInRanking', True)}
    except:
        return None


# ==================== 업로드 강의 ====================
def get_uploaded_lectures():
    if not db: return []
    try:
        docs = db.collection('lectures').order_by('createdAt', direction=firestore.Query.DESCENDING).stream()
        lectures = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if data.get('createdAt'):
                data['createdAt'] = data['createdAt'].isoformat() if hasattr(data['createdAt'], 'isoformat') else str(data['createdAt'])
            lectures.append(data)
        return lectures
    except:
        return []


def get_lecture_by_id(lecture_id):
    if not db: return None
    try:
        doc = db.collection('lectures').document(lecture_id).get()
        if not doc.exists: return None
        
        data = doc.to_dict()
        data['id'] = doc.id
        
        # 조회수 증가
        db.collection('lectures').document(lecture_id).update({
            'viewCount': firestore.Increment(1)
        })
        
        if data.get('createdAt'):
            data['createdAt'] = data['createdAt'].isoformat() if hasattr(data['createdAt'], 'isoformat') else str(data['createdAt'])
        return data
    except:
        return None


def add_uploaded_lecture(lecture_data):
    if not db: return None
    try:
        lecture_data['createdAt'] = datetime.now()
        lecture_data['viewCount'] = 0
        doc_ref = db.collection('lectures').add(lecture_data)
        return doc_ref[1].id
    except:
        return None


def delete_lecture(lecture_id):
    if not db: return False
    try:
        db.collection('lectures').document(lecture_id).delete()
        return True
    except:
        return False


# ==================== 메시지 (쪽지) ====================
def send_message(sender_id, sender_name, receiver_id, receiver_name, content):
    if not db: return None
    try:
        message_data = {
            'senderId': sender_id,
            'senderName': sender_name,
            'receiverId': receiver_id,
            'receiverName': receiver_name,
            'content': content,
            'isRead': False,
            'createdAt': datetime.now()
        }
        doc_ref = db.collection('messages').add(message_data)
        return doc_ref[1].id
    except:
        return None


def get_messages(user_id, msg_type='received'):
    if not db: return []
    try:
        if msg_type == 'received':
            docs = db.collection('messages').where('receiverId', '==', user_id)\
                .order_by('createdAt', direction=firestore.Query.DESCENDING).stream()
        else:
            docs = db.collection('messages').where('senderId', '==', user_id)\
                .order_by('createdAt', direction=firestore.Query.DESCENDING).stream()
        
        messages = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if data.get('createdAt'):
                data['createdAt'] = data['createdAt'].isoformat() if hasattr(data['createdAt'], 'isoformat') else str(data['createdAt'])
            messages.append(data)
        return messages
    except:
        return []


def mark_message_read(message_id):
    if not db: return False
    try:
        db.collection('messages').document(message_id).update({'isRead': True})
        return True
    except:
        return False


def delete_message(message_id):
    if not db: return False
    try:
        db.collection('messages').document(message_id).delete()
        return True
    except:
        return False


def get_unread_count(user_id):
    if not db: return 0
    try:
        count = db.collection('messages')\
            .where('receiverId', '==', user_id)\
            .where('isRead', '==', False)\
            .count().get()[0][0].value
        return count
    except:
        return 0


# ==================== 커뮤니티 ====================
def get_community_posts(category=None):
    if not db: return []
    try:
        query = db.collection('communityPosts').order_by('createdAt', direction=firestore.Query.DESCENDING)
        if category:
            query = query.where('category', '==', category)
        
        posts = []
        for doc in query.stream():
            data = doc.to_dict()
            data['id'] = doc.id
            if data.get('createdAt'):
                data['createdAt'] = data['createdAt'].isoformat() if hasattr(data['createdAt'], 'isoformat') else str(data['createdAt'])
            posts.append(data)
        return posts
    except:
        return []


def create_community_post(user_id, author, title, content, category):
    if not db: return None
    try:
        post_data = {
            'authorId': user_id,
            'author': author,
            'title': title,
            'content': content,
            'category': category,
            'scraps': 0,
            'comments': 0,
            'createdAt': datetime.now()
        }
        doc_ref = db.collection('communityPosts').add(post_data)
        return doc_ref[1].id
    except:
        return None


def scrap_post(user_id, post_id):
    if not db: return False
    try:
        # 중복 스크랩 체크
        existing = db.collection('users').document(user_id).collection('scraps').document(post_id).get()
        if existing.exists: return False
        
        # 스크랩 저장
        db.collection('users').document(user_id).collection('scraps').document(post_id).set({
            'postId': post_id, 'scrapedAt': datetime.now()
        })
        
        # 게시글 스크랩 수 증가
        db.collection('communityPosts').document(post_id).update({
            'scraps': firestore.Increment(1)
        })
        return True
    except:
        return False
