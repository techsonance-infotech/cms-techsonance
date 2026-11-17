import sys

def check_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()
    stack = []
    i = 0
    in_str = None
    in_line_comment = False
    in_block_comment = False
    errors = []
    line = 1
    while i < len(code):
        ch = code[i]
        if ch == '\n':
            line += 1
            in_line_comment = False
            i += 1
            continue
        if in_line_comment:
            i += 1
            continue
        if in_block_comment:
            if ch == '*' and i + 1 < len(code) and code[i+1] == '/':
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if in_str:
            if ch == '\\':
                i += 2
                continue
            if ch == in_str:
                in_str = None
            i += 1
            continue
        if ch in ('"', "'", '`'):
            in_str = ch
            i += 1
            continue
        if ch == '/' and i + 1 < len(code):
            if code[i+1] == '/':
                in_line_comment = True
                i += 2
                continue
            elif code[i+1] == '*':
                in_block_comment = True
                i += 2
                continue
        if ch in '({[':
            stack.append((ch, line))
        elif ch in ')}]':
            if not stack:
                errors.append(f'Unmatched closing {ch} at line {line}')
            else:
                last, lline = stack.pop()
                expected = {'(': ')', '{': '}', '[': ']'}[last]
                if ch != expected:
                    errors.append(f'Mismatched {ch} at line {line}, expected {expected} from line {lline}')
        i += 1
    if stack:
        for s, l in stack:
            errors.append(f'Unclosed {s} from line {l}')
    print(f"{path}: {len(errors)} issues")
    for e in errors[:5]:
        print("  ", e)

check_file('cms-techsonance/src/app/dashboard/payroll/page.tsx')
check_file('cms-techsonance/src/app/api/payroll/send-payslip/route.ts')


check_file('cms-techsonance/src/components/dashboard/header.tsx')
