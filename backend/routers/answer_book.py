"""Answer Book — AI contextual interpretation of random answers."""

import json
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from routers.auth import get_current_user
from models import User, AnswerBookRecord
from routers.checkin import get_or_create_quota

router = APIRouter(prefix="/api/answer-book", tags=["answer-book"])


class AnswerBookRequest(BaseModel):
    question: str = ""
    answer: str


class SaveRecordRequest(BaseModel):
    question: str = ""
    answer: str
    page_number: int


class UpdateInterpretationRequest(BaseModel):
    interpretation: str


async def _stream_answer_interpretation(question: str, answer: str):
    """Stream AI interpretation of answer book result via DeepSeek."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        yield f"data: {json.dumps({'content': 'AI 服务未配置。请设置 DEEPSEEK_API_KEY 环境变量。'})}\n\n"
        yield "data: [DONE]\n\n"
        return

    system = (
        "你是一位温柔而深刻的塔罗占卜师，同时也是「答案之书」的解读者。"
        "用户翻开答案之书，得到了一条来自宇宙的回答。"
        "请你结合用户的提问（如果有）和得到的答案，给出大约200字的情境化解读。"
        "解读要有温度、有哲理，帮助用户理解这条答案在他们人生中的意涵。"
        "不要说套话，要把答案和问题真正联系起来。"
    )

    user_prompt = f"我翻开答案之书，得到了这样的回答：\n\n「{answer}」\n\n"
    if question and question.strip():
        user_prompt += f"我心中默念的问题是：{question.strip()}\n\n"
    user_prompt += "请为我解读这条答案。"

    import httpx

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user_prompt},
                    ],
                    "stream": True,
                    "temperature": 0.8,
                    "max_tokens": 600,
                },
            ) as resp:
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            yield "data: [DONE]\n\n"
                            return
                        try:
                            data = json.loads(data_str)
                            content = data["choices"][0]["delta"].get("content", "")
                            if content:
                                yield f"data: {json.dumps({'content': content})}\n\n"
                        except (json.JSONDecodeError, KeyError, IndexError):
                            pass
    except Exception as e:
        yield f"data: {json.dumps({'error': f'AI 服务请求失败：{str(e)}'})}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/interpret")
async def interpret_answer(
    req: AnswerBookRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Interpret an answer book result with AI, consuming 1 quota."""
    quota = get_or_create_quota(db, current_user.id)
    if quota.remaining < 1:
        def _err():
            yield f"data: {json.dumps({'error': '今日配额不足，请明日签到后再试'})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(_err(), media_type="text/event-stream")

    quota.used_count += 1
    db.commit()

    return StreamingResponse(
        _stream_answer_interpretation(req.question, req.answer),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/record")
def save_record(
    req: SaveRecordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a flip record (question + answer + page number)."""
    record = AnswerBookRecord(
        user_id=current_user.id,
        question=req.question.strip(),
        answer=req.answer,
        page_number=req.page_number,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id}


@router.patch("/record/{record_id}/interpretation")
def update_interpretation(
    record_id: int,
    req: UpdateInterpretationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Attach AI interpretation text to an existing record."""
    record = db.query(AnswerBookRecord).filter(
        AnswerBookRecord.id == record_id,
        AnswerBookRecord.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    record.ai_interpretation = req.interpretation
    db.commit()
    return {"ok": True}


@router.get("/history")
def get_history(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return paginated answer book history for the current user."""
    offset = (page - 1) * limit
    q = db.query(AnswerBookRecord).filter(AnswerBookRecord.user_id == current_user.id)
    total = q.count()
    records = q.order_by(desc(AnswerBookRecord.created_at)).offset(offset).limit(limit).all()
    return {
        "records": [
            {
                "id": r.id,
                "question": r.question,
                "answer": r.answer,
                "page_number": r.page_number,
                "ai_interpretation": r.ai_interpretation,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }
