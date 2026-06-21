// GOXBLUE ENGINE - Pseudo-3D Advanced Vanilla
const GoxblueModes = { ORTHO:'ortho', ISOMETRIC:'isometric', OBLIQUE:'oblique', ONE_POINT:'onepoint', TWO_POINT:'twopoint', THREE_POINT:'threepoint', CAMERA:'camera' };

class Vector3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} clone(){return new Vector3(this.x,this.y,this.z);} add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;} }

class PerspectiveCamera {
  constructor(){
    this.position = new Vector3(0, 12, 35);
    this.rotation = new Vector3(-0.4, 0.2, 0);
    this.zoom = 1;
  }
  project(point){
    let x = point.x - this.position.x, y = point.y - this.position.y, z = point.z - this.position.z;
    const cy = Math.cos(this.rotation.y), sy = Math.sin(this.rotation.y);
    const tx = x*cy - z*sy, tz = x*sy + z*cy; x = tx; z = tz;
    const cx = Math.cos(this.rotation.x), sx = Math.sin(this.rotation.x);
    const ty = y*cx - z*sx, tz2 = y*sx + z*cx; y = ty; z = tz2;
    if(z < 1) z = 1;
    const f = 800 / (z + 300) * this.zoom;
    return { x: x*f + window.innerWidth/2, y: y*f + window.innerHeight/2 - 120, scale: f*0.8, depth: z };
  }
}

class Entity {
  constructor(x=0,y=8,z=0,color='#0ff',size=25){
    this.position = new Vector3(x,y,z); this.velocity = new Vector3(); this.color=color; this.size=size; this.rotation=0;
  }
  update(delta){ this.position.add(this.velocity.multiplyScalar(delta*50)); this.rotation += delta*1.8; }
}

class Particle { /* همان قبلی */ constructor(x,y,z,color){this.position=new Vector3(x,y,z);this.velocity=new Vector3(Math.random()*12-6,Math.random()*10-2,Math.random()*12-6);this.life=2;this.color=color;this.size=Math.random()*14+8;} update(delta){this.position.add(this.velocity.multiplyScalar(delta*60));this.velocity.y-=18*delta;this.life-=delta;this.size*=0.97;} }

class GoxblueEngine {
  constructor(){
    this.canvas = document.getElementById('game')||this.createCanvas(); this.ctx=this.canvas.getContext('2d');
    this.camera=new PerspectiveCamera(); this.entities=[]; this.particles=[]; this.mode=GoxblueModes.CAMERA;
    this.keys={}; this.mouse={down:false}; this.lastTime=performance.now(); this.fps=60;
    this.setupInput(); this.resize(); this.createDemoScene(); this.loop();
  }
  createCanvas(){const c=document.createElement('canvas');c.id='game';document.body.appendChild(c);return c;}
  resize(){this.canvas.width=window.innerWidth;this.canvas.height=window.innerHeight;}
  setupInput(){
    window.addEventListener('keydown',e=>this.keys[e.key.toLowerCase()]=true);
    window.addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
    this.canvas.addEventListener('mousemove',e=>{if(this.mouse.down){this.camera.rotation.y+=e.movementX*0.004;this.camera.rotation.x=Math.max(-1.4,Math.min(1.4,this.camera.rotation.x+e.movementY*0.004));}});
    this.canvas.addEventListener('mousedown',()=>{this.mouse.down=true;});
    this.canvas.addEventListener('mouseup',()=>{this.mouse.down=false;});
    window.addEventListener('keypress',e=>{
      if(e.key>='1'&&e.key<='7') this.mode=Object.values(GoxblueModes)[parseInt(e.key)-1];
      if(e.key==='f') this.canvas.requestFullscreen();
      if(e.key===' ') this.addParticleBurst(0,15,0,80,'#ff0');
    });
  }
  createDemoScene(){
    // Floor grid
    for(let x=-30;x<=30;x+=5)for(let z=-30;z<=30;z+=5){
      const g=new Entity(x,0,z,'#1a1a2e',18); this.entities.push(g);
    }
    const colors=['#f00','#0f0','#00f','#ff0','#f0f','#0ff'];
    for(let i=0;i<25;i++){
      const e=new Entity(Math.random()*120-60,10+Math.random()*25,Math.random()*120-60,colors[i%colors.length],32);
      e.velocity.x=(Math.random()-0.5)*2; e.velocity.z=(Math.random()-0.5)*2;
      this.entities.push(e);
    }
    console.log('%cGOXBLUE Pseudo-3D v0.3 — خیلی 3Dتر شد! 🚀', 'color:#0ff;font-size:18px');
  }
  addParticleBurst(x,y,z,count=50,color){ for(let i=0;i<count;i++) this.particles.push(new Particle(x,y,z,color)); }
  projectPoint(p,mode){ return mode===GoxblueModes.CAMERA ? this.camera.project(p) : {x:p.x*0.7+p.z*0.4+this.canvas.width/2, y:p.y*0.6-p.z*0.3+this.canvas.height/2-150, scale:1, depth:50}; }
  drawCube(proj, entity){
    const s = entity.size * (proj.scale||1) * 0.9;
    const ctx = this.ctx; ctx.save(); ctx.translate(proj.x, proj.y);
    ctx.rotate(entity.rotation * 0.015);
    const shade = Math.max(0.3, 1 - proj.depth/200);
    // Main face
    ctx.fillStyle = entity.color; ctx.fillRect(-s/2, -s/2, s, s);
    // Top face (perspective)
    ctx.fillStyle = '#ffffff22'; ctx.beginPath(); ctx.moveTo(-s/2,-s/2); ctx.lineTo(-s/2+ s*0.3, -s/2 - s*0.35); ctx.lineTo(s/2 + s*0.3, -s/2 - s*0.35); ctx.lineTo(s/2,-s/2); ctx.fill();
    // Side face
    ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.moveTo(s/2,-s/2); ctx.lineTo(s/2 + s*0.3, -s/2 - s*0.35); ctx.lineTo(s/2 + s*0.3, s/2 - s*0.35); ctx.lineTo(s/2,s/2); ctx.fill();
    ctx.restore();
  }
  render(){
    this.ctx.fillStyle='#0a0a1f'; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    // Sky
    const g=this.ctx.createLinearGradient(0,0,0,this.canvas.height*0.5); g.addColorStop(0,'#112244'); g.addColorStop(1,'#0a0a1f'); this.ctx.fillStyle=g; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    const sorted = [...this.entities,...this.particles].sort((a,b)=>(b.position?.z||0)-(a.position?.z||0));
    sorted.forEach(obj=>{
      const proj = this.projectPoint(obj.position||obj, this.mode);
      if(obj instanceof Particle){
        this.ctx.fillStyle=obj.color; this.ctx.globalAlpha=obj.life; this.ctx.fillRect(proj.x- obj.size/2, proj.y- obj.size/2, obj.size, obj.size);
      } else {
        this.drawCube(proj, obj);
      }
    });
    this.ctx.globalAlpha=1;
    this.ctx.fillStyle='#0f0'; this.ctx.font='bold 16px monospace';
    this.ctx.fillText(`GOXBLUE Pseudo-3D | Mode:\( {this.mode.toUpperCase()} | FPS: \){this.fps}`,20,35);
  }
  update(delta){
    const speed=55*delta;
    if(this.keys['w']) this.camera.position.z -= speed;
    if(this.keys['s']) this.camera.position.z += speed;
    if(this.keys['a']) this.camera.position.x -= speed;
    if(this.keys['d']) this.camera.position.x += speed;
    if(this.keys[' ']) this.camera.position.y += speed*0.6;
    if(this.keys['shift']) this.camera.position.y -= speed*0.6;
    this.entities.forEach(e=>e.update(delta));
    this.particles=this.particles.filter(p=>{p.update(delta);return p.life>0;});
  }
  loop(){
    requestAnimationFrame(()=>this.loop());
    const now=performance.now(), delta=(now-this.lastTime)/1000; this.lastTime=now;
    this.update(delta); this.render(); this.fps=Math.round(1/delta);
  }
}

// Auto start
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>new GoxblueEngine());
else new GoxblueEngine();
