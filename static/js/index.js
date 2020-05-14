const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');


//password
var password = [];

// hover 
var hover_create_socket = false;
var hover_mine = false;
var hover_hack = false;
var hover_scan = false;
var hover_home = false;

var socket = io();
// all the computers available [[x, y], [x1, y1]]
var computers = [];

//values = [[first_pos,second_pos],...]
var connected = [];

// dictionary containing which connections are connected to it
connected_down = {};

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
const scanning_progress = document.getElementById('scanning_progress');
var scan = false;
var computers_scanning = [];  // array of coords(x, y)
//scanning progress

//key
var keys = [];

//username
var username = '';

var x = 0;
var y = 0;
socket.on('create', (objects,linked) => {
  console.log(objects);
  computers = objects;
  connected = linked;
});




socket.on('add_self', (coords) => {
  //console.log(coords);
  coods.push(JSON.parse(coords));
  //console.log('hi');
});

socket.on('del_self', (coords) => {
  coords = JSON.parse(coords);
  for(i=0;i<coods.length;++i){
    if(coods[i][0] == coords[0] && coods[i][1] == coords[1]){
      coods.splice(i,1);
    }
  }
  for(i=0;i<mining.length;++i){
    if(mining[i][0] == coords[0] && mining[i][1] == coords[1]){
      mining.splice(i,1);
    }
  }
  for(i=0;i<computers_scanning.length;++i){
    if(computers_scanning[i][0] == coords[0] && computers_scanning[i][1] == coords[1]){
      computers_scanning.splice(i,1);
    }
  }
});


socket.on('del_user',(user,linked) =>{
  //console.log(user);
  user = JSON.parse(user);
  connected = linked;
  //console.log(user);
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
  renderBackground(x,y);

});

socket.on('add_user', user => {
  user = JSON.parse(user);
  //console.log(user);
  users = {};
  keys = [];

  for(var i = 0;i<user.length;i++){
    // Now is ['name','coord1','coord2]
    for(var j = 1;j<user[i].length;j++){
      users[[user[i][j][0],user[i][j][1]]] = user[i][0];
      keys.push([user[i][j][0],user[i][j][1]]);
    }
  }  
  console.log(username);

  if(x == 0 && y == 0){
    x = coods[0][0]-600;
    y = coods[0][1]-300;
  }
  console.log(users);
  renderBackground(x,y);

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
  computer.src = 'static/pictures/computer.jpg';
  context.font = "20px Georgia";
  context.fillStyle = 'blue';
  for(var j = 0;j<computers.length;j++){
    context.drawImage(computer,computers[j][0]-x,computers[j][1]-y,30,30);
  }
  //draw crown
  if (coods[0]){
    //console.log(coods[0][0]);
    var crown = new Image();
    crown.src = 'static/pictures/crown.jpg';
    context.drawImage(crown,coods[0][0]-x,coods[0][1]-y-30, 30, 30);
  
  }
  
  //console.log(users);
  for(var key in users) {
    key = JSON.parse("[" + key + "]");
    context.fillText(users[key],key[0]-x,key[1]-y+5,50);
  }
  
  //create hud
  context.globalAlpha = 0.2;
  context.fillStyle = 'black';
  context.fillRect(canvas.width/2 -250, canvas.height -160, 500, 80); 
  context.globalAlpha = 0.5;
  context.fillRect(canvas.width/2 -125, canvas.height -220, 250, 40); 
  context.globalAlpha = 1;
  var doge = new Image();
  doge.src = 'static/pictures/coin.jpg';
  context.drawImage(doge,canvas.width/2 -120, canvas.height -215,30,30);
  context.fillText(coins,canvas.width/2 -85, canvas.height -195,30,30);
  var server = new Image();
  server.src = 'static/pictures/socket.jpg';
  context.drawImage(server,canvas.width/2 -240, canvas.height -150, 70, 60);
  var mining_picture = new Image();
  mining_picture.src = 'static/pictures/mining.jpg';
  context.drawImage(mining_picture,canvas.width/2 -160, canvas.height -150, 70, 60);
  var hacker = new Image();
  hacker.src = 'static/pictures/hacker.jpg';
  context.drawImage(hacker,canvas.width/2 -80, canvas.height -150, 70, 60);
  var scanner = new Image();  // draw scan button
  scanner.src = 'static/pictures/scan.jpg';
  context.drawImage(scanner,canvas.width/2, canvas.height -150, 70, 60);
  var home = new Image();  // draw scan button
  home.src = 'static/pictures/home.jpg';
  context.drawImage(home,canvas.width/2+80, canvas.height -150, 70, 60);


  //hover elements
  if(hover_create_socket){
    context.globalAlpha = 0.7;
    context.fillStyle = 'black';
    context.fillRect(canvas.width/2-150, canvas.height/2-135, 330, 210); 
    context.globalAlpha = 1;
    
    context.fillStyle = '#ffcc33';
    text = 'Make socket connection (varied cost)';
    context.fillText(text,canvas.width/2-140,canvas.height/2-110,290);
    context.fillStyle = '#33ccff';
    text = 'Link your computer with another';
    context.fillText(text,canvas.width/2-140,canvas.height/2-70,290);
    text = 'free computer by using a socket';
    context.fillText(text,canvas.width/2-140,canvas.height/2-50,290);
    text = 'to connect them.';
    context.fillText(text,canvas.width/2-140,canvas.height/2-30,290);
    text = 'Once connected, you can send';
    context.fillText(text,canvas.width/2-140,canvas.height/2,290);
    text = 'messages to the other computers';
    context.fillText(text,canvas.width/2-140,canvas.height/2+20,290);
    text = 'such as ordering them to mine';
    context.fillText(text,canvas.width/2-140,canvas.height/2+40,290);
    text = 'for more coins or scan for clues!';
    context.fillText(text,canvas.width/2-140,canvas.height/2+60,290);
  } else if(hover_mine){
    context.globalAlpha = 0.7;
    context.fillStyle = 'black';
    context.fillRect(canvas.width/2-150, canvas.height/2-65, 330, 140); 
    context.globalAlpha = 1;
    
    context.fillStyle = '#ffcc33';
    text = 'Mine for coins';
    context.fillText(text,canvas.width/2-140,canvas.height/2-40,290);
    context.fillStyle = '#33ccff';
    text = 'Click this button and click on a';
    context.fillText(text,canvas.width/2-140,canvas.height/2,290);
    text = 'computer you are connected with';
    context.fillText(text,canvas.width/2-140,canvas.height/2+20,290);
    text = 'to get a computer to start';
    context.fillText(text,canvas.width/2-140,canvas.height/2+40,290);
    text = 'mining for coins!';
    context.fillText(text,canvas.width/2-140,canvas.height/2+60,290);
  } else if(hover_hack){
    context.globalAlpha = 0.7;
    context.fillStyle = 'black';
    context.fillRect(canvas.width/2-150, canvas.height/2-65, 330, 140); 
    context.globalAlpha = 1;
      
    context.fillStyle = '#ffcc33';
    text = 'Hire a hacker (Cost: 50 coins)';
    context.fillText(text,canvas.width/2-140,canvas.height/2-40,290);
    context.fillStyle = '#33ccff';
    text = 'Click this button and click on a';
    context.fillText(text,canvas.width/2-140,canvas.height/2,290);
    text = 'computer belonging to someone';
    context.fillText(text,canvas.width/2-140,canvas.height/2+20,290);
    text = 'else to hire a hacker to remove';
    context.fillText(text,canvas.width/2-140,canvas.height/2+40,290);
    text = "the computer's connections!";
    context.fillText(text,canvas.width/2-140,canvas.height/2+60,290);
  } else if(hover_mine){
    context.globalAlpha = 0.7;
    context.fillStyle = 'black';
    context.fillRect(canvas.width/2-150, canvas.height/2-65, 330, 140); 
    context.globalAlpha = 1;
      
    context.fillStyle = '#ffcc33';
    text = 'Mine for coins.';
    context.fillText(text,canvas.width/2-140,canvas.height/2-40,290);
    context.fillStyle = '#33ccff';
    text = 'Click this button and click on a';
    context.fillText(text,canvas.width/2-140,canvas.height/2,290);
    text = 'computer you are connected with';
    context.fillText(text,canvas.width/2-140,canvas.height/2+20,290);
    text = 'to get a computer to start';
    context.fillText(text,canvas.width/2-140,canvas.height/2+40,290);
    text = 'mining for coins!';
    context.fillText(text,canvas.width/2-140,canvas.height/2+60,290);
  } else if(hover_scan){
    context.globalAlpha = 0.7;
    context.fillStyle = 'black';
    context.fillRect(canvas.width/2-150, canvas.height/2-65, 330, 140); 
    context.globalAlpha = 1;
      
    context.fillStyle = '#ffcc33';
    text = 'Scan for clues';
    context.fillText(text,canvas.width/2-140,canvas.height/2-40,290);
    context.fillStyle = '#33ccff';
    text = 'Click this button and click on a';
    context.fillText(text,canvas.width/2-140,canvas.height/2,290);
    text = 'computer you are connected';
    context.fillText(text,canvas.width/2-140,canvas.height/2+20,290);
    text = 'with to get it to scan for clues';
    context.fillText(text,canvas.width/2-140,canvas.height/2+40,290);
    text = 'to get the password!';
    context.fillText(text,canvas.width/2-140,canvas.height/2+60,290);
  } else if(hover_home){
    context.globalAlpha = 0.7;
    context.fillStyle = 'black';
    context.fillRect(canvas.width/2-150, canvas.height/2-45, 330, 120); 
    context.globalAlpha = 1;
      
    context.fillStyle = '#ffcc33';
    text = 'Teleport home';
    context.fillText(text,canvas.width/2-140,canvas.height/2-20,290);
    context.fillStyle = '#33ccff';
    text = 'Click this button to teleport'
    context.fillText(text,canvas.width/2-140,canvas.height/2+20,290);
    text = 'to your home computer!';
    context.fillText(text,canvas.width/2-140,canvas.height/2+40,290);
    text = "(it's a little off center but it's fine)";
    context.fillText(text,canvas.width/2-140,canvas.height/2+60,290);
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

  if(one){
    //create interface
    context.globalAlpha = 0.5;
    context.fillStyle = 'black';
    context.fillRect(0, 0,canvas.width, 200); 
    context.globalAlpha = 1;
    text = 'Click on a computer that you own';
    context.fillStyle = 'white';
    context.fillText(text,canvas.width/2-100,100,1000);
  }
  if(second){
    context.globalAlpha = 0.5;
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, 200); 
    context.globalAlpha = 1;
    text = 'Click on a computer that you want to create a socket to connect to'
    context.fillStyle = 'white';
    context.fillText(text,canvas.width/2-200,100,1000);
  }
  if(mine){
    context.globalAlpha = 0.5;
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, 200); 
    context.globalAlpha = 1;
    text = 'Choose a computer to start/stop mining for cryptocurrency'
    context.fillStyle = 'white';
    context.fillText(text,canvas.width/2-200,100,1000);
  }
  if(hack){
    context.globalAlpha = 0.5;
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, 200); 
    context.globalAlpha = 1;
    text = "Choose a computer to hack to disable a player's connection"
    context.fillStyle = 'white';
    context.fillText(text,canvas.width/2-200,100,1000);
  } else if (scan){
        context.globalAlpha = 0.5;
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, 200);
        context.globalAlpha = 1;
        text = "Select a computer to scan for password"
        context.fillStyle = 'white';
        context.fillText(text,canvas.width/2-150,100,1000);
  }
  
  //draw connected lines
  for(var i = 0;i<connected.length;i++){
    //console.log(connected[i]);
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
  context.fillStyle = 'black';
  context.fillText('Password: ',canvas.width/2-200,canvas.height*0.9,1000);
  for(var i = 0;i<password.length;i++){  // display currently scanned letters  
    context.fillText(password[i]+' ',canvas.width/2-100+i*10,canvas.height*0.9,1000);
  }
}
  
function dragMouse(canvas){
    console.log("Hi"); // bruh
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

window.addEventListener('resize', function(e){
  setCanvasDimensions();
  renderBackground(x, y);
});

//hover event
canvas.onmousemove = function(e) {
  var hover_x = e.clientX;
  var hover_y = e.clientY;
  hover_create_socket = false;
  if(canvas.width/2-240 <= hover_x && hover_x <= canvas.width/2-170 && canvas.height-150 <= hover_y && hover_y<=canvas.height -80){
    hover_create_socket = true;
    renderBackground(x,y);
  } else if(canvas.width/2 -160<=hover_x && hover_x<=canvas.width/2 -90 &&  canvas.height -150<=hover_y && hover_y<= canvas.height -80){
    hover_mine = true;
    renderBackground(x,y);
  } else if(canvas.width/2 -80<=hover_x && hover_x<=canvas.width/2 -10 && canvas.height -150<=hover_y && hover_y<= canvas.height -80){
    hover_hack = true;
    renderBackground(x,y);
  } else if(canvas.width/2<=hover_x && hover_x<=canvas.width/2+70 && canvas.height -150<=hover_y && hover_y<= canvas.height -80){
    hover_scan = true;
    renderBackground(x,y);
  } else if(canvas.width/2+80<=hover_x && hover_x<=canvas.width/2+150 && canvas.height -150<=hover_y && hover_y<= canvas.height -80){
    hover_home = true;
    renderBackground(x,y);
  } else{
    if (hover_create_socket){  // don't need to redraw every time mouse move
      hover_create_socket = false;
      renderBackground(x,y);
    } else if (hover_mine){
      hover_mine = false;
      renderBackground(x,y);
    } else if (hover_hack){
      hover_hack = false;
      renderBackground(x,y);
    } else if (hover_scan){
      hover_scan = false;
      renderBackground(x,y);
    } else if (hover_home){
      hover_home = false;
      renderBackground(x,y);
    }
  }

   
}

//click event on computers
canvas.addEventListener('click', function(event) {
  var click_x = event.x;
  var click_y = event.y;
  //console.log(click_x);
  //console.log(click_y);
  // connect option
  if(canvas.width/2 -240<=click_x && click_x<=canvas.width/2 -170 && canvas.height -150<=click_y && click_y<=canvas.height -80){
    console.log('clicked');
    //console.log(coods);
    one = true;
    second = false;
    mine = false;
    hack = false;
    scan = false;
    canvas.addEventListener('click', game_make_socket, false);
    renderBackground(x,y);
  }
  else if(canvas.width/2 -160<=click_x && click_x<=canvas.width/2 -90 &&  canvas.height -150<=click_y && click_y<= canvas.height -80){
    console.log('set/stop server to mining cryptocurrency');
    one = false;
    second = false;
    mine = true;
    hack = false;
    scan = false;
    canvas.addEventListener('click', game_set_mining, false);
    renderBackground(x,y);
  }
  else if(canvas.width/2 -80<=click_x && click_x<=canvas.width/2 -10 && canvas.height -150<=click_y && click_y<= canvas.height -80){
    console.log('hackerman!');
    one = false;
    second = false;
    mine = false;
    hack = true;
    scan = false;
    canvas.addEventListener('click', game_hack_computer, false);
    renderBackground(x,y);
  }
  else if(canvas.width/2<=click_x && click_x<=canvas.width/2+70 && canvas.height -150<=click_y && click_y<= canvas.height -80){
    console.log('zeet zeet scanning');
    one = false;
    second = false;
    mine = false;
    hack = false;
    scan = true;
    canvas.addEventListener('click', game_computer_scan, false);
    renderBackground(x,y);
  }
  else if(canvas.width/2+80<=click_x && click_x<=canvas.width/2+150 && canvas.height -150<=click_y && click_y<= canvas.height -80){
    one = false;
    second = false;
    mine = false;
    hack = false;
    scan = false;
    console.log(coods);
    x = coods[0][0] - 600;
    y = coods[0][1] - 300;
    renderBackground(x,y);
  }


}, false);

function game_set_mining(event){
  var click_x = event.x+x;
  var click_y = event.y+y;
  if(canvas.width/2 -160<=click_x-x && click_x-x<=canvas.width/2 -90 &&  canvas.height -150<=click_y-y && click_y-y<= canvas.height -80){
    mine = false;
    renderBackground(x,y);
  }
  else{
  for(var i = 0;i<coods.length;i++){
    if(coods[i][0]<=click_x && click_x<=coods[i][0]+40 && coods[i][1]<=click_y && click_y<=coods[i][1]+40){
      var stop = false;
      //console.log(mining);
      for(j=0;j<mining.length;j++){
        if(mining[j][0] == coods[i][0] && mining[j][1] == coods[i][1]){
          stop = true;
          mine = false;
          mining.splice(j,1);
          //console.log(mining);
          console.log('stop mining');
          renderBackground(x,y);
        }
      }
      for(j=0;j<computers_scanning.length;j++){
        if(computers_scanning[j][0] == coods[i][0] && computers_scanning[j][1] == coods[i][1]){
          computers_scanning.splice(j,1);
          //console.log(computers_scanning);
          console.log('stop computers_scanning');
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
  if(canvas.width/2 -240<=click_x-x && click_x-x<=canvas.width/2 -170 && canvas.height -150<=click_y-y && click_y-y<=canvas.height -80){
    one = false;
    console.log('quit');
    renderBackground(x,y);
  }
  else{
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
}

function game_make_socket_second(event) {
  var click_x = event.x+x;
  var click_y = event.y+y;
  //console.log(click_x);
  //console.log(click_y);
  if(canvas.width/2 -240<=click_x-x && click_x-x<=canvas.width/2 -170 && canvas.height -150<=click_y-y && click_y-y<=canvas.height -80){
    second = false;
    console.log('quit');
    renderBackground(x,y);
  }
  else{
    for (var i = 0; i<computers.length; i++){
      if(computers[i][0]<=click_x && click_x<=computers[i][0]+30 && computers[i][1]<=click_y && click_y <=computers[i][1]+30){
        console.log('second computer created');
        second = false;
        renderBackground(x,y);
        //caculate cost
        diff_x = first[0] - computers[i][0];
        diff_y = first[1] - computers[i][1];
        distance = (Math.abs(diff_x^2) + Math.abs(diff_y^2))^0.5;
        cost = Math.round(distance * 0.05);
        console.log('cost:');
        console.log(cost.toString());
        context.globalAlpha = 0.5;
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, 200);
        context.globalAlpha = 1;
        text = 'It costs: ' + cost.toString()
        context.fillStyle = 'white';
        context.fillText(text,canvas.width/2-150,100,1000);      
        //alert('It will cost: ' + cost.toString());
        //To be made into socket thingy
        socket.emit('build_socket',(first),([computers[i][0],computers[i][1]]),(username),(cost));
    }
  }
  }
}
socket.on('create_connections', (cd1,cd2,name) => {
  console.log('creating');
  connected.push([cd1,cd2]);
  console.log(connected);
  users[cd2] = name;
  //console.log(users);
});

socket.on('fail_create_connection', message => {
  renderBackground(x,y);
  context.globalAlpha = 0.5;
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, 200);
  context.globalAlpha = 1;
  
  context.fillStyle = 'white';
  context.fillText(message,canvas.width/2-150,100,1000);
  //alert(message);
});


function game_hack_computer(event) {

  console.log('attack first stage!');
  var click_x = event.x+x;
  var click_y = event.y+y;
  //console.log(click_x);
  //console.log(click_y);
  //console.log(coods);
  if(canvas.width/2 -80<=click_x-x && click_x-x<=canvas.width/2 -10 && canvas.height -150<=click_y-y && click_y-y<= canvas.height -80){
    hack = false;
    renderBackground(x,y);
  }
  else{
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


function game_computer_scan(event){
  var click_x = event.x+x;
  var click_y = event.y+y;
  if(canvas.width/2<=click_x-x && click_x-x<=canvas.width/2+70 && canvas.height-150 <= click_y-y && click_y-y <= canvas.height -80){
    renderBackground(x,y);
  } else{
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
          }
        }
        for (var j=0;j<mining.length;j++){
          if(mining[j][0] == coods[i][0] && mining[j][1] == coods[i][1]){
            mining.splice(j,1);
            //console.log(mining);
            console.log('stop mining, scanning now');
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
        }
        renderBackground(x,y);
      }
    }

  }
}

function updateValue(perc) {
  scanning_progress.style.width = perc + '%';
}  


socket.on('scaned_stuff', (scan_progress,scan_coord,scan_password) => {
  updateValue(scan_progress*5);
  password = scan_password;
  renderBackground(x,y);
  //console.log(scan_password);
  for (var i=0;i<computers_scanning.length;i++){
    if (computers_scanning[i][0] == scan_coord[0] && computers_scanning[i][1] == scan_coord[1]){
      socket.emit('create_computers_scanning',(scan_coord));
    }
  }
});


socket.on('game_won', (winning_string) => {
  let url = window.location.href + 'win';
  let form = $('<form action="' + url + '" method="post">' +
    '<input type="text" name="password" value="' + winning_string + '" />' +
    '</form>');
  $('body').append(form);
  form.submit();
});


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
  renderBackground(x,y);
}
