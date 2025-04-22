import * as THREE from 'three';

export class GameEngine {
  constructor(canvas, onPlayerMove, onPlayerShoot) {
    this.canvas = canvas;
    this.onPlayerMove = onPlayerMove;
    this.onPlayerShoot = onPlayerShoot;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.players = {};
    this.projectiles = [];
    this.controls = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false
    };
    this.mouse = {
      x: 0,
      y: 0
    };
    this.raycaster = new THREE.Raycaster();
    
    this.lastTime = 0;
    this.moveAccumulator = 0;
    
    this.init();
  }
  
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a9d23,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Create player
    this.createPlayer();
    
    // Add some obstacles
    this.createObstacles();
    
    // Set up event listeners
    window.addEventListener('resize', this.handleResize.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('click', this.handleClick.bind(this));
    
    // Lock pointer on canvas click
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });
    
    // Start animation loop
    this.animate(0);
  }
  
  createPlayer() {
    // Create player body
    const bodyGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x7b68ee });
    this.player = new THREE.Object3D();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    this.player.add(body);
    
    // Create weapon
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.25, 0, -0.3);
    this.player.add(weapon);
    
    // Add player to scene
    this.scene.add(this.player);
    
    // Position camera inside player
    this.player.add(this.camera);
    this.camera.position.set(0, 1.6, 0);
  }
  
  createObstacles() {
    // Create some random obstacles
    for (let i = 0; i < 20; i++) {
      const size = Math.random() * 3 + 1;
      const height = Math.random() * 3 + 1;
      
      const geometry = new THREE.BoxGeometry(size, height, size);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff
      });
      
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(
        (Math.random() - 0.5) * 80,
        height / 2,
        (Math.random() - 0.5) * 80
      );
      
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      
      this.scene.add(obstacle);
    }
  }
  
  addOtherPlayer(id, position) {
    if (this.players[id]) return;
    
    const bodyGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const player = new THREE.Object3D();
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    player.add(body);
    
    // Create weapon
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.25, 0, -0.3);
    player.add(weapon);
    
        // Add name tag
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.font = '24px Orbitron';
        context.textAlign = 'center';
        context.fillText(id.substring(0, 8), 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const nameMaterial = new THREE.SpriteMaterial({ map: texture });
        const nameSprite = new THREE.Sprite(nameMaterial);
        nameSprite.position.y = 2;
        nameSprite.scale.set(2, 0.5, 1);
        player.add(nameSprite);
        
        // Position player
        player.position.copy(position);
        
        // Add to scene and players object
        this.scene.add(player);
        this.players[id] = player;
      }
      
      removeOtherPlayer(id) {
        if (this.players[id]) {
          this.scene.remove(this.players[id]);
          delete this.players[id];
        }
      }
      
      updateOtherPlayer(id, position, rotation) {
        if (this.players[id]) {
          this.players[id].position.copy(position);
          this.players[id].rotation.y = rotation.y;
        }
      }
      
      createProjectile(position, direction) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const projectile = new THREE.Mesh(geometry, material);
        
        projectile.position.copy(position);
        projectile.userData.direction = direction;
        projectile.userData.createdAt = Date.now();
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
      }
      
      handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
      
      handleKeyDown(event) {
        switch (event.code) {
          case 'KeyW':
            this.controls.forward = true;
            break;
          case 'KeyS':
            this.controls.backward = true;
            break;
          case 'KeyA':
            this.controls.left = true;
            break;
          case 'KeyD':
            this.controls.right = true;
            break;
          case 'Space':
            this.controls.jump = true;
            break;
          case 'KeyR':
            // Reload weapon
            break;
        }
      }
      
      handleKeyUp(event) {
        switch (event.code) {
          case 'KeyW':
            this.controls.forward = false;
            break;
          case 'KeyS':
            this.controls.backward = false;
            break;
          case 'KeyA':
            this.controls.left = false;
            break;
          case 'KeyD':
            this.controls.right = false;
            break;
          case 'Space':
            this.controls.jump = false;
            break;
        }
      }
      
      handleMouseMove(event) {
        if (document.pointerLockElement === this.canvas) {
          this.player.rotation.y -= event.movementX * 0.002;
          this.camera.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, this.camera.rotation.x - event.movementY * 0.002)
          );
        }
      }
      
      handleClick(event) {
        if (document.pointerLockElement === this.canvas) {
          // Create direction vector from camera
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(this.camera.quaternion);
          
          // Create projectile
          this.createProjectile(this.player.position.clone().add(new THREE.Vector3(0, 1.5, 0)), direction);
          
          // Notify game of shot
          if (this.onPlayerShoot) {
            this.onPlayerShoot(direction);
          }
        }
      }
      
      updatePlayer(deltaTime) {
        // Calculate movement based on controls
        const speed = 5 * deltaTime;
        const direction = new THREE.Vector3();
        
        if (this.controls.forward) {
          direction.z -= 1;
        }
        if (this.controls.backward) {
          direction.z += 1;
        }
        if (this.controls.left) {
          direction.x -= 1;
        }
        if (this.controls.right) {
          direction.x += 1;
        }
        
        // Normalize direction vector
        if (direction.length() > 0) {
          direction.normalize();
        }
        
        // Apply player rotation to movement direction
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
        
        // Move player
        this.player.position.x += direction.x * speed;
        this.player.position.z += direction.z * speed;
        
        // Simple collision detection with ground
        this.player.position.y = 0;
        
        // Notify game of movement
        this.moveAccumulator += deltaTime;
        if (this.moveAccumulator > 0.1) { // Send updates 10 times per second
          this.moveAccumulator = 0;
          if (this.onPlayerMove) {
            this.onPlayerMove(
              this.player.position.clone(),
              new THREE.Vector3(0, this.player.rotation.y, 0)
            );
          }
        }
      }
      
      updateProjectiles(deltaTime) {
        const speed = 20 * deltaTime;
        const now = Date.now();
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
          const projectile = this.projectiles[i];
          
          // Move projectile
          projectile.position.add(
            projectile.userData.direction.clone().multiplyScalar(speed)
          );
          
          // Remove projectile after 2 seconds
          if (now - projectile.userData.createdAt > 2000) {
            this.scene.remove(projectile);
            this.projectiles.splice(i, 1);
          }
        }
      }
      
      animate(time) {
        requestAnimationFrame(this.animate.bind(this));
        
        // Calculate delta time
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
      }
      
      cleanup() {
        window.removeEventListener('resize', this.handleResize.bind(this));
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('click', this.handleClick.bind(this));
      }
    }