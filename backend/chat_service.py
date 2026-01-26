# backend/chat_service.py
from openai import OpenAI
from config import Config

client = OpenAI(api_key=Config.OPENAI_API_KEY)


def create_chat_context(transcript_text):
    """챗봇 시스템 프롬프트 생성"""
    return f"""당신은 친절한 학습 도우미 AI입니다.
학생이 시청 중인 강의 내용:
{transcript_text[:3000]}

위 강의 내용을 바탕으로:
1. 학생의 질문에 명확하게 답변하세요
2. 이해를 돕는 예시를 들어주세요
3. 추가 질문을 유도하세요
4. 친근하고 격려하는 톤으로 대화하세요"""


def chat(transcript_text, user_message, conversation_history=None):
    """챗봇 대화"""
    try:
        if conversation_history is None:
            conversation_history = []

        system_prompt = create_chat_context(transcript_text)

        messages = [
            {"role": "system", "content": system_prompt}
        ] + conversation_history + [
            {"role": "user", "content": user_message}
        ]

        response = client.chat.completions.create(
            model=Config.AI_MODEL,
            messages=messages,
            temperature=Config.AI_TEMPERATURE,
            max_tokens=Config.AI_MAX_TOKENS
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"❌ Chat API 에러: {e}")
        return "죄송합니다. 현재 질문에 답변할 수 없습니다."


def summarize_transcript(transcript_text):
    """자막 전체를 AI로 요약"""
    try:
        # 긴 텍스트는 앞부분만 사용
        text_to_summarize = transcript_text[:4000]
        
        response = client.chat.completions.create(
            model=Config.AI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "당신은 강의 내용을 핵심 요점 위주로 요약하는 전문가입니다. 한국어로 답변하세요."
                },
                {
                    "role": "user",
                    "content": f"""다음 강의 내용을 300자 이내로 핵심만 요약해주세요.
                    
강의 내용:
{text_to_summarize}

요약:"""
                }
            ],
            temperature=0.5,
            max_tokens=500
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"❌ 요약 실패: {e}")
        return "요약을 생성할 수 없습니다."
