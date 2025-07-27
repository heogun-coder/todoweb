from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///todo.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    categories = db.relationship('Category', backref='user', lazy=True, cascade='all, delete-orphan')

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default='#3B82F6')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tasks = db.relationship('Task', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'task_count': len([t for t in self.tasks if not t.completed])
        }

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    memo = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(10), default='moderate')  # high, moderate, low
    due_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    order_index = db.Column(db.Integer, default=0)
    
    # Repeatable task fields
    is_repeatable = db.Column(db.Boolean, default=False)
    repeat_type = db.Column(db.String(20))  # daily, weekly, monthly, yearly
    repeat_interval = db.Column(db.Integer, default=1)
    repeat_end_date = db.Column(db.DateTime)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    parent_task_id = db.Column(db.Integer, db.ForeignKey('task.id'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'memo': self.memo,
            'completed': self.completed,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'order_index': self.order_index,
            'is_repeatable': self.is_repeatable,
            'repeat_type': self.repeat_type,
            'repeat_interval': self.repeat_interval,
            'repeat_end_date': self.repeat_end_date.isoformat() if self.repeat_end_date else None,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'is_overdue': self.due_date and self.due_date < datetime.utcnow() and not self.completed,
            'is_due_soon': self.due_date and self.due_date < datetime.utcnow() + timedelta(days=1) and not self.completed
        }

# Helper function to generate JWT token
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# Middleware to verify JWT token
def token_required(f):
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

# Auth Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Create default categories
    default_categories = [
        {'name': 'Personal', 'color': '#3B82F6'},
        {'name': 'Work', 'color': '#EF4444'},
        {'name': 'Shopping', 'color': '#10B981'},
        {'name': 'Health', 'color': '#F59E0B'}
    ]
    
    for cat_data in default_categories:
        category = Category(name=cat_data['name'], color=cat_data['color'], user_id=user.id)
        db.session.add(category)
    
    db.session.commit()
    
    token = generate_token(user.id)
    return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        token = generate_token(user.id)
        return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})
    
    return jsonify({'message': 'Invalid credentials'}), 401

# Task Routes
@app.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    completed = request.args.get('completed', 'false').lower() == 'true'
    category_id = request.args.get('category_id')
    
    query = Task.query.filter_by(user_id=current_user.id, completed=completed)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    tasks = query.order_by(Task.order_index.asc(), Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks])

@app.route('/api/tasks', methods=['POST'])
@token_required
def create_task(current_user):
    data = request.get_json()
    
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        memo=data.get('memo', ''),
        priority=data.get('priority', 'moderate'),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        is_repeatable=data.get('is_repeatable', False),
        repeat_type=data.get('repeat_type'),
        repeat_interval=data.get('repeat_interval', 1),
        repeat_end_date=datetime.fromisoformat(data['repeat_end_date']) if data.get('repeat_end_date') else None,
        category_id=data.get('category_id'),
        user_id=current_user.id,
        order_index=data.get('order_index', 0)
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify(task.to_dict()), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'message': 'Task not found'}), 404
    
    data = request.get_json()
    
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.memo = data.get('memo', task.memo)
    task.priority = data.get('priority', task.priority)
    task.due_date = datetime.fromisoformat(data['due_date']) if data.get('due_date') else task.due_date
    task.category_id = data.get('category_id', task.category_id)
    task.order_index = data.get('order_index', task.order_index)
    
    if 'completed' in data:
        task.completed = data['completed']
        task.completed_at = datetime.utcnow() if data['completed'] else None
        
        # Handle repeatable tasks
        if data['completed'] and task.is_repeatable:
            create_next_repeatable_task(task)
    
    db.session.commit()
    return jsonify(task.to_dict())

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'message': 'Task not found'}), 404
    
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'})

@app.route('/api/tasks/reorder', methods=['POST'])
@token_required
def reorder_tasks(current_user):
    data = request.get_json()
    task_orders = data['task_orders']  # [{'id': 1, 'order_index': 0}, ...]
    
    for item in task_orders:
        task = Task.query.filter_by(id=item['id'], user_id=current_user.id).first()
        if task:
            task.order_index = item['order_index']
    
    db.session.commit()
    return jsonify({'message': 'Tasks reordered successfully'})

# Category Routes
@app.route('/api/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    categories = Category.query.filter_by(user_id=current_user.id).all()
    return jsonify([cat.to_dict() for cat in categories])

@app.route('/api/categories', methods=['POST'])
@token_required
def create_category(current_user):
    data = request.get_json()
    category = Category(
        name=data['name'],
        color=data.get('color', '#3B82F6'),
        user_id=current_user.id
    )
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

# Calendar Routes
@app.route('/api/calendar/tasks', methods=['GET'])
@token_required
def get_calendar_tasks(current_user):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Task.query.filter_by(user_id=current_user.id).filter(Task.due_date.isnot(None))
    
    if start_date:
        query = query.filter(Task.due_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Task.due_date <= datetime.fromisoformat(end_date))
    
    tasks = query.all()
    return jsonify([task.to_dict() for task in tasks])

def create_next_repeatable_task(original_task):
    if not original_task.is_repeatable or not original_task.due_date:
        return
    
    next_due_date = calculate_next_due_date(original_task.due_date, original_task.repeat_type, original_task.repeat_interval)
    
    if original_task.repeat_end_date and next_due_date > original_task.repeat_end_date:
        return
    
    new_task = Task(
        title=original_task.title,
        description=original_task.description,
        memo=original_task.memo,
        priority=original_task.priority,
        due_date=next_due_date,
        is_repeatable=original_task.is_repeatable,
        repeat_type=original_task.repeat_type,
        repeat_interval=original_task.repeat_interval,
        repeat_end_date=original_task.repeat_end_date,
        category_id=original_task.category_id,
        user_id=original_task.user_id,
        parent_task_id=original_task.id
    )
    
    db.session.add(new_task)

def calculate_next_due_date(current_date, repeat_type, interval):
    if repeat_type == 'daily':
        return current_date + timedelta(days=interval)
    elif repeat_type == 'weekly':
        return current_date + timedelta(weeks=interval)
    elif repeat_type == 'monthly':
        return current_date + timedelta(days=30 * interval)  # Approximate
    elif repeat_type == 'yearly':
        return current_date + timedelta(days=365 * interval)  # Approximate
    return current_date

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
