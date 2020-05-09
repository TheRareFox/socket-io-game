import random


class Object:
    def __init__(self, x, y, user=False):
        self.x = x
        self.y = y
        self.user = user

    def set_user(self, user):
        self.user = user

    def get_user(self):
        return self.user

    def get_x(self):
        return self.x

    def get_y(self):
        return self.y

    def get_coords(self):
        return [self.x, self.y]


def create_objects():
    lis = []
    for x in range(11):
        for y in range(11):
            obj = Object(random.randint(200, 300) * x, random.randint(200, 300) * y)
            lis.append(obj)
    return lis

def find_object(computers,coords):
    for computer in computers:
        if computer.get_coords() == coords:
            return computer
    return False
    