const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

//music
var bg_music = new Audio('static/audio/bg_music.mp3');


//hover 
var hover_create_socket = false;

var socket = io();
// all the computers available [[x, y], [x1, y1]]
var computers = [];

//values = [[first_pos,second_pos],...]
var connected = [];

// Key: [x,y]
// Value: name
var users = {};

//own coords
var coods = [];

//first part of creating socket
var first = [];
var one = false;

//second part of creating socket
var second = false;

//mining
var mine = false;
var mining = [];
var coins = 0;

//hacking
var hack = false;

// scanning
var scan = false;
var computers_scanning = [];  // array of coords(x, y)


//key
var keys = [];

//username
var username;

var x = 0;
var y = 0;
socket.on('create', (objects,linked) => {
  console.log(objects);
  computers = objects;
  connected = linked;
});


socket.on('del_user',(user,linked) =>{
  connected = linked;
  console.log(user);
  users = {};
  keys = [];
  for(var i = 0;i<user.length;i++){
    
    // Now is ['name','coord1','coord2]
    for(var j = 1;j<user[i].length;j++){
      users[[user[i][j][0],user[i][j][1]]] = user[i][0];
      keys.push([user[i][j][0],user[i][j][1]]);
    }
  }
  
  console.log(users);
});

socket.on('add_user', user => {
  // User = [['name','coord1','coord2],['name2','coord1']]
  console.log(user);
  users = {};
  keys = [];
  for(var i = 0;i<user.length;i++){
    
    // Now is ['name','coord1','coord2]
    for(var j = 1;j<user[i].length;j++){
      users[[user[i][j][0],user[i][j][1]]] = user[i][0];
      if((x == 0 || y == 0) && username == user[i][0]){
        x = user[i][j][0] - 600;
        y = user[i][j][1] - 300;
      }
      keys.push([user[i][j][0],user[i][j][1]]);
    }
  }
  
  console.log(users);
});


const MAP_SIZE = 600;
setCanvasDimensions();


renderBackground(x,y);
dragMouse(canvas);


function setCanvasDimensions() {
  // On small screens (e.g. phones), we want to "zoom out" so players can still see at least
  // 800 in-game units of width.
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

function renderBackground(x, y) {
    const backgroundX = MAP_SIZE / 2 - x + canvas.width / 2;
    const backgroundY = MAP_SIZE / 2 - y + canvas.height / 2;
    const backgroundGradient = context.createRadialGradient(
      backgroundX,
      backgroundY,
      MAP_SIZE / 10,
      backgroundX,
      backgroundY,
      MAP_SIZE / 2,
    );
    backgroundGradient.addColorStop(0, 'black');
    backgroundGradient.addColorStop(1, 'gray');
    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    var computer = new Image();
    computer.src = 'static/pictures/computer.jpg'
    context.font = "20px Georgia";
    context.fillStyle = 'blue';
    for(var j = 0;j<computers.length;j++){
      context.drawImage(computer,computers[j][0]-x,computers[j][1]-y,30,30);
    }
    //console.log(users);
    for(var key in users) {
      key = JSON.parse("[" + key + "]");
      context.fillText(users[key],key[0]-x,key[1]-y+5,50);
      
    }
  

    //create hud
    context.globalAlpha = 0.2;
    context.fillStyle = 'black';
    context.fillRect(400, 520, 500, 80); 
    context.globalAlpha = 0.5;
    context.fillRect(510, 460, 250, 40); 
    context.globalAlpha = 1;
    var doge = new Image();
    doge.src = 'static/pictures/coin.jpg';
    context.drawImage(doge,520,465,30,30);
    context.fillText(coins,555,485,30,30);
    var server = new Image();
    server.src = 'static/pictures/socket.jpg';
    context.drawImage(server,405, 530, 70, 60);
    var mining_picture = new Image();
    mining_picture.src = 'static/pictures/mining.jpg';
    context.drawImage(mining_picture,500, 530, 70, 60);
    var hacker = new Image();
    hacker.src = 'static/pictures/hacker.jpg';
    context.drawImage(hacker,595, 530, 70, 60);
    var scanner = new Image();  // draw scan button
    scanner.src = 'static/pictures/scan.jpg';
    context.drawImage(scanner,690, 530, 70, 60);

    //hover elements
    if(hover_create_socket){
      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      context.fillRect(500, 300, 300, 200); 
      context.globalAlpha = 1;
      text = 'Create socket with another computer';
      context.fillStyle = 'white';
      context.fillText(text,510,330,1000);
      text = 'Link your computer with another free computer by using a socket to connect them';
      context.fillText(text,510,330,1000);
      text = 'Once they are connected you are able to send messages to the other computer';
      context.fillText(text,510,330,1000);
      text = 'You can order them to mine for more coins or scan for clues';
      context.fillText(text,510,330,1000);
    }

    //remove game-create-socket
    if(!one){
      canvas.removeEventListener('click', game_make_socket, false);
    }
    if(!second){
      canvas.removeEventListener('click', game_make_socket_second, false);
    }
    if(!mine){
      canvas.removeEventListener('click', game_set_mining, false);
    }
    if(!hack){
      canvas.removeEventListener('click', game_hack_computer, false);
    }
    if(!scan){
      canvas.removeEventListener('click', game_computer_scan, false);
    }
    //canvas.removeEventListener('click', game_make_socket_second, false);
    if(one){
      //create interface
      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      context.fillRect(0, 0, 1400, 200); 
      context.globalAlpha = 1;
      text = 'Click on a computer that you own';
      context.fillStyle = 'white';
      context.fillText(text,500,100,1000);
    }
    if(second){
      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      context.fillRect(0, 0, 1400, 200); 
      context.globalAlpha = 1;
      text = 'Click on a computer that you want to create a socket to connect to'
      context.fillStyle = 'white';
      context.fillText(text,350,100,1000);
    }
    if(mine){
      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      context.fillRect(0, 0, 1400, 200); 
      context.globalAlpha = 1;
      text = 'Choose a computer to start/stop mining for cryptocurrency'
      context.fillStyle = 'white';
      context.fillText(text,350,100,1000);
    }
    if(hack){
      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      context.fillRect(0, 0, 1400, 200); 
      context.globalAlpha = 1;
      text = "Choose a computer to hack to disable a player's connection"
      context.fillStyle = 'white';
      context.fillText(text,350,100,1000);
    } else if (scan){
          context.globalAlpha = 0.5;
          context.fillStyle = 'black';
          context.fillRect(0, 0, 1400, 200);
          context.globalAlpha = 1;
          text = "Select a computer to scan for password"
          context.fillStyle = 'white';
          context.fillText(text,350,100,1000);
    }
    //draw connected lines
    for(var i = 0;i<connected.length;i++){
      console.log(connected[i]);
      context.beginPath();
      context.moveTo(connected[i][0][0]-x+15,connected[i][0][1]-y);
      context.lineTo(connected[i][1][0]-x+15,connected[i][1][1]-y);
      context.stroke();
    }
    //write mining
    //console.log(mining);
    for(var i = 0;i<mining.length;i++){
      //console.log(mining[i]);
      context.fillStyle = 'black';
      text = 'Mining...';
      context.fillText(text,mining[i][0]-x-10,mining[i][1]+40-y,100);
    }
    for(var i = 0;i<computers_scanning.length;i++){  // display scanning on top of computers scanning
          //console.log(computers_scanning[i]);
          context.fillStyle = 'black';
          text = 'Scanning...';
          context.fillText(text,computers_scanning[i][0]-x-10,computers_scanning[i][1]+40-y,100);
        }

  }
  
function dragMouse(canvas){
    console.log("Hi");
    canvas.onmousedown = dragMouseDown;
    var posx = 0;
    var posy = 0;
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        posx = e.clientX;
        posy = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        //console.log(x);
        //console.log(y);
      }
    
      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        x = x-(e.clientX-posx)
        y = y- (e.clientY-posy)
        posx = e.clientX;
        posy = e.clientY;
        renderBackground(x,y);

    }
    
      function closeDragElement(e) {
        /* stop moving when mouse button is released:*/
        e = e || window.event;
        e.preventDefault();
        document.onmouseup = null;
        document.onmousemove = null;
      }
    
}
//hover event
canvas.onmousemove = function(e) {
  var hover_x = e.clientX;
  var hover_y = e.clientY;
  hover_create_socket = false;
  if(405<=hover_x && hover_x<=405+70 && 530<=hover_y && hover_y<=530+60){
    hover_create_socket = true;
    renderBackground(x,y);
  }
  else{
    hover_create_socket = false;
    renderBackground(x,y);
  }

   
}

//click event on computers
canvas.addEventListener('click', function(event) {
  //own coords
  coods = [];
  for(var key in users) {
    if(username == users[key]){
      coods.push(JSON.parse("[" + key + "]"));
    }
  }

  var click_x = event.x;
  var click_y = event.y;
  console.log(click_x);
  console.log(click_y);
  if(405<=click_x && click_x<=405+70 && 530<=click_y && click_y<=530+60){
    console.log('clicked');
    //console.log(coods);
    one = true;
    
    canvas.addEventListener('click', game_make_socket, false);
    renderBackground(x,y);

  }
  else if(500<=click_x && click_x<=500+70 && 530<=click_y && click_y<=530+60){
    console.log('set/stop server to mining cryptocurrency');
    mine = true;
    canvas.addEventListener('click', game_set_mining, false);
    renderBackground(x,y);
  }
  else if(595<=click_x && click_x<=595+70 && 530<=click_y && click_y<=530+60){
    console.log('hackerman!');
    hack = true;
    canvas.addEventListener('click', game_hack_computer, false);
    renderBackground(x,y);
  }
  else if(690<=click_x && click_x<=690+70 && 530<=click_y && click_y<=530+60){
    console.log('zeet zeet scanning');
    scan = true;
    canvas.addEventListener('click', game_computer_scan, false);
    renderBackground(x,y);
  }

}, false);

function game_set_mining(event){
  var click_x = event.x+x;
  var click_y = event.y+y;
  for(var i = 0;i<coods.length;i++){
    if(coods[i][0]<=click_x && click_x<=coods[i][0]+40 && coods[i][1]<=click_y && click_y<=coods[i][1]+40){
      var stop = false;
      //console.log(mining);
      for (var j=0;j<mining.length;j++){
        if(mining[j][0] == coods[i][0] && mining[j][1] == coods[i][1]){
          stop = true;
          mine = false;
          mining.splice(j,1);
          //console.log(mining);
          console.log('stop mining');
          renderBackground(x,y);
        }
      }
      if(!stop){
        //console.log("Success!");
        first = [coods[i][0],coods[i][1]];
        mine = false;
        mining.push(coods[i]);
        socket.emit('create_mining',(coods[i]));
        //console.log('clicked!');
        //console.log(mining);
        renderBackground(x,y);
      }
    }
  }

}

socket.on('mined_something', (points,coords) => {
  coins = points;
  console.log(coins);
  var cont = false;
  for (var i=0;i<mining.length;i++){
    //console.log(mining[i]);
    //console.log(coords[0]==mining[i][0]);
    if(coords[0]==mining[i][0] && coords[1]==mining[i][1]){
      cont = true;
    }
  }
  if(cont){
    socket.emit('create_mining',(coords));
    renderBackground(x,y);
  }
});

socket.on('update_coins', (points) => {
  coins = points;
  console.log(coins);
  renderBackground(x,y);
});

function game_make_socket(event) {
  console.log('first stage!');
  var click_x = event.x+x;
  var click_y = event.y+y;
  //console.log(click_x);
  //console.log(click_y);
  //console.log(coods);
  for(var i = 0;i<coods.length;i++){
    if(coods[i][0]-50<=click_x && click_x<=coods[i][0]+50 && coods[i][1]-50<=click_y && click_y<=coods[i][1]+50){
        console.log("Success!");
        first = [coods[i][0],coods[i][1]];
        one = false;
        second = true;
        //create interface
        renderBackground(x,y);
        canvas.addEventListener('click', game_make_socket_second, false);
    }
  }
}

function game_make_socket_second(event) {
  var click_x = event.x+x;
  var click_y = event.y+y;
  //console.log(click_x);
  //console.log(click_y);
  for (var i = 0; i<computers.length; i++){
    if(computers[i][0]<=click_x && click_x<=computers[i][0]+30 && computers[i][1]<=click_y && click_y <=computers[i][1]+30){
      console.log('second computer created');
      second = false;
      
      //caculate cost
      diff_x = first[0] - computers[i][0];
      diff_y = first[1] - computers[i][1];
      distance = (Math.abs(diff_x^2) + Math.abs(diff_y^2))^0.5;
      cost = Math.round(distance * 0.05);
      console.log('cost:');
      console.log(cost.toString());
      alert('It will cost: ' + cost.toString());
      //To be made into socket thingy
      socket.emit('build_socket',(first),([computers[i][0],computers[i][1]]),(username),(cost));
    }
  }

}
socket.on('create_connections', (cd1,cd2,name,cost) => {
  coins -= cost;
  console.log('creating');
  connected.push([cd1,cd2]);
  console.log(connected);
  users[cd2] = name;
  //console.log(users);
  renderBackground(x,y);
});

socket.on('fail_create_connection', message => {
  alert(message);
});


function game_hack_computer(event) {
  console.log('attack first stage!');
  var click_x = event.x+x;
  var click_y = event.y+y;
  //console.log(click_x);
  //console.log(click_y);
  //console.log(coods);
  for(var i = 0;i<computers.length;i++){
    if (computers[i][0]<=click_x && click_x<=computers[i][0]+30 && computers[i][1]<=click_y && click_y <=computers[i][1]+30){
        console.log("Success select computer for hack!");
        //create interface
        // renderBackground(x,y);
        hack = false;
        socket.emit('hack_computer', ([computers[i][0],computers[i][1]]), (username));
        renderBackground(x,y);
    }
  }
  
}


socket.on('remove_connections', (hacked_coord) => {
  console.log('updated hacked machines');
  console.log(connected);
  for (i=0;i<connected.length;i++){
    if (connected[i][1][0] == hacked_coord[0] && connected[i][1][1] == hacked_coord[1]){
      connected.splice(i, 1);
    }
    else if (connected[i][0][0] == hacked_coord[0] && connected[i][0][1] == hacked_coord[1]){
      connected.splice(i, 1);
    }
  }
  console.log(connected);
  hack = false;
  renderBackground(x,y);
});

socket.on('got_hacked', (message) => {
  alert(message);
});

function game_computer_scan(event){
  var click_x = event.x+x;
    var click_y = event.y+y;
    for(var i = 0;i<coods.length;i++){
      // check if own computer
      if(coods[i][0]<=click_x && click_x<=coods[i][0]+40 && coods[i][1]<=click_y && click_y<=coods[i][1]+40){
        var stop = false;
        //console.log(computers_scanning);
        for (var j=0;j<computers_scanning.length;j++){
          // check if computer scanning
          if(computers_scanning[j][0] == coods[i][0] && computers_scanning[j][1] == coods[i][1]){
            stop = true;
            scan = false;
            computers_scanning.splice(j,1);
            //console.log(computers_scanning);
            console.log('stop computers_scanning');
            renderBackground(x,y);
          }
        }
        if(!stop){
          //console.log("Success!");
          first = [coods[i][0],coods[i][1]];
          scan = false;
          computers_scanning.push(coods[i]);
          socket.emit('create_computers_scanning',(coods[i]));
          //console.log('clicked!');
          //console.log(computers_scanning);
          renderBackground(x,y);
        }
      }
    }
}


function Remove(){
  const playMenu = document.getElementById('play-menu');
  const usernameInput = document.getElementById('username-input');
  username = usernameInput.value;
  if(!username){
    username = 'Guest';
  }
  playMenu.classList.add('hidden');
  console.log(username);
  socket.emit('user',(socket.id),(username));
  bg_music.play();
  window.setInterval(function(){
    console.log('playing music');
    bg_music.play();
  },65000)
  renderBackground(x,y);
}