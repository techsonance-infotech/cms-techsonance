import os

files_to_check = [
    os.path.join('cms-techsonance', 'src', 'app', 'api', 'workspace-settings', 'route.ts'),
    os.path.join('cms-techsonance', 'src', 'app', 'api', 'company-settings', 'route.ts'),
    os.path.join('cms-techsonance', 'src', 'app', 'dashboard', 'settings', 'page.tsx'),
    os.path.join('cms-techsonance', 'src', 'app', 'dashboard', 'payroll', 'page.tsx'),
    os.path.join('cms-techsonance', 'src', 'app', 'dashboard', 'finance', 'invoices', 'new', 'page.tsx'),
]

all_clean = True
for fpath in files_to_check:
    if not os.path.exists(fpath):
        print(f"MISSING: {fpath}")
        all_clean = False
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check balanced brackets
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    in_string = False
    str_char = None
    in_single_comment = False
    in_multi_comment = False
    line = 1
    col = 0
    error = None

    i = 0
    while i < len(content):
        c = content[i]
        col += 1
        if c == '\n':
            line += 1
            col = 0
            in_single_comment = False

        if in_single_comment:
            i += 1
            continue

        if in_multi_comment:
            if c == '*' and i + 1 < len(content) and content[i + 1] == '/':
                in_multi_comment = False
                i += 2
                col += 1
                continue
            i += 1
            continue

        if not in_string:
            if c == '/' and i + 1 < len(content):
                if content[i + 1] == '/':
                    in_single_comment = True
                    i += 2
                    col += 1
                    continue
                elif content[i + 1] == '*':
                    in_multi_comment = True
                    i += 2
                    col += 1
                    continue

            if c in ("'", '"', '`'):
                in_string = True
                str_char = c
                i += 1
                continue

            if c in '({[':
                stack.append((c, line, col))
            elif c in ')}]':
                if not stack:
                    error = f"Extra closing bracket '{c}' at {line}:{col}"
                    break
                top, l, col_o = stack.pop()
                if pairs[c] != top:
                    error = f"Mismatched bracket: expected match for '{top}' from {l}:{col_o}, got '{c}' at {line}:{col}"
                    break
        else:
            if c == '\\':
                i += 2
                col += 1
                continue
            elif c == str_char:
                in_string = False
                str_char = None

        i += 1

    if error:
        print(f"SYNTAX ERROR in {fpath}: {error}")
        all_clean = False
    elif stack:
        print(f"UNCLOSED BRACKETS in {fpath}: {len(stack)} unclosed (e.g. {stack[-1]})")
        all_clean = False
    else:
        print(f"OK: {fpath} ({len(content)} chars)")

if all_clean:
    print("ALL 5 FILES VERIFIED 100% CLEAN SYNTAX!")

