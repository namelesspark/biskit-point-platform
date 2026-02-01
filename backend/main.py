# backend/main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
import youtube_service
import quiz_service
import chat_service
import whisper_service
import firebase_service

app = Flask(__name__)
CORS(app, origins="*")

# 세션 저장소
sessions = {}


# ==================== YouTube API ====================
@app.route('/api/youtube/load', methods=['POST'])
def load_youtube_video():
    """YouTube 영상 로드 및 자막 추출"""
    try:
        data = request.json
        video_url = data.get('video_url')
        user_id = data.get('user_id', 'guest')

        result = youtube_service.get_transcript(video_url)
        transcript = result.get('transcript')
        
        if not transcript:
            raise Exception("자막을 불러올 수 없습니다.")

        # 10분 미만 체크
        duration = result.get('duration', 600)
        quiz_count = quiz_service.calculate_quiz_count(duration)

        # 세션 저장
        sessions[user_id] = {
            'video_id': result['video_id'],
            'transcript': transcript,
            'duration': duration,
            'title': result.get('title', ''),
            'current_score': 0,
            'conversation_history': []
        }

        return jsonify({
            'success': True,
            'video_id': result['video_id'],
            'duration': duration,
            'title': result.get('title', ''),
            'thumbnail': result.get('thumbnail', ''),
            'transcript_preview': transcript['text'][:300],
            'source': transcript.get('source', 'youtube'),
            'fixed_quiz_count': quiz_count  # 10분 미만이면 1, 아니면 null
        })
    
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/youtube/summarize', methods=['POST'])
def summarize_youtube():
    """YouTube 자막 AI 요약"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')

        if user_id not in sessions:
            raise Exception("먼저 영상을 로드하세요.")

        transcript_text = sessions[user_id]['transcript']['text']
        summary = chat_service.summarize_transcript(transcript_text)

        return jsonify({
            'success': True,
            'summary': summary
        })

    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== Quiz API ====================
@app.route('/api/quiz/generate', methods=['POST'])
def generate_quiz():
    """퀴즈 생성 (현재 시청 시간까지의 내용으로)"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        current_time = data.get('current_time', 0)
        num_quizzes = data.get('num_quizzes', 1)
        
        # ★ transcript를 직접 전달받을 수 있도록 수정
        direct_transcript = data.get('transcript', None)

        # ★ 직접 전달된 transcript가 있으면 그것 사용
        if direct_transcript:
            timestamps = data.get('timestamps', [])
            
            if timestamps and current_time > 0:
                # ★ timestamps 기반으로 현재 시간까지 텍스트 추출
                filtered_text = get_transcript_until_time(timestamps, current_time)
            else:
                # timestamps 없으면 전체 사용
                filtered_text = direct_transcript
        else:
            # 기존 세션 기반 로직
            if user_id not in sessions:
                return jsonify({
                    'success': False,
                    'error': '세션을 찾을 수 없습니다.'
                }), 404

            session = sessions[user_id]
            transcript = session['transcript']
            
            # 현재 시간까지의 자막만 추출
            if 'timestamps' in transcript and current_time > 0:
                filtered_text = youtube_service.get_transcript_until_time(
                    transcript['timestamps'], 
                    current_time
                )
            else:
                filtered_text = transcript.get('text', '')
        
        print(f"📌 퀴즈 생성에 사용할 텍스트 (앞 100자): {filtered_text[:100]}...")

        # 퀴즈 생성
        quizzes = quiz_service.generate_quiz_from_segment(filtered_text, num_quizzes)

        if not quizzes:
            raise Exception("퀴즈 생성에 실패했습니다.")

        print(f'✅ 퀴즈 생성 완료: {len(quizzes)}개')

        return jsonify({
            'success': True,
            'quizzes': quizzes,
            'quiz_count': len(quizzes)
        })

    except Exception as e:
        print(f"❌ 퀴즈 생성 에러: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/quiz/schedule', methods=['POST'])
def schedule_quizzes():
    """퀴즈 스케줄 생성 (출제 시간 계산)"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        num_quizzes = data.get('num_quizzes', 5)

        if user_id not in sessions:
            return jsonify({
                'success': False,
                'error': '세션을 찾을 수 없습니다.'
            }), 404

        session = sessions[user_id]

        # 🎯 session에서 duration 가져오기
        duration = session.get('duration', 0)
        
        if not duration or duration <= 0:
            print(f"❌ duration이 없거나 0입니다: {duration}")
            return jsonify({
                'success': False,
                'error': '영상 길이 정보가 없습니다.'
            }), 400
        
        # 10분 미만이면 퀴즈 1개 고정
        if duration < 600:
            num_quizzes = 1

        quiz_times = quiz_service.calculate_quiz_times(duration, num_quizzes)

        print(f'✅ 퀴즈 타임 생성 완료: {quiz_times}')

        return jsonify({
            'success': True,
            'quiz_times': quiz_times,
            'total_quizzes': len(quiz_times)
        })

    except Exception as e:
        print(f"❌ 에러: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/quiz/submit', methods=['POST'])
def submit_quiz():
    """퀴즈 제출"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        user_answer = data.get('answer')
        correct_answer = data.get('correct_answer')
        
        is_correct = quiz_service.check_answer(user_answer, correct_answer)
        score = quiz_service.calculate_score(is_correct)
        
        if user_id in sessions:
            sessions[user_id]['current_score'] += score
        
        return jsonify({
            'success': True,
            'is_correct': is_correct,
            'score': score,
            'total_score': sessions.get(user_id, {}).get('current_score', 0)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== Chat API ====================
@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """AI 챗봇 대화"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({'success': False, 'error': '메시지를 입력하세요'}), 400
        
        if user_id not in sessions:
            return jsonify({'success': False, 'error': '먼저 영상을 로드하세요'}), 400
        
        transcript_text = sessions[user_id]['transcript']['text']
        conversation_history = sessions[user_id].get('conversation_history', [])
        
        assistant_response = chat_service.chat(
            transcript_text,
            user_message,
            conversation_history
        )
        
        # 대화 기록 업데이트
        sessions[user_id]['conversation_history'].extend([
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": assistant_response}
        ])
        
        # 최근 20개만 유지
        if len(sessions[user_id]['conversation_history']) > 20:
            sessions[user_id]['conversation_history'] = sessions[user_id]['conversation_history'][-20:]
        
        return jsonify({
            'success': True,
            'response': assistant_response
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== Whisper API ====================
@app.route('/api/whisper/transcribe', methods=['POST'])
def transcribe_audio():
    """실시간 음성 청크 전사"""
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': '오디오 파일 없음'}), 400
        
        audio_file = request.files['audio']
        
        transcript = whisper_service.transcribe(audio_file)
        
        return jsonify({
            'success': True,
            'transcript': transcript
        })
        
    except Exception as e:
        print(f"❌ 전사 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/whisper/extract', methods=['POST'])
def extract_video_audio():
    """비디오에서 오디오 추출 후 전사"""
    try:
        if 'video' not in request.files:
            return jsonify({'success': False, 'error': '비디오 파일이 없습니다'}), 400

        video_file = request.files['video']
        user_id = request.form.get('user_id', 'guest')
        
        result = whisper_service.extract_and_transcribe(video_file)
        
        sessions[user_id] = {
            'video_file': video_file.filename,
            'transcript': {'text': result['transcript']},
            'current_score': 0,
            'conversation_history': []
        }
        
        return jsonify({
            'success': True,
            'transcript': result['transcript'],
            'duration': result['duration'],
            'timestamps': result['timestamps']
        })

    except Exception as e:
        print(f"❌ 비디오 처리 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500



# ==================== Video Complete API ====================
@app.route('/api/video/complete', methods=['POST'])
def complete_video():
    """영상 시청 완료"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        video_id = data.get('video_id')
        video_title = data.get('video_title', '')
        video_type = data.get('video_type', 'youtube')
        duration = data.get('duration', 0)
        quiz_score = data.get('quiz_score', 0)

        if user_id == 'guest':
            return jsonify({'success': False, 'error': '로그인이 필요합니다.'}), 401

        already_watched = firebase_service.is_video_watched(user_id, video_id)
        
        if already_watched:
            total_points = firebase_service.get_total_points(user_id)
            return jsonify({
                'success': True,
                'message': '이미 시청한 영상입니다.',
                'total_points': total_points,
                'already_watched': True,
                'points_earned': 0
            })

        points_earned = int(duration / 60)  # 1분 = 1점
        
        firebase_service.add_watched_video(
            user_id=user_id,
            video_id=video_id,
            video_title=video_title,
            video_type=video_type,
            duration=duration,
            points_earned=points_earned,
            quiz_score=quiz_score
        )
        
        total_points = firebase_service.get_total_points(user_id)
        
        return jsonify({
            'success': True,
            'message': '영상 시청 완료!',
            'points_earned': points_earned,
            'total_points': total_points,
            'already_watched': False
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== Bookmark API ====================
@app.route('/api/bookmark/add', methods=['POST'])
def add_bookmark():
    """즐겨찾기 추가"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        
        if user_id == 'guest':
            return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
        
        success = firebase_service.add_bookmark(
            user_id=user_id,
            video_id=data.get('video_id'),
            video_title=data.get('video_title', ''),
            video_type=data.get('video_type', 'youtube'),
            thumbnail_url=data.get('thumbnail_url', '')
        )
        
        return jsonify({
            'success': success,
            'message': '즐겨찾기에 추가되었습니다.' if success else '이미 즐겨찾기에 있습니다.'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/bookmark/list', methods=['GET'])
def list_bookmarks():
    """즐겨찾기 목록"""
    user_id = request.args.get('user_id', 'guest')
    if user_id == 'guest':
        return jsonify({'success': True, 'bookmarks': []})
    
    bookmarks = firebase_service.get_bookmarks(user_id)
    return jsonify({'success': True, 'bookmarks': bookmarks})


@app.route('/api/bookmark/remove', methods=['POST'])
def remove_bookmark():
    """즐겨찾기 삭제"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        
        if user_id == 'guest':
            return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
        
        success = firebase_service.remove_bookmark(user_id, data.get('video_id'))
        return jsonify({
            'success': success,
            'message': '즐겨찾기에서 삭제되었습니다.' if success else '삭제 실패'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== Ranking API ====================
@app.route('/api/ranking/list', methods=['GET'])
def get_rankings():
    """랭킹 목록"""
    limit = request.args.get('limit', 50, type=int)
    rankings = firebase_service.get_rankings(limit)
    return jsonify({'success': True, 'rankings': rankings})


@app.route('/api/ranking/my', methods=['GET'])
def get_my_rank():
    """내 랭킹"""
    user_id = request.args.get('user_id', 'guest')
    if user_id == 'guest':
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    
    rank_info = firebase_service.get_user_rank(user_id)
    return jsonify({'success': True, 'rank': rank_info})


@app.route('/api/ranking/visibility', methods=['POST'])
def update_ranking_visibility():
    """랭킹 표시 설정"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        show_in_ranking = data.get('show_in_ranking', True)
        
        if user_id == 'guest':
            return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
        
        success = firebase_service.update_ranking_visibility(user_id, show_in_ranking)
        return jsonify({
            'success': success,
            'message': '설정이 저장되었습니다.' if success else '저장 실패'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== User API ====================
@app.route('/api/user/profile', methods=['GET', 'POST'])
def user_profile():
    """사용자 프로필 조회/생성"""
    if request.method == 'GET':
        user_id = request.args.get('user_id', 'guest')
        if user_id == 'guest':
            return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
        
        profile = firebase_service.get_user_profile(user_id)
        return jsonify({'success': bool(profile), 'profile': profile})
    
    elif request.method == 'POST':
        # 회원가입 시 프로필 생성
        try:
            data = request.json
            user_id = data.get('user_id')
            email = data.get('email', '')
            display_name = data.get('displayName', '')
            department = data.get('department', '')
            gender = data.get('gender', '')
            year = data.get('year', '')
            
            if not user_id:
                return jsonify({'success': False, 'message': 'user_id가 필요합니다.'}), 400
            
            profile = firebase_service.create_user_profile(
                user_id=user_id,
                email=email,
                display_name=display_name,
                department=department,
                gender=gender,
                year=year
            )
            
            return jsonify({'success': bool(profile), 'profile': profile})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/user/watched', methods=['GET'])
def get_watched_videos():
    """시청 기록"""
    user_id = request.args.get('user_id', 'guest')
    if user_id == 'guest':
        return jsonify({'success': True, 'watched_videos': []})
    
    watched = firebase_service.get_watched_videos(user_id)
    return jsonify({'success': True, 'watched_videos': watched})


@app.route('/api/user/settings', methods=['POST'])
def update_settings():
    """사용자 설정 업데이트"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        settings = data.get('settings', {})
        
        if user_id == 'guest':
            return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
        
        success = firebase_service.update_user_settings(user_id, settings)
        return jsonify({'success': success})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== Uploaded Lectures API ====================
@app.route('/api/lectures/list', methods=['GET'])
def get_lectures():
    """업로드된 강의 목록"""
    lectures = firebase_service.get_uploaded_lectures()
    return jsonify({'success': True, 'lectures': lectures})


@app.route('/api/lectures/get', methods=['GET'])
def get_lecture():
    """개별 강의 조회"""
    lecture_id = request.args.get('lecture_id')
    user_id = request.args.get('user_id', 'guest')
    
    if not lecture_id:
        return jsonify({'success': False, 'error': '강의 ID가 필요합니다.'}), 400
    
    lecture = firebase_service.get_lecture_by_id(lecture_id)
    if not lecture:
        return jsonify({'success': False, 'error': '강의를 찾을 수 없습니다.'}), 404
    
    already_watched = firebase_service.is_video_watched(user_id, f'lecture_{lecture_id}') if user_id != 'guest' else False
    is_bookmarked = firebase_service.is_bookmarked(user_id, f'lecture_{lecture_id}') if user_id != 'guest' else False
    
    return jsonify({
        'success': True,
        'lecture': lecture,
        'alreadyWatched': already_watched,
        'isBookmarked': is_bookmarked
    })


@app.route('/api/lectures/upload', methods=['POST'])
def upload_lecture():
    try:
        # 비디오 파일 받기
        video_file = request.files.get('video')
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        
        if not video_file:
            return jsonify({'success': False, 'message': '비디오 파일이 필요합니다'})
        
        # 임시 저장
        temp_video = f'/tmp/{video_file.filename}'
        temp_thumb = f'/tmp/thumb_{video_file.filename}.jpg'
        video_file.save(temp_video)
        
        # ffmpeg로 썸네일 추출 (5초 지점)
        subprocess.run([
            'ffmpeg', '-i', temp_video, '-ss', '00:00:05',
            '-vframes', '1', '-q:v', '2', temp_thumb, '-y'
        ], capture_output=True)
        
        # Firebase Storage에 업로드
        video_url = firebase_service.upload_file_to_storage(temp_video, f'lectures/{video_file.filename}')
        thumbnail_url = firebase_service.upload_file_to_storage(temp_thumb, f'thumbnails/{video_file.filename}.jpg')
        
        # Firestore에 저장
        lecture_data = {
            'title': title,
            'description': description,
            'videoUrl': video_url,
            'thumbnailUrl': thumbnail_url,
            'transcript': result['transcript'],
            'duration': result['duration'],
            'timestamps': result.get('timestamps', [])
        }
        lecture_id = firebase_service.add_uploaded_lecture(lecture_data)
        
        # 임시 파일 삭제
        os.remove(temp_video)
        os.remove(temp_thumb)
        
        return jsonify({'success': True, 'lecture_id': lecture_id})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/lectures/delete', methods=['POST'])
def delete_lecture():
    """강의 삭제"""
    try:
        data = request.json
        lecture_id = data.get('lecture_id')
        if firebase_service.delete_lecture(lecture_id):
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': '삭제 실패'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/offline/session', methods=['POST'])
def set_offline_session():
    """오프라인 녹취록 세션 설정"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        transcript = data.get('transcript', '')
        
        sessions[user_id] = {
            'video_id': 'offline_recording',
            'transcript': {'text': transcript},
            'duration': 0,
            'title': '오프라인 강의 녹취록',
            'current_score': 0,
            'conversation_history': []
        }
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/lectures/session', methods=['POST'])
def set_lecture_session():
    """강의 세션 설정 (ChatPanel용)"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        transcript = data.get('transcript', '')
        lecture_id = data.get('lecture_id', '')
        duration = data.get('duration', 0)

        
        # user_id 기반 세션 저장
        sessions[user_id] = {
            'video_id': f'lecture_{lecture_id}',
            'transcript': {'text': transcript},
            'duration': duration,
            'title': '',
            'current_score': 0,
            'conversation_history': []
        }

        return jsonify({'success': True})
        
    except Exception as e:
        print(f'❌ 세션 생성 실패: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== Offline Transcripts API ====================
@app.route('/api/offline/transcripts/save', methods=['POST'])
def save_offline_transcript():
    """녹취록 저장"""
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id or user_id == 'guest':
            return jsonify({'success': False, 'error': '로그인이 필요합니다.'}), 401
        
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        subject = data.get('subject', '')
        
        if not title:
            return jsonify({'success': False, 'error': '제목을 입력해주세요.'}), 400
        if not content:
            return jsonify({'success': False, 'error': '녹취록 내용이 없습니다.'}), 400
        
        transcript_id = firebase_service.save_offline_transcript(user_id, title, content, subject)
        
        if transcript_id:
            return jsonify({'success': True, 'transcript_id': transcript_id})
        return jsonify({'success': False, 'error': '저장 실패'}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/offline/transcripts/list', methods=['GET'])
def get_offline_transcripts():
    """녹취록 목록"""
    user_id = request.args.get('user_id', 'guest')
    if user_id == 'guest':
        return jsonify({'success': True, 'transcripts': []})
    
    transcripts = firebase_service.get_offline_transcripts(user_id)
    return jsonify({'success': True, 'transcripts': transcripts})


@app.route('/api/offline/transcripts/get', methods=['GET'])
def get_offline_transcript():
    """개별 녹취록 조회"""
    transcript_id = request.args.get('transcript_id')
    if not transcript_id:
        return jsonify({'success': False, 'error': 'ID가 필요합니다.'}), 400
    
    transcript = firebase_service.get_offline_transcript_by_id(transcript_id)
    if transcript:
        return jsonify({'success': True, 'transcript': transcript})
    return jsonify({'success': False, 'error': '찾을 수 없습니다.'}), 404


@app.route('/api/offline/transcripts/delete', methods=['POST'])
def delete_offline_transcript():
    """녹취록 삭제"""
    try:
        data = request.json
        user_id = data.get('user_id')
        transcript_id = data.get('transcript_id')
        
        if not user_id or user_id == 'guest':
            return jsonify({'success': False, 'error': '로그인이 필요합니다.'}), 401
        
        if firebase_service.delete_offline_transcript(transcript_id, user_id):
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': '삭제 실패'}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
        

# ==================== Messages API (쪽지) ====================
@app.route('/api/messages/list', methods=['GET'])
def get_messages():
    """쪽지 목록"""
    user_id = request.args.get('user_id', 'guest')
    msg_type = request.args.get('type', 'received')
    
    if user_id == 'guest':
        return jsonify({'success': True, 'messages': []})
    
    messages = firebase_service.get_messages(user_id, msg_type)
    return jsonify({'success': True, 'messages': messages})


@app.route('/api/messages/send', methods=['POST'])
def send_message():
    """쪽지 보내기"""
    try:
        data = request.json
        sender_id = data.get('sender_id')
        sender_name = data.get('sender_name', '익명')
        receiver_id = data.get('receiver_id')
        receiver_name = data.get('receiver_name', '익명')
        content = data.get('content', '').strip()
        
        if not sender_id or sender_id == 'guest':
            return jsonify({'success': False, 'error': '로그인이 필요합니다.'}), 401
        if not receiver_id:
            return jsonify({'success': False, 'error': '받는 사람을 지정해주세요.'}), 400
        if not content:
            return jsonify({'success': False, 'error': '내용을 입력해주세요.'}), 400
        if sender_id == receiver_id:
            return jsonify({'success': False, 'error': '자신에게는 쪽지를 보낼 수 없습니다.'}), 400
        
        message_id = firebase_service.send_message(sender_id, sender_name, receiver_id, receiver_name, content)
        if message_id:
            return jsonify({'success': True, 'message_id': message_id})
        return jsonify({'success': False, 'error': '전송 실패'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/messages/read', methods=['POST'])
def mark_message_read():
    """쪽지 읽음 처리"""
    try:
        data = request.json
        message_id = data.get('message_id')
        if firebase_service.mark_message_read(message_id):
            return jsonify({'success': True})
        return jsonify({'success': False}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/messages/delete', methods=['POST'])
def delete_message():
    """쪽지 삭제"""
    try:
        data = request.json
        message_id = data.get('message_id')
        if firebase_service.delete_message(message_id):
            return jsonify({'success': True})
        return jsonify({'success': False}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/messages/unread-count', methods=['GET'])
def get_unread_count():
    """읽지 않은 쪽지 수"""
    user_id = request.args.get('user_id', 'guest')
    if user_id == 'guest':
        return jsonify({'success': True, 'count': 0})
    
    count = firebase_service.get_unread_count(user_id)
    return jsonify({'success': True, 'count': count})


# ==================== Community API ====================
@app.route('/api/community/list', methods=['GET'])
def get_community_posts():
    """커뮤니티 글 목록"""
    category = request.args.get('category', '')
    posts = firebase_service.get_community_posts(category if category else None)
    return jsonify({'success': True, 'posts': posts})


@app.route('/api/community/create', methods=['POST'])
def create_community_post():
    """커뮤니티 글 작성"""
    try:
        data = request.json
        user_id = data.get('user_id')
        if not user_id or user_id == 'guest':
            return jsonify({'success': False, 'error': '로그인이 필요합니다.'}), 401
        
        post_id = firebase_service.create_community_post(
            user_id=user_id,
            author=data.get('author', '익명'),
            title=data.get('title', ''),
            content=data.get('content', ''),
            category=data.get('category', '자유게시판')
        )
        if post_id:
            return jsonify({'success': True, 'post_id': post_id})
        return jsonify({'success': False, 'error': '작성 실패'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/community/scrap', methods=['POST'])
def scrap_community_post():
    """커뮤니티 글 스크랩"""
    try:
        data = request.json
        user_id = data.get('user_id')
        post_id = data.get('post_id')
        
        if not user_id or user_id == 'guest':
            return jsonify({'success': False, 'error': '로그인이 필요합니다.'}), 401
        
        if firebase_service.scrap_post(user_id, post_id):
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': '이미 스크랩한 글입니다.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 BISKIT POINT 백엔드 서버 시작...")
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5000)