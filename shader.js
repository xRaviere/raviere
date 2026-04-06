export function initShader(canvas) {
  const gl = canvas.getContext('webgl');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  const vsrc = `
attribute vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

  const fsrc = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform float time;
uniform vec2 resolution;

float what(vec2 position) {
  float real_time = time / 100.0;
  float dist  = distance(position, vec2(0.5-(sin(real_time)/100.0)+tan(2.0*position.y),0.5-(cos(real_time)/135.0)));
  float dist2 = distance(position, vec2(0.0+(sin(real_time)/100.0),1.0+(cos(real_time)/135.0))-tan(2.0*1.0-position.y));
  float dist3 = distance(position, vec2(1.0-(sin(real_time)/100.0)+tan(2.0*(1.0-position.y)),0.0+(cos(real_time)/135.0)));
  float wtf = (sin(3.14159*(dist+real_time/50.0)*10.0)+cos(3.14159*(dist2+real_time/50.0)*10.0)+sin(3.14159*(dist3+real_time/50.0)*10.0))/3.0;
  wtf = 1.0-abs(wtf);
  wtf = pow(wtf, 500.0);
  return wtf;
}

void main() {
  vec2 position = (gl_FragCoord.xy / resolution.xy);
  position.y *= 0.5;
  position.y += 0.25;

  vec2 pos2 = position; pos2.x += 0.001; pos2.y += 0.001;
  vec2 pos3 = position; pos3.x -= 0.001; pos3.y += 0.001;
  vec2 pos4 = position; pos4.x -= 0.001; pos4.y -= 0.001;

  float wtf  = what(position);
  float wtf2 = what(pos2);
  float wtf3 = what(pos3);
  float wtf4 = what(pos4);

  vec3 col = vec3(wtf - wtf4*wtf, wtf - wtf2*wtf, wtf - wtf3*wtf);
  gl_FragColor = vec4(col, 1.0);
}
`;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(vsrc, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(fsrc, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'time');
  const uRes  = gl.getUniformLocation(prog, 'resolution');

  const start = Date.now();
  function draw() {
    gl.uniform1f(uTime, (Date.now() - start) / 1000.0);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }
  draw();
}
