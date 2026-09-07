import os
import json
from openai import OpenAI


def generate_questions(topic: str, count: int = 5) -> list:
    """
    Use OpenAI GPT to generate MCQ questions for a given topic.
    Falls back to sample questions if the API key is missing or the call fails.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")

    if not api_key or api_key.startswith("sk-proj-_CyTnI"):
        # Return stub questions when no valid key is configured
        return _sample_questions(topic, count)

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user",
                "content": f"""Generate {count} multiple choice questions about {topic}.
Return ONLY a valid JSON array. Format:
[
  {{
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A"
  }}
]"""
            }]
        )
        content = response.choices[0].message.content or "[]"
        return json.loads(content)
    except Exception as e:
        print(f"[AI] OpenAI error: {e}")
        return _sample_questions(topic, count)


def _sample_questions(topic: str, count: int) -> list:
    """Generate placeholder questions when OpenAI is unavailable."""
    base = [
        {
            "question": f"Which of the following best describes {topic}?",
            "option_a": "Option A", "option_b": "Option B",
            "option_c": "Option C", "option_d": "Option D",
            "correct_answer": "A",
        },
        {
            "question": f"What is the primary use of {topic}?",
            "option_a": "Use A", "option_b": "Use B",
            "option_c": "Use C", "option_d": "Use D",
            "correct_answer": "B",
        },
        {
            "question": f"Which concept is most closely related to {topic}?",
            "option_a": "Concept A", "option_b": "Concept B",
            "option_c": "Concept C", "option_d": "Concept D",
            "correct_answer": "C",
        },
        {
            "question": f"Who commonly uses {topic}?",
            "option_a": "Group A", "option_b": "Group B",
            "option_c": "Group C", "option_d": "Group D",
            "correct_answer": "A",
        },
        {
            "question": f"What is a key advantage of {topic}?",
            "option_a": "Advantage A", "option_b": "Advantage B",
            "option_c": "Advantage C", "option_d": "Advantage D",
            "correct_answer": "D",
        },
    ]
    return base[:count]