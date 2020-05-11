from flask_socketio import SocketIO, send, emit, join_room, leave_room
from flask import Flask, render_template, request, session, redirect, url_for
from objects import create_objects, find_object
import random
from threading import Timer
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False
app.app_context()
socketio = SocketIO(app, async_mode='threading', logger=True, engineio_logger=True, cors_allowed_origins='https://flask-socketio-game.herokuapp.com')

password = 'sTrInG_fOr_TeStIng'

# users dictionary:
# key = id, value = [name,coords]
users = {}

# user_object dict for more advanced stuff
# key = id, value = [object,object,...]
users_objects = {}

# user points:
users_points = {}

# connected list
connected = []

# user scanned items
# key: socket id
# value: dictionary of keys:
# unfound: array of unfound indeces of password e.g. [0, 1, 2, 3...] for constant time
# found: string of found password e.g. '~~~~~_World!' -> ~ means unfound
# progress: integer of 0-59 (seconds) >= 60 gets a character of password
users_scanned = {}

# list of all the objects
# objects
# .get_coords()
# .get_user()
# .set_user(user)
computers = create_objects()


def mined_something(_id, coords):
    with app.app_context():
        users_points[_id] += 1
        emit('mined_something', (users_points[_id], coords), namespace='/', room=_id)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/win', methods=['POST'])
def win():
    password_gotten = request.form.get('password', None)
    if not password_gotten or password_gotten == '' or len(password_gotten) != len(password):
        return redirect(url_for(index))
    else:
        return render_template('won.html', password=password_gotten)


@socketio.on('connect')
def connect():
    coords = [computer.get_coords() for computer in computers]
    room = session.get('room')
    join_room(room)
    emit('create', (coords, connected))


@socketio.on('build_socket')
def build_socket(first_pos, second_pos, username, cost):
    computer = find_object(computers, second_pos)
    if computer.get_user():
        # already have user
        emit('fail_create_connection', ('You cannot occupy the server cause someone else is there! You have to attack'))
    elif users_points[request.sid] < cost:
        emit('fail_create_connection', ('Not enough coins!'))
    else:
        users_points[request.sid] -= cost
        connected.append([first_pos, second_pos])
        users[request.sid].append(second_pos)
        users_objects[request.sid].append(computer)
        computer.set_user(request.sid)
        emit('create_connections', (first_pos, second_pos, username, users_points[request.sid]), namespace='/', broadcast=True)


@socketio.on('create_mining')
def create_mining(coords):
    # print('recieved!')
    t = Timer(1, mined_something, args=[request.sid, coords])
    t.start()


@socketio.on('hack_computer')
def hack_computer(position, username):
    with app.app_context():
        _id = request.sid
        # print('!!!')
        # print(users_points[_id])
        if users_points[_id] >= 50:
            computer = find_object(computers, position)
            if len(users[computer.get_user()]) > 2:
                # already have user
                to_be_deleted = []
                print(connected)
                for i in range(len(connected)):
                    print('CONNECTED => ', connected)
                    if connected[i][0] == position or connected[i][1] == position:
                        to_be_deleted.append(i - len(to_be_deleted))
                for i in to_be_deleted:
                    del connected[i]
                print(connected)
                print(users)
                for key in users:
                    for i in range(len(users[key])):
                        if users[key][i] == position:
                            del users[key][i]
                            break
                print(users)

                # del users[request.sid][users[request.sid].index(position)]
                # del users_objects[request.sid][users_objects[request.sid].index(computer)]
                print(users[request.sid])
                opponent = computer.get_user()
                computer.set_user(False)
                users_points[_id] -= 50
                values = json.dumps(users.values())
                emit('del_user', (values, connected), namespace='/', broadcast=True)
                emit('update_hacked_machines', (position), namespace='/', broadcast=True)
                emit('update_coins', (users_points[_id]), namespace='/', room=_id)
                emit('got_hacked', ('You just got hacked!'), namespace='/', room=opponent)
            elif len(users[computer.get_user()]) <= 2:
                emit('fail_create_connection', ("You cannot hack a person's last connection!"))
            else:
                emit('fail_create_connection', ('You cannot hack a computer with no connection!'))
        else:
            emit('fail_create_connection', ('Not enough coins!'))


def scan_progressed(_id, coords):
    with app.app_context():
        users_scanned[_id]['progress'] += 1
        if users_scanned[_id]['progress'] >= 10:  # "seconds" passed
            random_index = random.choice(users_scanned[_id]['unfound'])
            users_scanned[_id]['found'][random_index] = password[random_index]
            users_scanned[_id]['progress'] -= 10  # remove done progress
            del users_scanned[_id]['unfound'][users_scanned[_id]['unfound'].index(random_index)]
        user_found_password = ''.join(users_scanned[_id]['found'])
        if user_found_password == password:
            # emit game_won, redirect in js
            emit('game_won', user_found_password, namespace='/', room=_id)
        else:
            emit('scaned_stuff', (users_scanned[_id]['progress'],coords,users_scanned[_id]['found']), namespace='/', room=_id)


@socketio.on('create_computers_scanning')
def create_computers_scanning(coords):
    # print('recieved scan!')
    t = Timer(5, scan_progressed, args=[request.sid, coords])
    t.start()


@socketio.on('user')
def user(id, username):
    print(id)
    print(username)
    users[id] = [username]
    com = computers[random.randint(0, 100)]
    while com.get_user():
        com = computers[random.randint(0, 100)]
    com.set_user(id)
    users[id].append(com.get_coords())
    users_objects[id] = [com]
    users_points[id] = 0
    users_scanned[id] = {}
    users_scanned[id]['found'] = ['~' for i in range(len(password))]
    users_scanned[id]['unfound'] = [i for i in range(len(password))]
    users_scanned[id]['progress'] = 0
    values = json.dumps(users.values())
    emit('add_user', values , namespace='/', broadcast=True)


@socketio.on('disconnect')
def disconnect():
    print('Client disconnected')
    print(request.sid)
    # coords
    own_coords = users[request.sid][1:]
    deleted_index = []
    for i in range(len(connected)):
        if connected[i][0] in own_coords or connected[i][1] in own_coords:
            deleted_index.append(i - len(deleted_index))

    for index in deleted_index:
        connected.pop(index)
    for com in users_objects[request.sid]:
        com.set_user(False)
    
    del users[request.sid]
    del users_objects[request.sid]
    del users_points[request.sid]
    del users_scanned[request.sid]
    print(users)
    values = json.dumps(users.values())
    emit('del_user', (values, connected), namespace='/', broadcast=True)


if __name__ == '__main__':
    socketio.run(app)
