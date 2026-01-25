# Flask 메인 애플리케이션
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
import youtube_service
import quiz_service
import chat_service
import whisper_service

app = Flask(__name__)
CORS(app, origins="*")
sessions = {}  # 세션 데이터 저장


@app.route('/api/video/load', methods=['POST'])
def load_video():
    """YouTube 영상 로드 및 자막 추출"""
    try:
        data = request.json
        video_url = data.get('video_url')
        user_id = data.get('user_id', 'guest')

        print(f"🌐 비디오 로드 요청: {video_url}")

        # YouTube 자막 및 영상 정보 추출
        result = youtube_service.get_transcript(video_url)
        transcript = result.get('transcript')
        duration = result.get('duration', 600)
        
        if not transcript:
            raise Exception("자막을 불러올 수 없습니다.")

        # 세션에 저장
        sessions[user_id] = {
            'video_id': result['video_id'],
            'transcript': transcript,
            'current_score': 0,
            'duration': duration,
            'conversation_history': []
        }

        return jsonify({
            'success': True,
            'video_id': result['video_id'],
            'duration': duration,
            'transcript_preview': transcript['text'][:200],
            'source': transcript.get('source', 'unknown')
        })
    
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/quiz/submit', methods=['POST'])
def submit_quiz():
    """퀴즈 제출 및 채점"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        user_answer = data.get('answer')
        correct_answer = data.get('correct_answer')
        
        # 정답 확인
        is_correct = quiz_service.check_answer(user_answer, correct_answer)
        
        # 점수 계산
        score = quiz_service.calculate_score(is_correct)
        
        # 세션 업데이트
        if user_id in sessions:
            sessions[user_id]['current_score'] += score
        
        return jsonify({
            'success': True,
            'is_correct': is_correct,
            'score': score,
            'total_score': sessions.get(user_id, {}).get('current_score', 0)
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """AI 챗봇 대화"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': '메시지를 입력하세요'
            }), 400
        
        # 세션 확인
        if user_id not in sessions:
            return jsonify({
                'success': False,
                'error': '먼저 영상을 로드하세요'
            }), 400
        
        # 자막 및 대화 히스토리 가져오기
        transcript_text = sessions[user_id]['transcript']['text']
        
        if 'conversation_history' not in sessions[user_id]:
            sessions[user_id]['conversation_history'] = []
        
        conversation_history = sessions[user_id]['conversation_history']
        
        # AI 응답 생성
        assistant_response = chat_service.chat(
            transcript_text,
            user_message,
            conversation_history
        )
        
        # 대화 히스토리 업데이트
        sessions[user_id]['conversation_history'].append({
            "role": "user",
            "content": user_message
        })
        sessions[user_id]['conversation_history'].append({
            "role": "assistant",
            "content": assistant_response
        })
        
        # 히스토리 길이 제한 (최근 20개만 유지)
        if len(sessions[user_id]['conversation_history']) > 20:
            sessions[user_id]['conversation_history'] = \
                sessions[user_id]['conversation_history'][-20:]
        
        return jsonify({
            'success': True,
            'response': assistant_response
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



@app.route('/api/whisper/transcribe', methods=['POST'])
def transcribe_audio():
    """오디오 파일을 텍스트로 변환"""
    try:
        if 'audio' not in request.files:
            return jsonify({
                'success': False,
                'error': '오디오 파일이 없습니다'
            }), 400

        audio_file = request.files['audio']
        user_id = request.form.get('user_id', 'guest')
        
        print(f"🎤 오디오 전사 요청: {audio_file.filename}")
        
        # Whisper로 변환
        transcript = whisper_service.transcribe(audio_file)
        
        # 세션에 저장 (챗봇용)
        if user_id not in sessions:
            sessions[user_id] = {
                'transcript': {'text': transcript},
                'conversation_history': []
            }
        else:
            # 기존 transcript에 추가
            if 'transcript' in sessions[user_id]:
                sessions[user_id]['transcript']['text'] += '\n' + transcript
            else:
                sessions[user_id]['transcript'] = {'text': transcript}
        
        return jsonify({
            'success': True,
            'transcript': transcript
        })

    except Exception as e:
        print(f"❌ Whisper 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/whisper/extract', methods=['POST'])
def extract_video_audio():
    """비디오에서 음성 추출 후 텍스트 변환"""
    try:
        if 'video' not in request.files:
            return jsonify({
                'success': False,
                'error': '비디오 파일이 없습니다'
            }), 400

        video_file = request.files['video']
        
        # 비디오에서 오디오 추출 후 Whisper 변환
        transcript = whisper_service.extract_and_transcribe(video_file)
        
        # 세션에 저장
        sessions[user_id] = {
            'video_file': video_file.filename,
            'transcript': {'text': transcript},
            'current_score': 0,
            'conversation_history': []
        }
        
        return jsonify({
            'success': True,
            'transcript': transcript
        })

    except Exception as e:
        print(f"❌ 비디오 처리 에러: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        

@app.route('/api/video/complete', methods=['POST'])
def complete_video():
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        video_id = data.get('video_id')
        video_title = data.get('video_title', '')
        video_type = data.get('video_type', 'youtube')
        duration = data.get('duration', '0')
        quiz_score = data.get('quiz_score', 0)

        if not video_id:
            raise ValueError("video_id가 필요합니다.")

        if user_id == 'guest':
            return jsonify({
                'success': False,
                'error': '게스트 사용자는 기록을 저장할 수 없습니다.'
            }), 401
            

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

        # 점수 계산 (1분 = 1점)
        points_earned = int(duration / 60)
        
        # Firebase에 시청 기록 추가
        success = firebase_service.add_watched_video(
            user_id=user_id,
            video_id=video_id,
            video_title=video_title,
            video_type=video_type,
            duration=duration,
            points_earned=points_earned,
            quiz_score=quiz_score
        )
        
        if not success:
            raise Exception("시청 기록 저장 실패")
        
        # 총 점수 조회
        total_points = firebase_service.get_total_points(user_id)
        
        print(f"✅ 영상 시청 완료: {video_id}, 점수: {points_earned}점")
        
        return jsonify({
            'success': True,
            'message': '영상 시청 완료!',
            'points_earned': points_earned,
            'total_points': total_points,
            'already_watched': False
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/bookmark/add', methods=['POST'])
def add_bookmark():
    """즐겨찾기 추가 (Firebase)"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        video_id = data.get('video_id')
        video_title = data.get('video_title', '')
        video_type = data.get('video_type', 'youtube')
        thumbnail_url = data.get('thumbnail_url', '')
        
        if not video_id:
            raise ValueError("video_id가 필요합니다.")
        
        if user_id == 'guest':
            return jsonify({
                'success': False,
                'message': '로그인이 필요합니다.'
            }), 401
        
        # Firebase에 즐겨찾기 추가
        success = firebase_service.add_bookmark(
            user_id=user_id,
            video_id=video_id,
            video_title=video_title,
            video_type=video_type,
            thumbnail_url=thumbnail_url
        )
        
        if not success:
            return jsonify({
                'success': False,
                'message': '이미 즐겨찾기에 추가되었습니다.'
            })
        
        return jsonify({
            'success': True,
            'message': '즐겨찾기에 추가되었습니다.'
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/bookmark/list', methods=['GET'])
def list_bookmarks():
    """즐겨찾기 목록 (Firebase)"""
    try:
        user_id = request.args.get('user_id', 'guest')
        
        if user_id == 'guest':
            return jsonify({
                'success': True,
                'bookmarks': []
            })
        
        # Firebase에서 즐겨찾기 목록 가져오기
        bookmarks = firebase_service.get_bookmarks(user_id)
        
        return jsonify({
            'success': True,
            'bookmarks': bookmarks
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/bookmark/remove', methods=['POST'])
def remove_bookmark():
    """즐겨찾기 삭제 (Firebase)"""
    try:
        data = request.json
        user_id = data.get('user_id', 'guest')
        video_id = data.get('video_id')
        
        if not video_id:
            raise ValueError("video_id가 필요합니다.")
        
        if user_id == 'guest':
            return jsonify({
                'success': False,
                'message': '로그인이 필요합니다.'
            }), 401
        
        success = firebase_service.remove_bookmark(user_id, video_id)
        
        if not success:
            raise Exception("즐겨찾기 삭제 실패")
        
        return jsonify({
            'success': True,
            'message': '즐겨찾기에서 삭제되었습니다.'
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/user/watched', methods=['GET'])
def get_watched_videos():
    """시청 기록 조회 (Firebase)"""
    try:
        user_id = request.args.get('user_id', 'guest')
        
        if user_id == 'guest':
            return jsonify({
                'success': True,
                'watched_videos': []
            })
        
        watched_videos = firebase_service.get_watched_videos(user_id)
        
        return jsonify({
            'success': True,
            'watched_videos': watched_videos
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """사용자 프로필 조회 (Firebase)"""
    try:
        user_id = request.args.get('user_id', 'guest')
        
        if user_id == 'guest':
            return jsonify({
                'success': False,
                'message': '로그인이 필요합니다.'
            }), 401
        
        profile = firebase_service.get_user_profile(user_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'message': '프로필을 찾을 수 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'profile': profile
        })
        
    except Exception as e:
        print(f"❌ 에러: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("🚀 BISKIT POINT 백엔드 서버 시작...")
    print(f"📍 환경: {Config.FLASK_ENV}")
    print("✅ 준비 완료!")
    
    app.run(
        debug=Config.DEBUG,
        host='0.0.0.0',
        port=5000
    )