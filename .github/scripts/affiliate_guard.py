# アフィリエイトリンクの見張り(この道具ええやん.com)
# 使い方:
#   python affiliate_guard.py --staged   … git commit の直前に、ステージした変更を点検(pre-commit フックから呼ばれる)
#   python affiliate_guard.py --all      … サイト本体の全ページを点検
#   python affiliate_guard.py --range BASE HEAD … 2つのコミットのあいだの変更を点検(GitHub Actions の公開前に使う)
# 点検すること:
#   1. 前のコミットにあったアフィリエイトURLが、消えたり一字でも変わったりしていないか
#   2. ページ内の楽天公式ブロックが、楽天リンク/ の保存ファイルとバイト一致か(1ページに同じものは1回まで)
#   3. Amazon のリンクに tag=tike0a-22 があるか、amzn.to(タグなし短縮)がないか
# 意図してリンクを消す・差し替えるとき(ユーザーの了承済み)だけ、環境変数 AFFILIATE_OK=1 を付けてコミットする。
import os, re, subprocess, sys, pathlib
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
SITE = pathlib.Path(__file__).resolve().parents[2]
RAKUTEN_DIR = next((d for d in (SITE / '_work' / '楽天リンク', SITE.parent / '楽天リンク') if d.is_dir()), SITE / '_work' / '楽天リンク')
SIG = b'<table border="0" cellpadding="0" cellspacing="0"><tr><td><div style="border:1px solid #95a5a6'
AFF = re.compile(rb'(?:href|src)="(https?://(?:[a-z0-9.-]*amazon\.co\.jp|amzn\.to|link\.amazon|yahoo\.jp|[a-z0-9.-]*shopping\.yahoo\.co\.jp|hb\.afl\.rakuten\.co\.jp|[a-z0-9.-]*valuecommerce\.com|[a-z0-9.-]*\.rakuten\.co\.jp/[^"]*afl)[^"]*)"', re.I)
JSURL = re.compile(rb'["\'](https?://(?:[a-z0-9.-]*amazon\.co\.jp|amzn\.to|link\.amazon|yahoo\.jp|hb\.afl\.rakuten\.co\.jp|[a-z0-9.-]*valuecommerce\.com)[^"\']*)["\']', re.I)

def saved_blocks():
    out = {}
    if RAKUTEN_DIR.is_dir():
        for f in RAKUTEN_DIR.glob('*.html'):
            out[f.name] = f.read_bytes()
    return out

def urls(data, name):
    rx = JSURL if name.endswith('.js') else AFF
    return Counter(m.group(1) for m in rx.finditer(data))

def check_page(name, new, old, blocks):
    errs = []
    if old is not None:
        before, after = urls(old, name), urls(new, name)
        for u, n in before.items():
            if after[u] < n:
                errs.append(f'消えた/変わったリンク: {u.decode(errors="replace")[:140]}')
    if name.endswith('.html'):
        rest = new
        for fn, b in blocks.items():
            c = new.count(b)
            if c > 1:
                errs.append(f'楽天ブロック {fn} が {c} 回入っている(1回まで)')
            if c:
                rest = rest.replace(b, b'')
        k = rest.count(SIG)
        if k:
            errs.append(f'楽天リンク/ の保存ファイルと一致しない楽天ブロックが {k} 個ある(改変・作り直しの疑い)')
    for u in urls(new, name):
        s = u.decode(errors='replace')
        if 'amzn.to/' in s:
            errs.append(f'amzn.to の短縮リンク(タグ未確認): {s}')
        elif 'amazon.co.jp' in s and 'tag=tike0a-22' not in s:
            errs.append(f'Amazon のリンクに tag=tike0a-22 がない: {s[:140]}')
    return errs

def git(*a):
    return subprocess.run(['git', '-C', str(SITE), *a], capture_output=True).stdout

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--all'
    blocks = saved_blocks()
    if not blocks:
        print('注意: 楽天リンク/ が見つからないため、楽天ブロックの照合は省略しました。')
    problems = {}
    if mode == '--range':
        base, head = sys.argv[2], sys.argv[3]
        names = [n for n in git('diff', '--name-only', '--diff-filter=AMR', '-z', base, head).decode('utf-8').split('\0') if n.endswith(('.html', '.js'))]
        for n in names:
            new = git('show', f'{head}:{n}')
            r = subprocess.run(['git', '-C', str(SITE), 'cat-file', '-e', f'{base}:{n}'], capture_output=True)
            old = git('show', f'{base}:{n}') if r.returncode == 0 else None
            e = check_page(n, new, old, blocks)
            if e: problems[n] = e
        for n in git('diff', '--name-only', '--diff-filter=D', '-z', base, head).decode('utf-8').split('\0'):
            if n.endswith('.html') and urls(git('show', f'{base}:{n}'), n):
                problems.setdefault(n, []).append('アフィリエイトリンクを含むページが削除された')
    elif mode == '--staged':
        names = [n for n in git('diff', '--cached', '--name-only', '--diff-filter=AMR', '-z').decode('utf-8').split('\0') if n.endswith(('.html', '.js'))]
        for n in names:
            new = git('show', ':' + n)
            r = subprocess.run(['git', '-C', str(SITE), 'cat-file', '-e', 'HEAD:' + n], capture_output=True)
            old = git('show', 'HEAD:' + n) if r.returncode == 0 else None
            e = check_page(n, new, old, blocks)
            if e: problems[n] = e
        for n in git('diff', '--cached', '--name-only', '--diff-filter=D', '-z').decode('utf-8').split('\0'):
            if n.endswith('.html') and urls(git('show', 'HEAD:' + n), n):
                problems.setdefault(n, []).append('アフィリエイトリンクを含むページが削除された')
    else:
        for p in sorted(SITE.rglob('*.html')) + sorted((SITE / 'assets' / 'js').glob('*.js')):
            if '.git' in p.parts or '_work' in p.parts: continue
            n = p.relative_to(SITE).as_posix()
            e = check_page(n, p.read_bytes(), None, blocks)
            if e: problems[n] = e
    if problems:
        print('【アフィリエイトリンクの見張り】問題が見つかりました:')
        for n, es in problems.items():
            for e in es: print(f'  {n}: {e}')
        if mode in ('--staged', '--range') and os.environ.get('AFFILIATE_OK') == '1':
            print('AFFILIATE_OK=1 が付いているため、コミットを通します(ユーザーの了承済みの変更に限る)。')
            return 0
        if mode == '--range':
            print('公開を止めました。ユーザーが了承したリンクの変更なら、コミットメッセージに [affiliate-ok] を入れて公開し直してください。')
        if mode == '--staged':
            print('コミットを止めました。意図した変更(ユーザーの了承済み)なら AFFILIATE_OK=1 を付けてコミットしてください。')
        return 1
    print('【アフィリエイトリンクの見張り】OK')
    return 0

if __name__ == '__main__':
    sys.exit(main())
