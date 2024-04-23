import './style.css'//This line imports a CSS file for styling.
import * as THREE from 'three';//This imports the entire 'three' module under the name THREE
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';//OrbitControls allows for easy navigation of a 3D scene by controlling the camera's position and orientation.
import * as CANNON from 'cannon-es'//Cannon is a physics engine library that allows for realistic physics simulation in a 3D environment.
import CannonDebugger from 'cannon-es-debugger';//CannonDebugger is used for visualizing physics bodies and debugging physics simulations created with Cannon.


const pointsUI = document.querySelector("#pointsUI");
let points = 0;
let gameOver = false
let highscore = Number(document.cookie.substring(10))
pointsUI.textContent="00" + "    Highscore:" + highscore

//These lines define variables for keeping track of points in the game and whether the game is over. pointsUI is a reference to an HTML element with the ID "pointsUI".
const randomRangeNum = (max, min) =>{
	return Math.floor(Math.random() * (max - min + 1) + min)
} ;
//This defines a function randomRangeNum that generates a random integer between min and max (inclusive).
const moveObstacle = (arr, speed, maxX, minX, maxZ, minZ) => {
	arr.forEach(el => {
		el.body.position.z += speed;
		if (el.body.position.z > camera.position.z){
			el.body.position.x = randomRangeNum(maxX, minX);
			el.body.position.z = randomRangeNum(maxZ, minZ);
		}
		el.mesh.position.copy(el.body.position);
		el.mesh.quaternion.copy(el.body.quaternion);
		
	});
}

const scene = new THREE.Scene();
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -9.82, 0)
});
const cannonDebugger = new CannonDebugger(scene, world, {
	color: "#AEE2FF",
	scale: 1
});
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
camera.position.z = 17.5;
camera.position.y = 1.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


const groundBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(60, 1, 30)), // Adjusted ground size
});
groundBody.position.y = -1;
world.addBody(groundBody);

const ground = new THREE.Mesh(
    new THREE.BoxGeometry( 60, 1, 30 ), // Adjusted ground size
    new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
);
ground.position.y = -1;
scene.add( ground );

const playerBody = new CANNON.Body({
	mass: 1,
	shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)),
	fixedRotation: true,
	position: new CANNON.Vec3(0, 0,15)
})

world.addBody(playerBody);


// controls
const controls = new OrbitControls(camera, renderer.domElement);

const powerups = [];
for (let i=0; i<10; i++){
	const posX = randomRangeNum(5, -5);
	const posZ = randomRangeNum(5, -5)
	const powerup = new THREE.Mesh(
		new THREE.TorusGeometry(1, 0.4, 16, 50),
		new THREE.MeshBasicMaterial({color: 0xffff00})
	);
	powerup.scale.set(0.1, 0.1, 0.1);
	powerup.position.x = posX
	powerup.position.z = posZ
	powerup.name = "powerup" + [i + 1];
	scene.add(powerup);

	const powerupBody = new CANNON.Body({
		shape: new CANNON.Sphere(0.2),
	});
	powerupBody.position.set(posX, 0 , posZ);
	world.addBody(powerupBody);
	const powerupObject = {
		mesh: powerup,
		body: powerupBody,
	}
	powerups.push(powerupObject);
}

const enemies = [];
for (let i=0; i<5; i++){
    const posX = randomRangeNum(12, -12); // Adjusted spawn range
    const posZ = randomRangeNum(-30, -40); // Adjusted spawn range
    const enemy = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({color: 0x0000ff})
    );
    enemy.position.x = posX;
    enemy.position.z = posZ;
    enemy.position.y = 0.5; // Ensure enemies are placed on the ground
    enemy.name = "enemy" + [i + 1];
    scene.add(enemy);

    const enemyBody = new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    });
    enemyBody.position.set(posX, 0.0, posZ); // Ensure enemy is positioned on the ground
    world.addBody(enemyBody);
    const enemyObject = {
        mesh: enemy,
        body: enemyBody,
    };
    enemies.push(enemyObject);
}



const player = new THREE.Mesh(
	new THREE.BoxGeometry( 0.5, 0.5, 0.5 ),
	new THREE.MeshBasicMaterial( { color: 0xfff0000 } )
 );
scene.add( player ); 
playerBody.addEventListener("collide", (e)=>{
	powerups.forEach((el) =>{
		if(e.body === el.body){
			el.body.position.x = randomRangeNum(8, -8);
			el.body.position.z = randomRangeNum(-5, -10);
			el.mesh.quaternion.copy(el.body.quaternion);
			points += 1;
			pointsUI.textContent = points.toString() + "    Highscore:" + highscore;
		}
	});
	enemies.forEach((el) =>{
		if(e.body === el.body){
			gameOver = true
			
		}
	});
})

// Grid Helper
// const gridhelper = new THREE.GridHelper(30, 30);
// scene.add(gridhelper)
scene.fog = new THREE.FogExp2(0x0047ab, 0.09, 50);
const geometry = new THREE.BufferGeometry();
const vertices = [];
const size = 2000;
for (let i = 0; i < 5000; i++) {
	const x = (Math.random() * size + Math.random() * size) / 2 - size / 2;
	const y = (Math.random() * size + Math.random() * size) / 2 - size / 2;
	const z = (Math.random() * size + Math.random() * size) / 2 - size / 2;
	vertices.push(x, y, z);
}
geometry.setAttribute(
	"position",
	new THREE.Float32BufferAttribute(vertices, 3)
);
const material = new THREE.PointsMaterial({
size: 2,
color: 0xffffff,
});
const particles = new THREE.Points (geometry, material);
scene.add(particles);

function animate() {
    requestAnimationFrame( animate );
    
    if (!gameOver){
        moveObstacle(powerups, 0.1, 8, -8, -1, -10)
        moveObstacle(enemies, 0.1, 8, -8, -1, -10)
    } else {
        pointsUI.textContent = "GAME OVER";
        if(points > highscore) document.cookie="highscore="+points+";expires=Thur, 18 Dec 2024 12:00:00 UTC; path=/"
        
        // Remove enemies and their physics bodies
        enemies.forEach((el) => {
            scene.remove(el.mesh);
            world.removeBody(el.body);
        });

        // Remove powerups and their physics bodies
        powerups.forEach((el) => {
            scene.remove(el.mesh);
            world.removeBody(el.body)
        });

        if (playerBody.position.z > camera.position.z){
            scene.remove(player);
            world.removeBody(playerBody);
        }
    }

    controls.update();
    world.fixedStep();
    player.position.copy(playerBody.position)
    player.quaternion.copy(player.quaternion)
    cannonDebugger.update()
    renderer.render( scene, camera );
}
animate();

window.addEventListener("resize", ()=>{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
})

window.addEventListener("keydown", (e) => {
	if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
		playerBody.position.x += 0.09
	}
	if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
		playerBody.position.x -= 0.09
	}
	if (e.key === "r" || e.key === "R") {
		playerBody.position.x = 0;
		playerBody.position.y = 0;
		playerBody.position.z = 18;
	}
	if (e.key === " ") {
		player.position.y = 2;
	}
  if (e.key === "p" || e.key === "P"){
    window.location.reload();
}});
