const scenes = [...document.querySelectorAll('.scene')];
const progressTrack = document.querySelector('#progressTrack');
const sceneLabel = document.querySelector('#sceneLabel');
const scrubber = document.querySelector('#scrubber');
const playButton = document.querySelector('#playButton');
const viewport = document.querySelector('#viewport');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = 0;
let playing = true;
let timer;
let timeline = [];

const sceneTimeline = [
  { duration: 2800, camera: 'camera-push', soundCue: 'keyboard', beats: [[180, 'intro-command'], [650, 'intro-lockup']] },
  { duration: 3000, camera: 'camera-stat', soundCue: 'counter', beats: [[180, 'counter'], [1450, 'hours'], [2150, 'punchline']] },
  { duration: 3800, camera: 'camera-repo', soundCue: 'repo-found', beats: [[180, 'repo-tree'], [900, 'repo-found'], [2250, 'repo-wrong'], [3000, 'repo-stack'], [3400, 'one-file']] },
  { duration: 3800, camera: 'camera-context', soundCue: 'cluster-switch', beats: [[200, 'cluster-switch'], [1500, 'account-switch'], [2700, 'wait'], [3150, 'which-cluster']] },
  { duration: 4000, camera: 'camera-log', soundCue: 'error', beats: [[180, 'build-progress'], [1700, 'build-failed'], [2200, 'log-scroll'], [3200, 'where']] },
  { duration: 2600, camera: 'camera-chaos', soundCue: 'glitch', beats: [[100, 'tab-explosion'], [1650, 'tabs-collapse']] },
  { duration: 3600, camera: 'camera-pivot', soundCue: 'pivot', beats: [[500, 'pivot'], [1600, 'pivot-detail'], [2600, 'pivot-question']] },
  { duration: 3200, camera: 'camera-cli', soundCue: 'cli-reveal', beats: [[250, 'cli-cursor'], [800, 'cli-command'], [1700, 'cli-expand'], [2400, 'cli-tag']] },
  { duration: 4800, camera: 'camera-flow', soundCue: 'sources-connect', beats: [[300, 'sources-connect'], [3300, 'correlation']] },
  { duration: 4100, camera: 'camera-result', soundCue: 'correlation', beats: [[400, 'result-build'], [950, 'result-deploy'], [1500, 'result-cluster'], [2050, 'result-pod'], [2800, 'result-cause'], [3500, 'result-tag']] },
  { duration: 3800, camera: 'camera-collapse', soundCue: 'whoosh', beats: [[200, 'workflow-windows'], [1400, 'context-collapse'], [2200, 'less-lines']] },
  { duration: 5000, camera: 'camera-reveal', soundCue: 'final-reveal', beats: [[400, 'final-command'], [1650, 'final-aptia'], [2150, 'final-investigate'], [3100, 'final-subtitle'], [3750, 'final-reveal']] },
];

const beat = (name) => document.dispatchEvent(new CustomEvent('aptia:beat', { detail: { name, scene: current } }));
const onSceneEnter = (config) => document.dispatchEvent(new CustomEvent('aptia:scene-enter', { detail: config }));
const onSceneBeat = (name) => document.dispatchEvent(new CustomEvent('aptia:scene-beat', { detail: { name, scene: current } }));
const onSceneTransition = (from, to) => document.dispatchEvent(new CustomEvent('aptia:scene-transition', { detail: { from, to } }));
const onReveal = () => document.dispatchEvent(new CustomEvent('aptia:reveal'));
const select = (selector) => scenes[current].querySelector(selector);

function makeTimeline(index) {
  timeline.forEach(clearTimeout);
  timeline = [];
  const config = sceneTimeline[index];
  if (!config || reducedMotion) return;
  config.beats.forEach(([delay, name]) => timeline.push(setTimeout(() => onBeat(name), delay)));
}

function onBeat(name) {
  beat(name);
  onSceneBeat(name);
  if (name === 'final-reveal') onReveal();
  const scene = scenes[current];
  scene.dataset.beat = name;
  scene.classList.add(`beat-${name}`);
  if (name === 'counter') animateCounter();
  if (name === 'sources-connect') animateSources();
  if (name === 'correlation') animateCorrelation();
  if (name === 'cluster-switch') animateContexts();
  if (name === 'build-progress') animateBuild();
  if (name === 'tab-explosion') createTabs();
  if (name === 'tabs-collapse') scene.querySelector('.tab-explosion')?.classList.add('is-collapsing');
}

function render(index) {
  scenes.forEach((scene, sceneIndex) => {
    scene.classList.toggle('is-active', sceneIndex === index);
    scene.classList.remove('is-exiting', 'is-entering');
    if (sceneIndex === index) scene.classList.add('is-entering');
  });
  [...progressTrack.children].forEach((bar, barIndex) => bar.classList.toggle('active', barIndex <= index));
  sceneLabel.textContent = `${String(index + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`;
  scrubber.value = index;
  viewport.dataset.camera = sceneTimeline[index]?.camera || '';
  onSceneEnter(sceneTimeline[index]);
  makeTimeline(index);
}

function goTo(index) {
  const from = current;
  const to = (index + scenes.length) % scenes.length;
  scenes[current]?.classList.add('is-exiting');
  onSceneTransition(from, to);
  current = to;
  render(current);
  restartTimer();
}

function animateCounter() {
  const counter = select('.counter');
  if (!counter) return;
  const values = [0, 1247, 8934, 27491, 61203, 87901, 102312.3, 102981, 102312.3];
  const duration = reducedMotion ? 0 : 1550;
  const started = performance.now();
  function tick(now) {
    const progress = duration ? Math.min((now - started) / duration, 1) : 1;
    const eased = 1 - Math.pow(1 - progress, 3);
    const position = eased * (values.length - 1);
    const index = Math.min(Math.floor(position), values.length - 2);
    const local = position - index;
    const value = values[index] + (values[index + 1] - values[index]) * local;
    counter.textContent = value.toLocaleString('en-US', { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: 1 });
    if (progress < 1 && scenes[current].classList.contains('is-active')) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateContexts() {
  [...document.querySelectorAll('.scene-context .contexts span')].forEach((item, index) => {
    item.style.setProperty('--switch-delay', `${index * 110}ms`);
    item.classList.toggle('is-selected', index % 2 === 0);
  });
}

function animateBuild() {
  const bar = select('.build-bar');
  if (bar) bar.style.setProperty('--build-duration', reducedMotion ? '0ms' : '1700ms');
  const percent = select('.build-percent');
  if (!percent) return;
  const values = [12, 31, 67, 94, 98];
  let index = 0;
  const step = () => {
    percent.textContent = `${values[index]}%`;
    index += 1;
    if (index < values.length && scenes[current].classList.contains('is-active')) setTimeout(step, 330);
  };
  step();
}

function createTabs() {
  const scene = scenes[current];
  if (scene.querySelector('.tab-explosion')) return;
  const labels = ['GitHub', 'Jenkins', 'AWS Console', 'EKS', 'Argo CD', 'Datadog', 'Jenkins', 'GitHub', 'kubectl', 'AWS Console'];
  const tabs = document.createElement('div');
  tabs.className = 'tab-explosion';
  labels.forEach((label, index) => {
    const tab = document.createElement('span');
    tab.textContent = label;
    tab.style.setProperty('--tab-index', index);
    tabs.appendChild(tab);
  });
  scene.appendChild(tabs);
}

function animateSources() {
  [...document.querySelectorAll('.scene-evidence .evidence-cards article')].forEach((card, index) => {
    card.style.setProperty('--card-delay', `${index * 210}ms`);
    card.classList.add('is-flowing');
  });
}

function animateCorrelation() {
  select('.evidence-terminal')?.classList.add('is-correlating');
  const output = select('.terminal-output');
  if (output) output.innerHTML = 'CORRELATING SIGNALS...<strong>6 SOURCES / 1 INVESTIGATION</strong>';
}

function restartTimer() {
  clearTimeout(timer);
  if (playing) timer = setTimeout(() => goTo(current + 1), sceneTimeline[current]?.duration || 3000);
}

scenes.forEach((_, index) => {
  const segment = document.createElement('span');
  segment.addEventListener('click', () => goTo(index));
  progressTrack.appendChild(segment);
});

playButton.addEventListener('click', (event) => {
  event.stopPropagation();
  playing = !playing;
  playButton.textContent = playing ? 'Ⅱ' : '▶';
  playButton.setAttribute('aria-label', playing ? 'Pause reel' : 'Play reel');
  restartTimer();
});

scrubber.addEventListener('input', () => goTo(Number(scrubber.value)));
viewport.addEventListener('click', (event) => {
  if (!event.target.closest('button, input')) goTo(current + 1);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === ' ') goTo(current + 1);
  if (event.key === 'ArrowLeft') goTo(current - 1);
  if (event.key === 'Escape') { playing = false; playButton.textContent = '▶'; clearTimeout(timer); }
});

render(0);
restartTimer();
