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
socketio = SocketIO(app, async_mode='threading', logger=True, engineio_logger=True, 
cors_allowed_origins=['https://flask-socketio-game.herokuapp.com', 'http://127.0.0.1:5000', 'http://localhost:5000'])

password = 'z cfmv jftbvkzf'

# users dictionary:
# key = socket id, value = [name,coords]
users = {}

# user_object dict for more advanced stuff
# key = id, value = [object,object,...]
users_objects = {}

# user points:
users_points = {}

# connected list
connected = []

'''dictionary containing home locations
example: 
home_location = {
    1234: {'home': 'x1-y1' }, 
    1274: {'home': 'x2-y2' },
    ... ...
}'''
home_location = {}

'''dictionary that contain next linked computers.
example:
computer_connections = {
    'x4-y4': ['x2-y2', 'x8-y8'],
    'x2-y2': ['x5-y5', 'x3-y3'],
    'x1-y1': ['x9-y9', 'x4-y4'],
    ... ...
}'''
computer_connections = {}

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


def delete_tree(computer_location):
    if type(computer_location) == list:
        computer_location = '-'.join([str(computer_location[0]), str(computer_location[1])])
    for i in computer_connections[computer_location]:
        delete_tree(i)
    del computer_connections[computer_location]


def delete_from_all(computer_location, user_room):
    
    if type(computer_location) == list:
        computer_location_str = '-'.join([str(computer_location[0]), str(computer_location[1])])
    else:
        computer_location_str = computer_location
        computer_location = computer_location.split('-')
        computer_location = [int(i) for i in computer_location]
    
    print(computer_location)
    for i in computer_connections[computer_location_str]:
        delete_from_all(i, user_room)
    for i in range(len(connected)):
        print('CONNECTED => ', connected)
        print(i)
        print(connected[i][0], type(connected[i][0]))
        print(connected[i][1], type(connected[i][1]))
        # emit('got_hacked', (computer_location), namespace='/', room=user_room)
        if connected[i][0] == computer_location or connected[i][1] == computer_location:
            emit('del_self',(str(computer_location)), namespace='/', room=user_room)
            del connected[i]
            print('deleted')
            break
    for key in users:
        for i in range(len(users[key])):
            print('USERS => ', users)
            print(i)
            if users[key][i] == computer_location:
                computer = find_object(computers, computer_location)
                computer.set_user(False)
                del users[key][i]
                break
    del computer_connections[computer_location_str]


def delete_tree_loc(computer_location, thing):
    if type(computer_location) == list:
        computer_location = '-'.join([str(computer_location[0]), str(computer_location[1])])
    if type(thing) == list:
        thing = '-'.join([str(thing[0]), str(thing[1])])
    if thing in computer_connections[computer_location]:
        computer_connections[computer_location].remove(thing)
    elif computer_location in computer_connections:
        for i in computer_connections[computer_location]:
            delete_tree_loc(i, thing)


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
    if len(users)>=5:
        return redirect('https://bbcs2020-apt-get-socket-game.herokuapp.com/')
    coords = [computer.get_coords() for computer in computers]
    room = session.get('room')
    join_room(room)
    emit('create', (coords, connected))


@socketio.on('build_socket')
def build_socket(first_pos, second_pos, username, cost):
    computer = find_object(computers, second_pos)
    _id = request.sid
    if not computer:
        emit('fail_create_connection', ('There is nothing there!'))
    if computer.get_user():
        # already have user
        emit('fail_create_connection', ('You cannot occupy the server cause someone else is there! You have to attack'))
    elif users_points[_id] < cost:
        emit('fail_create_connection', ('Not enough coins!'))
    else:
        users_points[_id] -= cost
        connected.append([first_pos, second_pos])
        users[_id].append(second_pos)
        users_objects[_id].append(computer)
        computer.set_user(_id)
        computer_connections['-'.join([str(first_pos[0]), str(first_pos[1])])].append('-'.join([str(second_pos[0]), str(second_pos[1])]))
        computer_connections['-'.join([str(second_pos[0]), str(second_pos[1])])] = []
        
        emit('add_self',(str(second_pos)), namespace='/', room = _id)
        emit('update_coins', (users_points[request.sid]), namespace='/', room = _id)
        emit('create_connections', (first_pos, second_pos, username), namespace='/', broadcast=True)


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
            print('='*50)
            print(computer.get_coords())
            get_hacked_user = computer.get_user()
            if not get_hacked_user:
                emit('fail_create_connection', ('You cannot hack this!'))

            get_home_location = home_location[get_hacked_user].split('-')
            get_home_location = [int(i) for i in get_home_location]
            # elif len(users[get_hacked_user]) > 2:
            if computer.get_coords() == get_home_location:
                emit('fail_create_connection', ("You cannot a person's home base!"))
            elif computer.get_coords() != get_home_location:
                opponent = computer.get_user()
                # already have user
                # to_be_deleted = []
                print(connected)
                # for i in range(len(connected)):
                #     print('CONNECTED => ', connected)
                #     if connected[i][0] == position or connected[i][1] == position:
                #         to_be_deleted.append(i - len(to_be_deleted))
                # for i in to_be_deleted:
                #     emit('del_self',(connected[i]))
                #     del connected[i]
                #print(connected)
                print(users)
                # for key in users:
                #     for i in range(len(users[key])):
                #         if users[key][i] == position:
                #             del users[key][i]
                #             break
                delete_from_all(computer.get_coords(), get_hacked_user)
                print('values'+'-'*100)
                for i in computer_connections:
                    print(i)
                    print(computer_connections[i])
                delete_tree_loc(home_location[get_hacked_user], computer.get_coords())
                print('hacked' + '='*100)
                print(connected)
                print(users)

                # del users[request.sid][users[request.sid].index(position)]
                # del users_objects[request.sid][users_objects[request.sid].index(computer)]
                print(users[request.sid])
                
                users_points[_id] -= 50
                values = json.dumps(list(users.values()))
                
                print('///////////////////////')
                print(values)
                emit('del_user', (values, connected), namespace='/', broadcast=True)
                emit('update_coins', (users_points[_id]), namespace='/', room=_id)
                emit('fail_create_connection', ('You just got hacked!'), namespace='/', room=opponent)
            elif len(users[computer.get_user()]) <= 2:
                emit('fail_create_connection', ("You cannot hack a person's last connection!"))
            else:
                emit('fail_create_connection', ('You cannot hack a computer with no connection!'))
        else:
            emit('fail_create_connection', ('Not enough coins!'))


def scan_progressed(_id, coords):
    with app.app_context():
        users_scanned[_id]['progress'] += 1
        if users_scanned[_id]['progress'] >= 20:  # "seconds" passed
            random_index = random.choice(users_scanned[_id]['unfound'])
            users_scanned[_id]['found'][random_index] = password[random_index]
            users_scanned[_id]['progress'] -= 20  # remove done progress
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
    values = json.dumps(list(com.get_coords()))
    with app.app_context():
        emit('add_self',values, namespace='/',room = id)
    users[id].append(com.get_coords())
    users_objects[id] = [com]
    users_points[id] = 0
    users_scanned[id] = {}
    users_scanned[id]['found'] = ['~' for i in range(len(password))]
    users_scanned[id]['unfound'] = [i for i in range(len(password))]
    users_scanned[id]['progress'] = 0
    print(com.get_coords()[0], com.get_coords()[1])
    home_location[id] = '-'.join([str(com.get_coords()[0]), str(com.get_coords()[1])])
    computer_connections['-'.join([str(com.get_coords()[0]), str(com.get_coords()[1])])] = []
    
    values = json.dumps(list(users.values()))
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
    
    # deleting form computers user owned
    delete_tree(home_location[request.sid])
    del home_location[request.sid]

    print(users)
    values = json.dumps(list(users.values()))
    emit('del_user', (values, connected), namespace='/', broadcast=True)


if __name__ == '__main__':
    socketio.run(app)
