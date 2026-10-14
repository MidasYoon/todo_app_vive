# 입력 규칙 (DATA-MODEL.md "입력 규칙", API-SPEC.md A-06 ~ A-08)
# 화면 frontend/src/rules.js와 같은 규칙입니다.

TITLE_MAX = 100  # M-04
DESCRIPTION_MAX = 1000  # M-04
STATUSES = ("todo", "doing", "done")  # M-06


def _error(field, kind):
    return {"field": field, "kind": kind}


def check_title(value):
    """제목을 검사합니다. (앞뒤 공백을 지운 제목, 오류 또는 None)"""
    if not isinstance(value, str):
        return None, _error("title", "invalid_value")  # A-08
    title = value.strip()  # M-03
    if not title:
        return None, _error("title", "title_empty")  # M-03
    if len(title) > TITLE_MAX:  # len은 코드 포인트 수 (M-13)
        return None, _error("title", "too_long")
    return title, None


def check_description(value):
    """설명을 검사합니다. 앞뒤 공백은 지우지 않습니다 (M-14)."""
    if not isinstance(value, str):
        return None, _error("description", "invalid_value")  # A-08
    if len(value) > DESCRIPTION_MAX:  # M-13
        return None, _error("description", "too_long")
    return value, None


def check_status(value):
    """상태 값을 검사합니다 (M-06)."""
    if not isinstance(value, str):
        return None, _error("status", "invalid_value")  # A-08
    if value not in STATUSES:
        return None, _error("status", "invalid_status")
    return value, None


def check_card_patch(body):
    """상태 바꾸기·고치기 요청을 검사합니다. (바꿀 값, 오류 목록)

    보낸 칸만 검사하고 돌려줍니다 (A-01). 모르는 칸은 무시하고(A-06),
    남는 칸이 없으면 empty_request로 거절합니다 (A-10).
    """
    if not isinstance(body, dict):
        return None, [_error(None, "invalid_value")]  # A-08

    checks = {"title": check_title, "description": check_description, "status": check_status}
    values = {}
    errors = []
    for field, check in checks.items():
        if field in body:
            value, error = check(body[field])
            if error:
                errors.append(error)
            else:
                values[field] = value

    if errors:
        return None, errors
    if not values:
        return None, [_error(None, "empty_request")]
    return values, []


def check_new_card(body):
    """만들기 요청을 검사합니다. (저장할 값, 오류 목록)

    모르는 칸과 바꿀 수 없는 칸은 무시합니다 (A-06).
    """
    if not isinstance(body, dict):
        return None, [_error(None, "invalid_value")]  # A-08

    errors = []
    if "title" not in body:
        errors.append(_error("title", "title_empty"))  # A-07
        title = None
    else:
        title, error = check_title(body["title"])
        if error:
            errors.append(error)

    description, error = check_description(body.get("description", ""))  # A-07
    if error:
        errors.append(error)

    if errors:
        return None, errors
    return {"title": title, "description": description}, []
