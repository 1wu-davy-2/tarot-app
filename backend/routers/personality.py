"""Personality test phrases — DB-backed spicy Dirty/Sweet Talk."""
import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SmTalkPhrase

router = APIRouter(prefix="/api/personality", tags=["personality"])

DEFAULT_DIRTY: dict[str, list[str]] = {
    "Dominant": [
        "今晚听我的，别问为什么，只管服从",
        "看着我的眼睛，不许躲开，我要你记住这一刻",
        "乖乖在我掌控之下，你越挣扎我越兴奋",
    ],
    "Submissive": [
        "请告诉我该怎么做，我会一字不漏地执行",
        "我把自己交给你了，你想怎么处置都可以",
        "求你别这么温柔，我想要更强势一点的你",
    ],
    "Sadist": [
        "你喜欢这样对吗，嘴上说不要身体却很诚实",
        "别忍着，让我听到你的声音，不然我会更过分",
        "每次看你求饶的样子，我就更想欺负你了",
    ],
    "Masochist": [
        "请你再严厉一点，我承受得起的",
        "被你支配的每一秒都让人上瘾，别停",
        "我就喜欢你这种不容反抗的气势，让我心甘情愿",
    ],
    "Switch": [
        "今天你是我的，明天轮到你来惩罚我",
        "这次换你主导，让我看看你有多想掌控我",
        "我们轮流掌控节奏吧，谁先求饶就听对方的",
    ],
    "Vanilla": [
        "我不需要什么角色扮演，就这样抱着你已经足够",
        "温柔一点就好，我只想好好感受你的存在",
        "比起那些刺激的玩法，你的一句情话更能让我沦陷",
    ],
}

DEFAULT_SWEET: dict[str, list[str]] = {
    "Dominant": [
        "不必一直撑着，在我这里你可以卸下所有防备",
        "掌控久了也会累，今晚让我照顾你的一切",
        "我只想把你护在身后，不让这世界伤你分毫",
    ],
    "Submissive": [
        "你的信任是我最珍贵的礼物，我绝不会辜负",
        "在你面前做真实的自己，是我一天中最幸福的时刻",
        "我不需要做什么伟大的事，只要能在你身边就已经足够",
    ],
    "Sadist": [
        "霸气只是我的保护色，在你面前我只想温柔以待",
        "我的严厉都是为了你好，因为我在乎你到骨子里",
        "对外人我可以冷血到底，唯独对你狠不下心",
    ],
    "Masochist": [
        "你以为我在忍受，其实我只是在享受被你珍视的感觉",
        "被你管束的每一天，都在提醒我我是被人爱着的",
        "不需要刻意温柔，你本来的样子就已让我深陷其中",
    ],
    "Switch": [
        "在不同角色间切换，唯一不变的是我想和你在一起的心",
        "你让我的每一天都充满未知的惊喜和期待",
        "不管今天谁来主导，最后相拥入眠的样子就是答案",
    ],
    "Vanilla": [
        "平淡的陪伴才是最奢侈的浪漫，谢谢你的每一个日常",
        "我爱的不是刺激和新奇，而是与你相伴的每一刻真实",
        "简单的早安晚安，就足够填满我对爱情的所有想象",
    ],
}


SEED_DIRTY: dict[str, list[str]] = {
    "Dominant": [
        "跪下，抬头看着我——你今晚的一切由我决定，多说一句就多加一次惩罚",
        "别咬着嘴唇不出声，我喜欢听你控制不住的声音，越失控越好",
        "手心伸出来，我要你记住每一次指令的重量，你的服从让我欲罢不能",
    ],
    "Submissive": [
        "主人请尽情使用我，今晚我是你的所有物，每一个角落都任你处置",
        "我跪好了，没有你的允许我不会动，更不会停——请给我命令",
        "求你，别对我手下留情，我想感受你全部的掌控力，哪怕是疼痛",
    ],
    "Sadist": [
        "哭出来也没关系，你的眼泪只会让我更想继续——这是你自找的",
        "我说停之前你不许停，哪怕你在发抖，这是我对你的特殊偏爱",
        "你的倔强在我面前毫无意义，越反抗我越想彻底瓦解你的防线",
    ],
    "Masochist": [
        "再狠一点也没关系，我的极限比你想象的高，请别心软",
        "你留下的每道痕迹都是勋章，我想戴着它们骄傲地出门",
        "别问我疼不疼，我只想问你爽不爽——继续，我还想要更多",
    ],
    "Switch": [
        "今晚我主导全局，每一个节拍由我来定——但明天我要跪着求你回来",
        "现在先听我的，等会儿轮到你反击，看谁先撑不住认输",
        "别以为你赢了，我只是暂时把控制权借给你玩一会儿",
    ],
    "Vanilla": [
        "不需要花式技巧，你在我耳边呼吸的声音就足够让我神魂颠倒",
        "我想要的不是什么刺激游戏，而是你认真看着我说爱我的那个表情",
        "把那些花里胡哨的都丢掉吧，今晚我只想安安静静地拥有你",
    ],
}

SEED_SWEET: dict[str, list[str]] = {
    "Dominant": [
        "你在外面是所有人的靠山，但回到家你只需要靠在我怀里就够了",
        "我不需要你一直那么强大，在我这里你可以是脆弱的、需要被爱的普通人",
        "谢谢你替我扛下所有风雨，今晚换我来守护你最柔软的睡颜",
    ],
    "Submissive": [
        "谢谢你愿意把最柔软的一面交给我，这份信任比任何承诺都沉重",
        "我从不觉得顺从是软弱，你在我眼里是全世界最勇敢的交付者",
        "每次你毫无保留地把自己交给我，我都觉得这是人生最珍贵的馈赠",
    ],
    "Sadist": [
        "我知道你的强硬是为了保护我，但请让我也保护那个藏在铠甲里的你",
        "你的控制欲其实只是害怕失控，而我永远是你最安全的一方柔软",
        "你可以在外面冷酷到底，但在我这里你永远有一个不需要伪装的角落",
    ],
    "Masochist": [
        "你承受了太多不该一个人扛的重量，请分一半给我，让我一起分担",
        "我一直以为你享受的是疼痛，后来才发现你是渴望被如此认真地对待",
        "每次看到你逞强说没关系，我都想抱紧你告诉你——有我在，不用硬撑",
    ],
    "Switch": [
        "你在两种角色间找平衡，而我在你身边找到了陪伴的全部意义",
        "可以强势也可以柔软，每一种你我都深爱，因为那都是真实的你",
        "余生很长，我们有的是时间轮流做对方最坚定的依靠",
    ],
    "Vanilla": [
        "世界节奏太快，只有在你身边我才能慢下来感受什么是真正的心安",
        "我不需要你变成任何人，你本来的样子就是我选择留下来的全部理由",
        "最好的爱情不是火花四溅，而是深夜翻身时能摸到你温暖的背",
    ],
}


def _seed_sm_phrases(db: Session):
    """Seed spicier DB phrases if the table is empty."""
    import json
    existing = db.query(SmTalkPhrase).count()
    if existing > 0:
        return

    for sm_type in ["Dominant", "Submissive", "Sadist", "Masochist", "Switch", "Vanilla"]:
        db.add(SmTalkPhrase(
            sm_type=sm_type,
            category="dirty",
            phrases=json.dumps(SEED_DIRTY.get(sm_type, []), ensure_ascii=False),
            lang="zh",
        ))
        db.add(SmTalkPhrase(
            sm_type=sm_type,
            category="sweet",
            phrases=json.dumps(SEED_SWEET.get(sm_type, []), ensure_ascii=False),
            lang="zh",
        ))
    db.commit()
    print("[seed] sm_talk_phrases seeded with spicy phrases")


@router.get("/sm-talks")
def get_sm_talks(
    sm_type: str = Query(..., max_length=20),
    lang: str = Query("zh", max_length=5),
    db: Session = Depends(get_db),
):
    """Return spicy Dirty/Sweet Talk phrases for a given S/M type.
    Aggregates all matching rows. Falls back to defaults if nothing in DB."""
    dirty_rows = db.query(SmTalkPhrase).filter(
        SmTalkPhrase.sm_type == sm_type,
        SmTalkPhrase.category == "dirty",
        SmTalkPhrase.lang == lang,
    ).all()

    sweet_rows = db.query(SmTalkPhrase).filter(
        SmTalkPhrase.sm_type == sm_type,
        SmTalkPhrase.category == "sweet",
        SmTalkPhrase.lang == lang,
    ).all()

    dirty_talk = []
    for r in dirty_rows:
        dirty_talk.extend(json.loads(r.phrases))

    sweet_talk = []
    for r in sweet_rows:
        sweet_talk.extend(json.loads(r.phrases))

    return {
        "sm_type": sm_type,
        "dirty_talk": dirty_talk if dirty_talk else DEFAULT_DIRTY.get(sm_type, []),
        "sweet_talk": sweet_talk if sweet_talk else DEFAULT_SWEET.get(sm_type, []),
    }
