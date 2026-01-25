import firebase_admin
from firebase_admin import credentials, firestroe
from datetime import datetime
import os

# Firebase 초기화
cred_path = os.path.join(os.path.dirname(__fire__), 'firebase-adminsdk.json')

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()




def get_user_profile(user_id):

    try:
        doc = db.collection('users').document(user_id).collection('profile').document('info').get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        print(f"❌ Firebase 사용자 프로필 가져오기 실패: {e}")
        return None




def create_user_profile(user_id, email, display_name):
    try:
        profile_data = {
            'email': email,
            'display_name': display_name,
            'created_at': datetime.now(),
            'totalPoints': 0
        }

        db.collection('users').document(user_id).collection('profile').document('info').set(profile_data)
        print(f"✅ 프로필 생성 완료: {user_id}")
        return profile_data
    except Exception as e:
        print(f"❌ 프로필 생성 실패: {e}")
        return None




def get_watched_videos(user_id):

    try:
        watched = []
        docs = db.collection('users').document(user_id).collection('watchedVideos').stream()

        for doc in docs:
            data = doc.to_dict()
            watched.append({
                'video_id': doc.id,
                **data
            })

        return watched
    except Exception as e:
        print(f"❌ 시청한 영상 가져오기 실패: {e}")
        return []



def is_video_watched(user_id, video_id):
    try:
        doc = db.collection('users').document(user_id).collection('watchedVideos').document(video_id).get()
        return doc.exists
    except Exception as e:
        print(f"❌ 영상 시청 여부 확인 실패: {e}")
        return False



def add_watched_video(user_id, video_id, video_title, video_type, duration, points_earned, quiz_score=0):
    """시청 기록 추가 + 점수 업데이트"""
    try:
        # 이미 시청했는지 확인
        if is_video_watched(user_id, video_id):
            print(f"⚠️ 이미 시청한 영상: {video_id}")
            return False
        
        # 시청 기록 추가
        watch_data = {
            'videoId': video_id,
            'videoTitle': video_title,
            'videoType': video_type,
            'duration': duration,
            'pointsEarned': points_earned,
            'quizScore': quiz_score,
            'completedAt': datetime.now()
        }
        
        db.collection('users').document(user_id).collection('watchedVideos').document(video_id).set(watch_data)
        
        # 총 점수 업데이트
        profile_ref = db.collection('users').document(user_id).collection('profile').document('data')
        profile = profile_ref.get()
        
        if profile.exists:
            current_points = profile.to_dict().get('totalPoints', 0)
            new_points = current_points + points_earned
            profile_ref.update({'totalPoints': new_points})
        else:
            profile_ref.set({'totalPoints': points_earned})
        
        print(f"✅ 시청 기록 추가: {video_id}, 점수: {points_earned}")
        return True
        
    except Exception as e:
        print(f"❌ 시청 기록 추가 실패: {e}")
        return False



def get_total_points(user_id):
    """사용자 총 점수 가져오기"""
    try:
        doc = db.collection('users').document(user_id).collection('profile').document('data').get()
        if doc.exists:
            return doc.to_dict().get('totalPoints', 0)
        return 0
    except Exception as e:
        print(f"❌ 점수 조회 실패: {e}")
        return 0



def add_bookmark(user_id, video_id, video_title, video_type, thumbnail_url=''):
    """즐겨찾기 추가"""
    try:
        # 중복 체크
        doc = db.collection('users').document(user_id).collection('bookmarks').document(video_id).get()
        if doc.exists:
            print(f"⚠️ 이미 즐겨찾기한 영상: {video_id}")
            return False
        
        bookmark_data = {
            'videoId': video_id,
            'videoTitle': video_title,
            'videoType': video_type,
            'thumbnailUrl': thumbnail_url,
            'addedAt': datetime.now()
        }
        
        db.collection('users').document(user_id).collection('bookmarks').document(video_id).set(bookmark_data)
        print(f"⭐ 즐겨찾기 추가: {video_id}")
        return True
        
    except Exception as e:
        print(f"❌ 즐겨찾기 추가 실패: {e}")
        return False



def get_bookmarks(user_id):
    """즐겨찾기 목록 가져오기"""
    try:
        bookmarks = []
        docs = db.collection('users').document(user_id).collection('bookmarks').stream()
        
        for doc in docs:
            data = doc.to_dict()
            bookmarks.append({
                'videoId': doc.id,
                **data
            })
        
        # 최근 추가순 정렬
        bookmarks.sort(key=lambda x: x.get('addedAt', datetime.min), reverse=True)
        return bookmarks
        
    except Exception as e:
        print(f"❌ 즐겨찾기 조회 실패: {e}")
        return []


def remove_bookmark(user_id, video_id):
    """즐겨찾기 삭제"""
    try:
        db.collection('users').document(user_id).collection('bookmarks').document(video_id).delete()
        print(f"✅ 즐겨찾기 삭제: {video_id}")
        return True
    except Exception as e:
        print(f"❌ 즐겨찾기 삭제 실패: {e}")
        return False