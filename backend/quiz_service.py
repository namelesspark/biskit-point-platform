# backend/quiz_service.py
from openai import OpenAI
import json
import re
import random
from config import Config

client = OpenAI(api_key=Config.OPENAI_API_KEY)


def calculate_quiz_count(duration_seconds):
    """영상 길이에 따른 퀴즈 개수 결정 (10분 미만: 1개 고정)"""
    if duration_seconds < 600:  # 10분 미만
        return 1
    return None  # 사용자가 선택


def calculate_quiz_times(duration, num_quizzes, skip_start=300):
    """퀴즈 출제 시간 계산"""
    if duration <= skip_start:
        # 영상이 너무 짧으면 중간 지점에 1개
        return [duration // 2]
    
    quiz_window = duration - skip_start
    interval = quiz_window // (num_quizzes + 1)
    
    quiz_times = []
    for i in range(1, num_quizzes + 1):
        base_time = skip_start + (interval * i)
        # ±30초 랜덤 변동
        variation = random.randint(-30, 30)
        quiz_time = max(skip_start, min(duration - 60, base_time + variation))
        quiz_times.append(quiz_time)
    
    return sorted(list(set(quiz_times)))


def generate_quiz_from_segment(transcript_text, num_quizzes=1):
    """특정 구간 텍스트로 퀴즈 생성"""
    try:
        # 텍스트 길이 제한
        segmented_text = transcript_text[:2000]
        
        response = client.chat.completions.create(
            model=Config.AI_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "당신은 교육 전문가입니다. 학생의 개념 이해도를 평가하는 고품질 퀴즈를 만듭니다. JSON 배열만 반환하세요."
                },
                {
                    "role": "user", 
                    "content": f"""당신은 대학교 교수입니다. 아래 강의 내용을 바탕으로 학생의 **개념 이해도**를 평가하는 퀴즈를 {num_quizzes}개 만드세요.

[퀴즈 작성 규칙]
1. **개념 이해 문제**: 단순 암기(숫자, 예시)가 아닌, 원리와 개념을 이해했는지 묻는 문제
2. **응용/추론 문제**: "왜 그런가?", "어떤 상황에서?", "무엇의 역할은?" 형태
3. **오답 함정**: 그럴듯하지만 틀린 선택지로 개념 혼동 유도
4. **실무 연결**: 가능하면 실제 활용 사례와 연결

[피해야 할 문제 유형]
- ❌ "영상에서 예시로 든 숫자는?" (단순 암기)
- ❌ "몇 개의 뉴런이 있는가?" (숫자 암기)  
- ❌ "영상에서 보여준 이미지는?" (예시 암기)

[좋은 문제 예시]
- ✅ "신경망에서 활성화 함수가 필요한 이유는?"
- ✅ "역전파 알고리즘이 해결하는 문제는?"
- ✅ "은닉층의 뉴런 수를 늘리면 어떤 장단점이 있는가?"

[강의 내용]
{segmented_text}

[출력 형식]
JSON 배열로만 응답:
[{{"question": "개념 이해를 묻는 질문", "options": ["선택지1", "선택지2", "선택지3", "선택지4"], "correct_answer": 0, "explanation": "정답인 이유와 관련 개념 설명"}}]"""
                }
            ],
            temperature=Config.AI_TEMPERATURE,
            max_tokens=Config.AI_MAX_TOKENS
        )
        
        content = response.choices[0].message.content
        print(f"📝 AI 응답:\n{content[:200]}...")

        # JSON 추출
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            content = match.group(0).strip()
        
        quizzes = json.loads(content)
        return quizzes if isinstance(quizzes, list) else [quizzes]

    except Exception as e:
        print(f"❌ 퀴즈 생성 실패: {e}")
        return []


def check_answer(user_answer, correct_answer):
    """정답 확인"""
    return user_answer == correct_answer


def calculate_score(is_correct):
    """점수 계산"""
    return 10 if is_correct else 0
