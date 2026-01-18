/******** SAVE / LOAD ********/
let state = JSON.parse(localStorage.getItem("tzTruck")) || {
  money: 30000000,
  fuel: 100,
  engine: false,
  speed: 0,
  gear: 1,
  trailer: false,
  currentRegion: "Dar es Salaam",
  lastPlayed: Date.now(),
  drivers:[{name:"Asha", income:0}],
  messages:[]
};

function save(){
  localStorage.setItem("tzTruck", JSON.stringify(state));
}

/******** OFFLINE DRIVER WORK ********/
(function(){
  let now = Date.now();
  let mins = Math.floor((now - state.lastPlayed)/60000);
  if(mins>0){
    state.drivers.forEach(d=>{
      let earn = mins * 300000;
      d.income += earn;
      state.money += earn;
      state.messages.push(
        `🚚 ${d.name} ameingiza Tsh ${earn.toLocaleString()}`
      );
    });
  }
  state.lastPlayed = now;
  save();
})();

/******** TANZANIA REGIONS ********/
const regionsTZ = [
  "Dar es Salaam","Pwani","Morogoro","Dodoma","Arusha","Manyara",
  "Kilimanjaro","Tanga","Singida","Tabora","Kigoma","Mwanza",
  "Geita","Shinyanga","Simiyu","Mara","Kagera","Mbeya",
  "Songwe","Iringa","Njombe","Ruvuma","Lindi","Mtwara",
  "Katavi","Rukwa"
];

function nextRegion(){
  let i = regionsTZ.indexOf(state.currentRegion);
  if(i < regionsTZ.length-1){
    state.currentRegion = regionsTZ[i+1];
    state.messages.push("📍 Umeingia "+state.currentRegion);
  }
}

/******** THREE.JS ********/
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/400, 0.1, 1000);
camera.position.set(0,6,10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,400);
document.getElementById("game3d").appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff,0.6));
const sun = new THREE.DirectionalLight(0xffffff,1);
sun.position.set(10,20,10);
scene.add(sun);

/******** ROAD ********/
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(20,600),
  new THREE.MeshStandardMaterial({color:0x333333})
);
road.rotation.x = -Math.PI/2;
road.position.z = -300;
scene.add(road);

/******** TRUCK ********/
const truck = new THREE.Mesh(
  new THREE.BoxGeometry(1.5,1,3),
  new THREE.MeshStandardMaterial({color:0xff0000})
);
truck.position.y = 0.5;
scene.add(truck);

/******** TRAILER ********/
let trailerMesh=null;
function buyTrailer(){
  if(state.trailer || state.money<8000000) return;
  state.money -= 8000000;
  state.trailer = true;
  trailerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.5,1,4),
    new THREE.MeshStandardMaterial({color:0x888888})
  );
  trailerMesh.position.z = 3.5;
  truck.add(trailerMesh);
}

/******** CONTROLS ********/
let steer = 0;

document.addEventListener("keydown",e=>{
  if(e.key==="e"||e.key==="E") state.engine=!state.engine;

  if(e.key==="Shift") state.gear=Math.min(12,state.gear+1);
  if(e.key==="Control") state.gear=Math.max(1,state.gear-1);

  if(e.key==="ArrowUp" && state.engine)
    state.speed+=state.gear*0.02;

  if(e.key==="ArrowDown")
    state.speed*=0.7;

  if(e.key==="ArrowLeft") steer=-0.06;
  if(e.key==="ArrowRight") steer=0.06;

  if(e.key==="t"||e.key==="T") buyTrailer();

  if(e.key==="h"||e.key==="H"){
    if(state.money>=2000000){
      state.money-=2000000;
      truck.position.z+=80;
      state.speed=0;
      state.messages.push("🆘 Msaada umefika");
    }
  }
});

document.addEventListener("keyup",()=>{
  steer=0;
});

/******** GAME LOOP ********/
let distance = 0;

function animate(){
  requestAnimationFrame(animate);

  truck.position.z -= state.speed*0.05;
  truck.position.x += steer;
  state.fuel -= state.speed*0.002;
  distance += state.speed;

  if(distance > 200){
    distance = 0;
    nextRegion();
  }

  camera.position.set(truck.position.x,6,truck.position.z+10);
  camera.lookAt(truck.position);

  renderer.render(scene,camera);
  save();
}
animate();

/******** HUD ********/
setInterval(()=>{
  document.getElementById("hud").innerHTML=`
  📍 Mkoa: ${state.currentRegion}<br>
  💰 ${state.money.toLocaleString()} |
  ⚙️ Gear ${state.gear}/12 |
  🚛 Trailer ${state.trailer?"Yes":"No"} |
  ⛽ Fuel ${state.fuel.toFixed(0)}%
  <br>${state.messages.slice(-2).join("<br>")}
  `;
},500);