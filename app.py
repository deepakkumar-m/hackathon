"""
GBME DevOps Hackathon - Flask Application
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from functools import wraps
import config
import models

app = Flask(__name__)
app.secret_key = config.SECRET_KEY

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'


# ============================================
# USER MODEL
# ============================================
class User(UserMixin):
    def __init__(self, user_id, display_name, is_admin=False):
        self.id = user_id
        self.display_name = display_name
        self.is_admin = is_admin


@login_manager.user_loader
def load_user(user_id):
    if user_id == config.ADMIN_USERNAME:
        return User(config.ADMIN_USERNAME, 'Admin', is_admin=True)
    if user_id in config.TEAMS:
        return User(user_id, config.TEAMS[user_id]['display_name'])
    return None


# ============================================
# CONTEXT PROCESSORS
# ============================================
@app.context_processor
def inject_globals():
    return {
        'tool_urls': config.TOOL_URLS,
        'challenges': config.CHALLENGES,
    }


# ============================================
# AUTH ROUTES
# ============================================
@app.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin'))
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip().lower()
        password = request.form.get('password', '').strip()

        # Admin login
        if username == config.ADMIN_USERNAME and password == config.ADMIN_PASSWORD:
            user = User(config.ADMIN_USERNAME, 'Admin', is_admin=True)
            login_user(user)
            return redirect(url_for('admin'))

        # Team login
        if username in config.TEAMS and config.TEAMS[username]['password'] == password:
            user = User(username, config.TEAMS[username]['display_name'])
            login_user(user)
            return redirect(url_for('dashboard'))

        flash('Invalid team name or password.', 'error')

    return render_template('login.html', teams=list(config.TEAMS.keys()))


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('login'))


# ============================================
# DASHBOARD
# ============================================
@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.is_admin:
        return redirect(url_for('admin'))

    completed = models.get_team_progress(current_user.id)

    challenge_states = {}
    for cid in range(1, 7):
        if cid in completed:
            challenge_states[cid] = 'completed'
        elif models.is_challenge_unlocked(current_user.id, cid):
            challenge_states[cid] = 'unlocked'
        else:
            challenge_states[cid] = 'locked'

    return render_template('dashboard.html',
                           completed=completed,
                           challenge_states=challenge_states)


# ============================================
# CHALLENGE PAGES
# ============================================
@app.route('/challenge/<int:challenge_id>')
@login_required
def challenge(challenge_id):
    if current_user.is_admin:
        return redirect(url_for('admin'))

    if challenge_id < 1 or challenge_id > 6:
        flash('Invalid challenge.', 'error')
        return redirect(url_for('dashboard'))

    if not models.is_challenge_unlocked(current_user.id, challenge_id):
        flash(f'Complete Challenge {challenge_id - 1} first to unlock this challenge.', 'error')
        return redirect(url_for('dashboard'))

    completed = models.get_team_progress(current_user.id)
    is_completed = challenge_id in completed

    # Get challenge tools with URLs
    challenge_info = config.CHALLENGES[challenge_id]
    tools_with_urls = [
        {'name': t, 'url': config.TOOL_URLS.get(t, '#'), 'label': t.capitalize()}
        for t in challenge_info.get('tools', [])
    ]

    return render_template(f'challenge{challenge_id}.html',
                           challenge_id=challenge_id,
                           challenge=challenge_info,
                           is_completed=is_completed,
                           completed=completed,
                           tools_with_urls=tools_with_urls)


@app.route('/complete/<int:challenge_id>', methods=['POST'])
@login_required
def complete(challenge_id):
    if current_user.is_admin:
        return jsonify({'error': 'Admins cannot complete challenges'}), 403

    if challenge_id < 1 or challenge_id > 6:
        return jsonify({'error': 'Invalid challenge'}), 400

    if not models.is_challenge_unlocked(current_user.id, challenge_id):
        return jsonify({'error': 'Challenge is locked'}), 403

    models.complete_challenge(current_user.id, challenge_id)
    completed = models.get_team_progress(current_user.id)

    return jsonify({
        'success': True,
        'completed': completed,
        'next_unlocked': challenge_id + 1 if challenge_id < 6 else None
    })


# ============================================
# ADMIN
# ============================================
@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))

    all_progress = models.get_all_teams_progress()
    teams_data = []
    for team_id, team_info in config.TEAMS.items():
        progress = all_progress.get(team_id, [])
        completed_ids = [p['challenge_id'] for p in progress]
        teams_data.append({
            'id': team_id,
            'display_name': team_info['display_name'],
            'completed': completed_ids,
            'progress_pct': round(len(completed_ids) / 6 * 100),
        })

    teams_data.sort(key=lambda t: len(t['completed']), reverse=True)

    return render_template('admin.html', teams_data=teams_data)


@app.route('/admin/reset/<team_id>', methods=['POST'])
@login_required
def admin_reset_team(team_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Forbidden'}), 403
    models.reset_team_progress(team_id)
    return jsonify({'success': True})


@app.route('/admin/reset-all', methods=['POST'])
@login_required
def admin_reset_all():
    if not current_user.is_admin:
        return jsonify({'error': 'Forbidden'}), 403
    models.reset_all_progress()
    return jsonify({'success': True})


@app.route('/admin/toggle/<team_id>/<int:challenge_id>', methods=['POST'])
@login_required
def admin_toggle_challenge(team_id, challenge_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Forbidden'}), 403

    completed = models.get_team_progress(team_id)
    if challenge_id in completed:
        models.uncomplete_challenge(team_id, challenge_id)
        action = 'uncompleted'
    else:
        models.complete_challenge(team_id, challenge_id)
        action = 'completed'

    return jsonify({'success': True, 'action': action})


# ============================================
# INIT
# ============================================
if __name__ == '__main__':
    models.init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
