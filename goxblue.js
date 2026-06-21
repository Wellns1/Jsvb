// ================================================
// GOXBLUE ENGINE - Advanced Vanilla JS Game Engine
// One File | Canvas 2D + Fake 3D + CSS3D Hybrid
// ================================================

const GoxblueModes = {
  ORTHO: 'ortho', ISOMETRIC: 'isometric', OBLIQUE: 'oblique',
  ONE_POINT: 'onepoint', TWO_POINT: 'twopoint', THREE_POINT: 'threepoint',
  CAMERA: 'camera'
};

class Vector3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  clone(){return new Vector3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  subtract(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  normalize(){const len=Math.hypot(this.x,this.y,this.z);if(len>0)this.multiplyScalar(1/len);return this;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
}

class PerspectiveCamera {
  constructor(){
    this.position = new Vector3(0, 8, 25);
    this.rotation = new Vector3(-0.3, 0, 0);
    this.target = new Vector3(0,0,0);
    this.fov = 60; this.zoom = 1;
  }
  project(point){
    let x = point.x - this.position.x;
    let y = point.y - this.position.y;
    let z = point.z - this.position.z;

    // Yaw (Y)
    const cy = Math.cos(this.rotation.y), sy = Math.sin(this.rotation.y);
    const tx = x*cy - z*sy, tz = x*sy + z*cy; x=tx; z=tz;
    // Pitch (X)
    const cx = Math.cos(this.rotation.x), sx = Math.sin(this.rotation.x);
    const ty = y*cx - z*sx, tz2 = y*sx + z*cx; y=ty; z=tz2;

    if(z < 0.1) z = 0.1;
    const scale = (600 / (z + 400)) * this.zoom;
    return {
      x: x * scale + window.innerWidth / 2,
      y: y * scale + window.innerHeight / 2 - 80,
      scale: scale * 0.9,
      depth: z
    };
  }
}

class Entity {
  constructor(x=0,y=5,z=0,color='#0ff',size=25){
    this.position = new Vector3(x,y,z);
    this.velocity = new Vector3();
    this.color = color; this.size = size;
    this.rotation = 0; this.type = 'box';
  }
  update(delta){ 
    this.position.add(this.velocity.multiplyScalar(delta*60));
    this.rotation += delta * 1.5;
  }
}

class Particle {
  constructor(x,y,z,color){
    this.position = new Vector3(x,y,z);
    this.velocity = new Vector3(Math.random()*8-4, Math.random()*8-2, Math.random()*8-4);
    this.life = 1.5; this.color = color; this.size = Math.random()*12+6;
  }
  update(delta){ 
    this.position.add(this.velocity.multiplyScalar(delta*60));
    this.velocity.y -= 12*delta;
    this.life -= delta; this.size *= 0.98;
  }
}

class GoxblueEngine {
  constructor(){
    this.canvas = document.getElementById('game') || this.createCanvas();
    this.ctx = this.canvas.getContext('2d',{alpha:true});
    this.camera = new PerspectiveCamera();
    this.entities = []; this.particles = [];
    this.mode = GoxblueModes.CAMERA;
    this.keys = {}; this.mouse = {x:0,y:0,down:false};
    this.lastTime = performance.now(); this.fps = 0; this.frameCount=0; this.fpsTime=0;
    this.audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    this.setupInput(); this.resize(); this.createDemoScene();
    this.loop();
  }

  createCanvas(){ 
    const c = document.createElement('canvas'); c.id='game'; 
    document.body.appendChild(c); return c;
  }

  resize(){ 
    this.canvas.width = window.innerWidth; 
    this.canvas.height = window.innerHeight;
  }

  setupInput(){
    window.addEventListener('keydown', e => {this.keys[e.key.toLowerCase()]=true;});
    window.addEventListener('keyup', e => {this.keys[e.key.toLowerCase()]=false;});
    this.canvas.addEventListener('mousemove', e => {
      if(this.mouse.down){
        this.camera.rotation.y += e.movementX * 0.003;
        this.camera.rotation.x = Math.max(-1.2, Math.min(1.2, this.camera.rotation.x + e.movementY * 0.003));
      }
    });
    this.canvas.addEventListener('mousedown', ()=>{this.mouse.down=true;});
    this.canvas.addEventListener('mouseup', ()=>{this.mouse.down=false;});
    window.addEventListener('keypress', e=>{
      if(e.key>='1' && e.key<='7'){
        this.mode = Object.values(GoxblueModes)[parseInt(e.key)-1];
      }
      if(e.key==='f') this.toggleFullscreen();
    });
  }

  toggleFullscreen(){
    if(!document.fullscreenElement) this.canvas.requestFullscreen();
    else document.exitFullscreen();
  }

  playSound(freq=440,duration=0.1,type='sine'){
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type=type; osc.frequency.value=freq;
    gain.gain.value=0.2; gain.gain.linearRampToValueAtTime(0,this.audioCtx.currentTime+duration);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(); osc.stop(this.audioCtx.currentTime+duration);
  }

  createDemoScene(){
    // Ground
    for(let x=-20;x<=20;x+=4)for(let z=-20;z<=20;z+=4){
      const g = new Entity(x,0,z,'#222',22); this.entities.push(g);
    }
    // Cubes
    const colors = ['#f00','#0f0','#00f','#ff0','#f0f','#0ff'];
    for(let i=0;i<18;i++){
      const e = new Entity(Math.random()*80-40, 8+Math.random()*15, Math.random()*80-40, colors[i%colors.length], 28);
      e.velocity.x = (Math.random()-0.5)*1.2;
      e.velocity.z = (Math.random()-0.5)*1.2;
      this.entities.push(e);
    }
    console.log('%cGOXBLUE ENGINE v0.2 آماده است! 🚀\n1-7: تغییر حالت | F: Fullscreen | Mouse Drag: دوربین', 'color:#0ff;font-size:18px');
  }

  addParticleBurst(x,y,z,count=30,color='#ff0'){
    for(let i=0;i<count;i++) this.particles.push(new Particle(x,y,z,color));
  }

  projectPoint(point,mode){
    if(mode===GoxblueModes.CAMERA) return this.camera.project(point);
    // Other fake modes...
    let {x,y,z} = point;
    switch(mode){
      case GoxblueModes.ISOMETRIC: return {x:x*0.866 + z*0.5 + this.canvas.width/2, y:y*0.5 - z*0.433 + this.canvas.height/2 -100, scale:1, depth:10};
      default: return {x:x+this.canvas.width/2, y:y+this.canvas.height/2 -100, scale:1, depth:10};
    }
  }

  update(delta){
    // Camera movement
    const speed = 45 * delta;
    if(this.keys['w']) this.camera.position.z -= speed;
    if(this.keys['s']) this.camera.position.z += speed;
    if(this.keys['a']) this.camera.position.x -= speed;
    if(this.keys['d']) this.camera.position.x += speed;
    if(this.keys[' ']) this.camera.position.y += speed;
    if(this.keys['shift']) this.camera.position.y -= speed;

    this.entities.forEach(e=>e.update(delta));
    this.particles = this.particles.filter(p=>{p.update(delta); return p.life>0;});

    // Random collision sound
    if(Math.random()<0.02) this.playSound(180+Math.random()*300,0.08,'square');
  }

  render(){
    this.ctx.fillStyle = '#0a0a1f'; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    
    // Sky gradient
    const grad = this.ctx.createLinearGradient(0,0,0,this.canvas.height*0.6);
    grad.addColorStop(0,'#112244'); grad.addColorStop(1,'#0a0a1f');
    this.ctx.fillStyle = grad; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    const sorted = [...this.entities, ...this.particles].sort((a,b) => (b.position?.z||0) - (a.position?.z||0));

    sorted.forEach(obj => {
      const proj = this.projectPoint(obj.position || obj, this.mode);
      const s = (obj.size || obj.size || 20) * (proj.scale || 1);
      this.ctx.save();
      this.ctx.translate(proj.x, proj.y);
      this.ctx.rotate((obj.rotation||0) * 0.02);

      this.ctx.shadowBlur = 20; this.ctx.shadowColor = obj.color || '#0ff';
      this.ctx.fillStyle = obj.color || '#0ff';
      this.ctx.fillRect(-s/2, -s/2, s, s);

      // Highlight
      this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this.ctx.fillRect(-s/2, -s/2, s*0.6, s*0.3);
      this.ctx.restore();
    });

    // FPS
    this.frameCount++;
    if(Date.now()-this.fpsTime>1000){ this.fps=this.frameCount; this.frameCount=0; this.fpsTime=Date.now(); }
    this.ctx.fillStyle='#0f0'; this.ctx.font='bold 16px monospace';
    this.ctx.fillText(`GOXBLUE | Mode:\( {this.mode.toUpperCase()} | FPS: \){this.fps} | Entities:${this.entities.length}`, 20, 35);
  }

  loop(){
    requestAnimationFrame(()=>this.loop());
    const now = performance.now();
    const delta = (now - this.lastTime)/1000;
    this.lastTime = now;
    this.update(delta);
    this.render();
  }
}

// Auto init
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>new GoxblueEngine());
else new GoxblueEngine();

export {GoxblueEngine};
