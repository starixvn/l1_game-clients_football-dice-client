const win = window as any;
export const languages = {
    "Common": {},
    "FootballDice": {
        "away_win": "客队胜",
        "bet_history_away": "客队)",
        "bet_history_home": "(主队",
        "draw_win": "和",
        "game_icon_name": "足球骰子",
        "game_icon_name_ph": "足球骰子",
        "game_name": "足球骰子",
        "glossary_away": "客队",
        "glossary_draw": "平",
        "glossary_home": "主队",
        "home_win": "主队胜",
        "lobby_membersite_banner": "骰动欧洲杯,争夺最高分！",
        "match_starts": "比赛开始",
        "pf_away_dice_1": "客队 - 骰子 1",
        "pf_away_dice_2": "客队 - 骰子 2",
        "pf_home_dice_1": "主队 - 骰子 1",
        "pf_ home_dice_2": "主队 - 骰子 2",
        "pf_verification_para_3": "将 SHA512 中的每组 8 个字符转换为小数"
    }
};

if (!win.languages) {
    win.languages = {};
}
                          
win.languages.zh_cn = languages;