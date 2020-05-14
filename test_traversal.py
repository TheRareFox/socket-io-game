
home_location = {
    1234: '1-2',
    2345: '5-7'
}
computer_connections = {
    '1-2': ['3-8', '2-7', '4-6'],
    '3-8': ['4-32', '14-32'],
    '5-7': ['35-2', '2-52'],
    '2-7': [],
    '4-6': ['24-35', '14-23'],
    '4-32': [],
    '14-32': [],
    '24-35': ['38-41'],
    '14-23': [],
    '35-2': [], 
    '2-52': [],
    '38-41': []
}
'''
1-2: 
1-2: 3-8 + 4-32 + []
1-2:     + 14-32 + []
1-2: 2-7 + []
1-2: 4-6 + 24-35 + 38-41
1-2:     + 14-23 + []

5-7: 35-2 + []
5-7: 2-52 + []
'''


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
    del computer_connections[computer_location_str]


def delete_tree_loc(computer_location, thing):
    print(thing)
    print(computer_location)
    print(computer_connections[computer_location])
    print(thing in computer_connections[computer_location])
    if type(computer_location) == list:
        computer_location = '-'.join([str(computer_location[0]), str(computer_location[1])])
    if type(thing) == list:
        thing = '-'.join([str(thing[0]), str(thing[1])])
    if thing in computer_connections[computer_location]:
        computer_connections[computer_location].remove(thing)
    elif computer_location in computer_connections:
        for i in computer_connections[computer_location]:
            delete_tree_loc(i, thing)


get_hacked_user = 1234
get_home_location = home_location[get_hacked_user].split('-')
get_home_location = [int(i) for i in get_home_location]
opponent = 1234
#print(computer_connections, 'BEFORE=======================================')
delete_from_all([38, 41], get_hacked_user)
#print(computer_connections, 'INTER=======================================')
delete_tree_loc(home_location[get_hacked_user], [38, 41])
#print(computer_connections, 'AFTER=======================================\n\n')

#print(computer_connections, 'BEFORE=======================================')
delete_from_all([24, 35], get_hacked_user)
#print(computer_connections, 'INTER=======================================')
delete_tree_loc(home_location[get_hacked_user], [24, 35])
#print(computer_connections, 'AFTER=======================================')

'''
RESULT
1-2: 
1-2: 3-8 + 4-32 + []
1-2:     + 14-32 + []
1-2: 2-7 + []
1-2: 4-6 + 14-23 + []

5-7: 35-2 + []
5-7: 2-52 + []
'''


'''
1-2: 
1-2: 3-8 + 4-32 + []
1-2:     + 14-32 + []
1-2: 2-7 + []
1-2: 4-6 + 24-35 + 38-41
1-2:     + 14-23 + []

5-7: 35-2 + []
5-7: 2-52 + []
'''