"""
住海邊的帳篷君 — 本機管理後台
使用方式：python3 admin/app.py
然後開啟瀏覽器：http://localhost:5001
"""
from flask import Flask, render_template, request, redirect, url_for, flash
import json, os, uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
TMPL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')

app = Flask(__name__, template_folder=TMPL_DIR)
app.secret_key = 'tent-fan-local-admin-2025'


def load(filename):
    with open(os.path.join(DATA_DIR, filename), 'r', encoding='utf-8') as f:
        return json.load(f)

def save(filename, data):
    with open(os.path.join(DATA_DIR, filename), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def new_id(prefix):
    return f"{prefix}_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"


# ── 總覽 ──────────────────────────────────────────
@app.route('/')
def dashboard():
    v = load('voice.json')
    s = load('schedule.json')
    return render_template('dashboard.html',
        voice_total=len(v['posts']),
        voice_pub=sum(1 for p in v['posts'] if p['published']),
        sched_total=len(s['posts']),
        sched_pub=sum(1 for p in s['posts'] if p['published']))


# ── Voice ─────────────────────────────────────────
@app.route('/voice')
def voice_list():
    data = load('voice.json')
    posts = sorted(data['posts'], key=lambda x: x['original_date'], reverse=True)
    return render_template('voice_list.html', posts=posts)

@app.route('/voice/new', methods=['GET', 'POST'])
def voice_new():
    if request.method == 'POST':
        data = load('voice.json')
        data['posts'].append({
            'id': new_id('voice'),
            'original_date': request.form['original_date'],
            'title': request.form['title'].strip(),
            'translated_content': request.form['translated_content'].strip(),
            'published': 'published' in request.form,
            'created_at': datetime.now().isoformat()
        })
        save('voice.json', data)
        flash('Voice 文章已新增', 'success')
        return redirect(url_for('voice_list'))
    return render_template('voice_form.html', post=None, action='新增')

@app.route('/voice/<pid>/edit', methods=['GET', 'POST'])
def voice_edit(pid):
    data = load('voice.json')
    post = next((p for p in data['posts'] if p['id'] == pid), None)
    if not post:
        flash('找不到文章', 'error')
        return redirect(url_for('voice_list'))
    if request.method == 'POST':
        post.update({
            'original_date': request.form['original_date'],
            'title': request.form['title'].strip(),
            'translated_content': request.form['translated_content'].strip(),
            'published': 'published' in request.form
        })
        save('voice.json', data)
        flash('Voice 文章已更新', 'success')
        return redirect(url_for('voice_list'))
    return render_template('voice_form.html', post=post, action='編輯')

@app.route('/voice/<pid>/toggle', methods=['POST'])
def voice_toggle(pid):
    data = load('voice.json')
    post = next((p for p in data['posts'] if p['id'] == pid), None)
    if post:
        post['published'] = not post['published']
        save('voice.json', data)
    return redirect(url_for('voice_list'))

@app.route('/voice/<pid>/delete', methods=['POST'])
def voice_delete(pid):
    data = load('voice.json')
    data['posts'] = [p for p in data['posts'] if p['id'] != pid]
    save('voice.json', data)
    flash('文章已刪除', 'success')
    return redirect(url_for('voice_list'))


# ── Schedule ──────────────────────────────────────
@app.route('/schedule')
def schedule_list():
    data = load('schedule.json')
    posts = sorted(data['posts'], key=lambda x: x['date'], reverse=True)
    return render_template('schedule_list.html', posts=posts)

@app.route('/schedule/new', methods=['GET', 'POST'])
def schedule_new():
    if request.method == 'POST':
        data = load('schedule.json')
        data['posts'].append({
            'id': new_id('sch'),
            'date': request.form['date'],
            'end_date': request.form.get('end_date', '').strip(),
            'media_type': request.form['media_type'],
            'title': request.form['title'].strip(),
            'translated_content': request.form['translated_content'].strip(),
            'link': request.form.get('link', '').strip(),
            'published': 'published' in request.form,
            'created_at': datetime.now().isoformat()
        })
        save('schedule.json', data)
        flash('行程已新增', 'success')
        return redirect(url_for('schedule_list'))
    return render_template('schedule_form.html', post=None, action='新增')

@app.route('/schedule/<pid>/edit', methods=['GET', 'POST'])
def schedule_edit(pid):
    data = load('schedule.json')
    post = next((p for p in data['posts'] if p['id'] == pid), None)
    if not post:
        flash('找不到行程', 'error')
        return redirect(url_for('schedule_list'))
    if request.method == 'POST':
        post.update({
            'date': request.form['date'],
            'end_date': request.form.get('end_date', '').strip(),
            'media_type': request.form['media_type'],
            'title': request.form['title'].strip(),
            'translated_content': request.form['translated_content'].strip(),
            'link': request.form.get('link', '').strip(),
            'published': 'published' in request.form
        })
        save('schedule.json', data)
        flash('行程已更新', 'success')
        return redirect(url_for('schedule_list'))
    return render_template('schedule_form.html', post=post, action='編輯')

@app.route('/schedule/<pid>/toggle', methods=['POST'])
def schedule_toggle(pid):
    data = load('schedule.json')
    post = next((p for p in data['posts'] if p['id'] == pid), None)
    if post:
        post['published'] = not post['published']
        save('schedule.json', data)
    return redirect(url_for('schedule_list'))

@app.route('/schedule/<pid>/delete', methods=['POST'])
def schedule_delete(pid):
    data = load('schedule.json')
    data['posts'] = [p for p in data['posts'] if p['id'] != pid]
    save('schedule.json', data)
    flash('行程已刪除', 'success')
    return redirect(url_for('schedule_list'))


if __name__ == '__main__':
    print('\n住海邊的帳篷君 管理後台')
    print('開啟瀏覽器：http://localhost:5001\n')
    app.run(debug=False, port=5001)
