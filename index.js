const express= require('express');
const app = express();

const path = require('path');
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const PORT = process.env.PORT || 3000;


const directpath = path.join(__dirname,'public');

app.use(express.static(directpath));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.set('view engine', 'ejs');




app.get('/',(req, res)=>{ 
   
   
   res.render('index');
});


var username

app.post('/',(req,res)=>{
      

    var room = req.body.uroom;
      username= req.body.uname;

   
    
    res.redirect(`/room?username=${username} & room = ${room}`);


});

io.on('connection', (socket) => {

    console.log("user connected");

   socket.on('send name', (username1) => {
      io.emit('send name', username1);

  });


   // to all and sender through server
   socket.on('chat message',(msg)=>{
      io.emit('chat message', msg);
       
        
   });


   socket.on('disconnect', () => {
     console.log('user disconnected');
   });
 });
 


app.get('/room', (req, res)=>{
   
   
  var username = req.query.username
  var room = req.query.room

   
   res.render('room',{username});

})


app.get('/logout',(req,res)=>{


   res.redirect('/');
})



server.listen(PORT, function(){
   console.log('listening on 3000');
});