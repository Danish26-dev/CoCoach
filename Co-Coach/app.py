import os
from flask import Flask, send_from_directory, jsonify, request, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from extensions import db
from models import User, WorkoutHistory

app = Flask(__name__, static_folder='.')

app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "cocoach-secret-key-for-hackathon-2024"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL") or "sqlite:///cocoach.db"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'serve_index'


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'Authentication required'}), 401


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


with app.app_context():
    db.create_all()


@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        user = User(email=email, full_name=full_name)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        login_user(user)
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True}), 200


@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    return jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'full_name': current_user.full_name
    }), 200


@app.route('/api/workout-history', methods=['POST'])
@login_required
def save_workout():
    try:
        data = request.get_json()
        
        workout = WorkoutHistory(
            user_id=current_user.id,
            exercise_type=data.get('exercise_type'),
            sport_category=data.get('sport_category'),
            duration_seconds=data.get('duration_seconds'),
            reps_count=data.get('reps_count'),
            metrics=data.get('metrics', {})
        )
        
        db.session.add(workout)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'workout_id': workout.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/workout-history', methods=['GET'])
@login_required
def get_workout_history():
    try:
        limit = request.args.get('limit', 50, type=int)
        
        workouts = WorkoutHistory.query.filter_by(user_id=current_user.id)\
            .order_by(WorkoutHistory.created_at.desc())\
            .limit(limit)\
            .all()
        
        return jsonify({
            'workouts': [{
                'id': w.id,
                'exercise_type': w.exercise_type,
                'sport_category': w.sport_category,
                'duration_seconds': w.duration_seconds,
                'reps_count': w.reps_count,
                'metrics': w.metrics,
                'created_at': w.created_at.isoformat()
            } for w in workouts]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
