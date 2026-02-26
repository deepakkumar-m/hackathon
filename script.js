/* ============================================
   STATE MANAGEMENT
   ============================================ */
const state = {
    completed: JSON.parse(localStorage.getItem('hackathon_completed') || '[]'),
    score: parseInt(localStorage.getItem('hackathon_score') || '0'),
    points: { 1: 100, 2: 150, 3: 200, 4: 250, 5: 300, 6: 350 }
};

/* ============================================
   INITIALIZATION
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initDragAndDrop();
    restoreProgress();
    initScrollAnimations();
});

/* ============================================
   PARTICLE BACKGROUND
   ============================================ */
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.4 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(6, 182, 212, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(6, 182, 212, ${0.06 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        connectParticles();
        requestAnimationFrame(animate);
    }
    animate();
}

/* ============================================
   SCROLL ANIMATIONS
   ============================================ */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.challenge-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

/* ============================================
   CHALLENGE COMPLETION
   ============================================ */
function completeChallenge(num) {
    if (state.completed.includes(num)) return;

    state.completed.push(num);
    state.score += state.points[num];
    localStorage.setItem('hackathon_completed', JSON.stringify(state.completed));
    localStorage.setItem('hackathon_score', state.score.toString());

    // Update card UI
    const card = document.getElementById(`challenge-${num}`);
    card.classList.add('completed');
    const btn = document.getElementById(`complete-btn-${num}`);
    btn.textContent = '✅ Completed!';
    btn.classList.add('completed');

    // Unlock next
    if (num < 6) {
        const nextCard = document.getElementById(`challenge-${num + 1}`);
        nextCard.classList.remove('locked');
        const lock = document.getElementById(`lock-${num + 1}`);
        if (lock) lock.style.display = 'none';
    }

    // Update pipeline
    updatePipeline();
    updateProgress();

    // Show completion if all done
    if (state.completed.length === 6) {
        showCompletion();
    }

    // Celebration animation
    celebrateCompletion(card);
}

function celebrateCompletion(card) {
    const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        card.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

function restoreProgress() {
    state.completed.forEach(num => {
        const card = document.getElementById(`challenge-${num}`);
        if (card) {
            card.classList.add('completed');
            card.classList.remove('locked');
            const btn = document.getElementById(`complete-btn-${num}`);
            if (btn) {
                btn.textContent = '✅ Completed!';
                btn.classList.add('completed');
            }
        }

        // Unlock next
        if (num < 6) {
            const nextCard = document.getElementById(`challenge-${num + 1}`);
            if (nextCard) {
                nextCard.classList.remove('locked');
                const lock = document.getElementById(`lock-${num + 1}`);
                if (lock) lock.style.display = 'none';
            }
        }
    });

    updatePipeline();
    updateProgress();

    if (state.completed.length === 6) {
        showCompletion();
    }
}

function updatePipeline() {
    const nodes = document.querySelectorAll('.pipeline-node');
    const progress = document.getElementById('pipelineProgress');
    const completedCount = state.completed.length;

    nodes.forEach((node, i) => {
        const challengeNum = i + 1;
        node.classList.remove('active', 'completed');
        if (state.completed.includes(challengeNum)) {
            node.classList.add('completed');
        } else if (challengeNum === completedCount + 1) {
            node.classList.add('active');
        }
    });

    progress.style.width = (completedCount / 6 * 100) + '%';
}

function updateProgress() {
    const count = state.completed.length;
    const pct = Math.round((count / 6) * 100);

    document.getElementById('progressPercent').textContent = pct + '%';
    document.getElementById('completedCount').textContent = count;
    document.getElementById('totalScore').textContent = state.score;

    // Progress ring
    const ring = document.getElementById('progressRing');
    const offset = 263.89 - (263.89 * pct / 100);
    ring.style.strokeDashoffset = offset;

    // Rank
    const ranks = [
        { min: 0, icon: '🌱', title: 'Beginner' },
        { min: 100, icon: '🌿', title: 'Explorer' },
        { min: 250, icon: '⚡', title: 'Builder' },
        { min: 450, icon: '🔥', title: 'Engineer' },
        { min: 700, icon: '💎', title: 'DevOps Pro' },
        { min: 1000, icon: '🏆', title: 'Champion' },
    ];

    let currentRank = ranks[0];
    for (const rank of ranks) {
        if (state.score >= rank.min) currentRank = rank;
    }

    document.getElementById('rankIcon').textContent = currentRank.icon;
    document.getElementById('rankTitle').textContent = currentRank.title;
}

function showCompletion() {
    const section = document.getElementById('completion');
    section.style.display = 'block';
    document.getElementById('finalScore').textContent = state.score;

    // Confetti burst
    const container = document.getElementById('confetti');
    const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 1 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 3) + 's';
        confetti.style.width = (6 + Math.random() * 10) + 'px';
        confetti.style.height = (6 + Math.random() * 10) + 'px';
        container.appendChild(confetti);
    }

    section.scrollIntoView({ behavior: 'smooth' });
}

function resetProgress() {
    state.completed = [];
    state.score = 0;
    localStorage.removeItem('hackathon_completed');
    localStorage.removeItem('hackathon_score');
    location.reload();
}

/* ============================================
   HINTS
   ============================================ */
function toggleHint(num) {
    const content = document.getElementById(`hint-content-${num}`);
    const toggle = content.previousElementSibling;

    if (content.classList.contains('show')) {
        content.classList.remove('show');
        toggle.classList.remove('open');
    } else {
        content.classList.add('show');
        toggle.classList.add('open');
    }
}

/* ============================================
   QUIZ
   ============================================ */
function checkAnswer(btn, isCorrect) {
    const questionDiv = btn.closest('.quiz-question');
    const options = questionDiv.querySelectorAll('.quiz-option');
    const feedback = questionDiv.querySelector('.quiz-feedback');

    options.forEach(opt => {
        opt.classList.add('selected');
        opt.style.pointerEvents = 'none';
    });

    if (isCorrect) {
        btn.classList.add('correct');
        feedback.textContent = '🎉 Correct! Great job!';
        feedback.style.color = '#10b981';
    } else {
        btn.classList.add('wrong');
        // Highlight correct answer
        options.forEach(opt => {
            if (opt.onclick && opt.onclick.toString().includes('true')) {
                opt.classList.add('correct');
            }
        });
        feedback.textContent = '❌ Not quite. See the correct answer highlighted above.';
        feedback.style.color = '#ef4444';
    }
}

/* ============================================
   TERMINAL SIMULATOR
   ============================================ */
const terminalCommands = {
    // Docker build commands (Challenge 2)
    2: {
        'docker build -t myapp:1.0 .': [
            { text: 'Sending build context to Docker daemon  42.3MB', type: 'info', delay: 300 },
            { text: 'Step 1/11 : FROM maven:3.8.6-openjdk-17-slim AS builder', type: '', delay: 600 },
            { text: ' ---> 8d2b1e7e9f3a', type: '', delay: 400 },
            { text: 'Step 2/11 : WORKDIR /app', type: '', delay: 300 },
            { text: ' ---> Using cache', type: '', delay: 200 },
            { text: 'Step 3/11 : COPY pom.xml .', type: '', delay: 300 },
            { text: 'Step 4/11 : RUN mvn dependency:go-offline', type: '', delay: 500 },
            { text: '[INFO] Downloading dependencies...', type: 'info', delay: 800 },
            { text: '[INFO] BUILD SUCCESS', type: 'success', delay: 400 },
            { text: 'Step 5/11 : COPY src ./src', type: '', delay: 300 },
            { text: 'Step 6/11 : RUN mvn clean package -DskipTests', type: '', delay: 500 },
            { text: '[INFO] Building jar: /app/target/myapp-1.0.jar', type: 'info', delay: 600 },
            { text: '[INFO] BUILD SUCCESS', type: 'success', delay: 400 },
            { text: 'Step 7/11 : FROM openjdk:17-slim', type: '', delay: 300 },
            { text: 'Step 8/11 : WORKDIR /app', type: '', delay: 200 },
            { text: 'Step 9/11 : COPY --from=builder /app/target/*.jar app.jar', type: '', delay: 400 },
            { text: 'Step 10/11 : EXPOSE 8080', type: '', delay: 200 },
            { text: 'Step 11/11 : ENTRYPOINT ["java", "-jar", "app.jar"]', type: '', delay: 300 },
            { text: 'Successfully built 3f7a2b9c1d4e', type: 'success', delay: 400 },
            { text: 'Successfully tagged myapp:1.0', type: 'success', delay: 300 },
        ],
        'docker images': [
            { text: 'REPOSITORY   TAG    IMAGE ID       CREATED          SIZE', type: '', delay: 200 },
            { text: 'myapp        1.0    3f7a2b9c1d4e   2 minutes ago    297MB', type: 'info', delay: 100 },
            { text: 'maven        3.8.6  8d2b1e7e9f3a   3 weeks ago      485MB', type: '', delay: 100 },
            { text: 'openjdk      17     a1b2c3d4e5f6   3 weeks ago      274MB', type: '', delay: 100 },
        ],
        'docker run -d -p 8080:8080 myapp:1.0': [
            { text: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef12345678', type: 'info', delay: 500 },
            { text: '✅ Container started successfully!', type: 'success', delay: 300 },
        ],
        'docker ps': [
            { text: 'CONTAINER ID   IMAGE       COMMAND              CREATED         STATUS         PORTS                    NAMES', type: '', delay: 200 },
            { text: 'a7b8c9d0e1f2   myapp:1.0   "java -jar app.jar"  5 seconds ago   Up 4 seconds   0.0.0.0:8080->8080/tcp   loving_turing', type: 'info', delay: 100 },
        ],
        'docker logs a7b8c9d0e1f2': [
            { text: '  .   ____          _            __ _ _', type: '', delay: 100 },
            { text: ' /\\\\ / ___\'_ __ _ _(_)_ __  __ _ \\ \\ \\ \\', type: '', delay: 50 },
            { text: '( ( )\\___ | \'_ | \'_| | \'_ \\/ _` | \\ \\ \\ \\', type: '', delay: 50 },
            { text: ' \\\\/  ___)| |_)| | | | | || (_| |  ) ) ) )', type: '', delay: 50 },
            { text: '  \'  |____| .__|_| |_|_| |_\\__, | / / / /', type: '', delay: 50 },
            { text: ' =========|_|==============|___/=/_/_/_/', type: '', delay: 50 },
            { text: ' :: Spring Boot ::                (v3.1.0)', type: '', delay: 200 },
            { text: 'Started MyApplication in 2.345 seconds', type: 'success', delay: 300 },
        ],
    },
    // JFrog commands (Challenge 3)
    3: {
        'docker login your-jfrog.jfrog.io': [
            { text: 'Username: developer', type: '', delay: 500 },
            { text: 'Password: ********', type: '', delay: 500 },
            { text: 'Login Succeeded ✅', type: 'success', delay: 400 },
        ],
        'docker tag myapp:1.0 your-jfrog.jfrog.io/docker-local/myapp:1.0': [
            { text: '[Tagged successfully]', type: 'success', delay: 300 },
        ],
        'docker push your-jfrog.jfrog.io/docker-local/myapp:1.0': [
            { text: 'The push refers to repository [your-jfrog.jfrog.io/docker-local/myapp]', type: '', delay: 400 },
            { text: 'a1b2c3d4: Preparing', type: '', delay: 300 },
            { text: 'e5f6g7h8: Preparing', type: '', delay: 200 },
            { text: 'a1b2c3d4: Pushing [==>                                              ] 12.5MB/297MB', type: 'info', delay: 600 },
            { text: 'a1b2c3d4: Pushing [=============>                                   ] 78.2MB/297MB', type: 'info', delay: 800 },
            { text: 'a1b2c3d4: Pushing [=================================>               ] 198MB/297MB', type: 'info', delay: 700 },
            { text: 'a1b2c3d4: Pushing [================================================>] 297MB/297MB', type: 'info', delay: 500 },
            { text: 'a1b2c3d4: Pushed', type: 'success', delay: 300 },
            { text: 'e5f6g7h8: Pushed', type: 'success', delay: 200 },
            { text: '1.0: digest: sha256:abc123def456... size: 1574', type: 'success', delay: 400 },
            { text: '✅ Image pushed to JFrog Artifactory!', type: 'success', delay: 300 },
        ],
    },
    // Kubectl commands (Challenge 6)
    6: {
        'kubectl get pods -n myapp-prod': [
            { text: 'NAME                     READY   STATUS    RESTARTS   AGE', type: '', delay: 200 },
            { text: 'myapp-6d4f7b8c9-x2k4m   1/1     Running   0          5m', type: 'success', delay: 100 },
            { text: 'myapp-6d4f7b8c9-a8n2p   1/1     Running   0          5m', type: 'success', delay: 100 },
        ],
        'kubectl get svc -n myapp-prod': [
            { text: 'NAME    TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE', type: '', delay: 200 },
            { text: 'myapp   ClusterIP   10.43.124.55   <none>        8080/TCP   5m', type: 'info', delay: 100 },
        ],
        'kubectl describe pod myapp-6d4f7b8c9-x2k4m -n myapp-prod': [
            { text: 'Name:         myapp-6d4f7b8c9-x2k4m', type: '', delay: 100 },
            { text: 'Namespace:    myapp-prod', type: '', delay: 50 },
            { text: 'Node:         worker-01/10.0.1.15', type: '', delay: 50 },
            { text: 'Status:       Running', type: 'success', delay: 50 },
            { text: 'IP:           10.42.0.128', type: '', delay: 50 },
            { text: 'Image:        your-jfrog.jfrog.io/docker-local/myapp:1.0', type: 'info', delay: 50 },
            { text: 'Port:         8080/TCP', type: '', delay: 50 },
            { text: 'Limits:       cpu: 500m, memory: 512Mi', type: '', delay: 50 },
            { text: 'Requests:     cpu: 250m, memory: 256Mi', type: '', delay: 50 },
            { text: 'Conditions:', type: '', delay: 50 },
            { text: '  Ready       True', type: 'success', delay: 50 },
            { text: '  Scheduled   True', type: 'success', delay: 50 },
        ],
        'kubectl logs myapp-6d4f7b8c9-x2k4m -n myapp-prod': [
            { text: 'Started MyApplication in 2.345 seconds (JVM running for 3.012)', type: 'success', delay: 300 },
            { text: 'Tomcat started on port(s): 8080 (http)', type: 'info', delay: 200 },
            { text: 'Application is ready to serve requests', type: 'success', delay: 200 },
        ],
        'kubectl scale deployment myapp --replicas=3 -n myapp-prod': [
            { text: 'deployment.apps/myapp scaled', type: 'success', delay: 400 },
            { text: '✅ Scaled to 3 replicas!', type: 'success', delay: 300 },
        ],
        'kubectl get events -n myapp-prod': [
            { text: 'LAST SEEN   TYPE     REASON              OBJECT                MESSAGE', type: '', delay: 200 },
            { text: '5m          Normal   Scheduled           pod/myapp-x2k4m       Successfully assigned', type: '', delay: 100 },
            { text: '5m          Normal   Pulled              pod/myapp-x2k4m       Container image pulled', type: '', delay: 100 },
            { text: '5m          Normal   Created             pod/myapp-x2k4m       Created container myapp', type: '', delay: 100 },
            { text: '5m          Normal   Started             pod/myapp-x2k4m       Started container myapp', type: 'success', delay: 100 },
        ],
    }
};

function handleTerminalInput(event, terminalId) {
    if (event.key !== 'Enter') return;

    const input = document.getElementById(`terminal-input-${terminalId}`);
    const output = document.getElementById(`terminal-output-${terminalId}`);
    const cmd = input.value.trim();
    input.value = '';

    if (!cmd) return;

    // Remove cursor blink line
    const cursorLine = output.querySelector('.cursor-blink');
    if (cursorLine) cursorLine.parentElement.remove();

    // Show command
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-line prompt';
    cmdLine.textContent = '$ ' + cmd;
    output.appendChild(cmdLine);

    // Find matching command
    const commands = terminalCommands[terminalId] || {};
    let matched = null;

    for (const key of Object.keys(commands)) {
        if (cmd.toLowerCase().includes(key.toLowerCase().split(' ').slice(0, 2).join(' ')) ||
            cmd.toLowerCase() === key.toLowerCase() ||
            key.toLowerCase().startsWith(cmd.toLowerCase())) {
            // Try exact match first
            if (cmd.toLowerCase() === key.toLowerCase()) {
                matched = commands[key];
                break;
            }
            matched = commands[key];
        }
    }

    if (matched) {
        let totalDelay = 0;
        matched.forEach(line => {
            totalDelay += line.delay;
            setTimeout(() => {
                const el = document.createElement('div');
                el.className = `terminal-line ${line.type}`;
                el.textContent = line.text;
                output.appendChild(el);
                scrollTerminal(terminalId);
            }, totalDelay);
        });
    } else {
        // Generic response
        const el = document.createElement('div');
        el.className = 'terminal-line error';
        el.textContent = `Command not recognized in simulator. Try the suggested commands below!`;
        output.appendChild(el);
    }

    scrollTerminal(terminalId);
}

function scrollTerminal(id) {
    const terminal = document.getElementById(`terminal-${id}`);
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
}

/* ============================================
   DRAG AND DROP (SEQUENCE ORDERING)
   ============================================ */
function initDragAndDrop() {
    document.querySelectorAll('.sortable-list').forEach(list => {
        let dragItem = null;

        list.querySelectorAll('.sortable-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                dragItem = item;
                setTimeout(() => item.classList.add('dragging'), 0);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                dragItem = null;
            });
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(dragItem);
            } else {
                list.insertBefore(dragItem, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function checkOrder(challengeId) {
    const list = document.getElementById(`sortable-${challengeId}`);
    const items = list.querySelectorAll('.sortable-item');
    const feedback = document.getElementById(`order-feedback-${challengeId}`);
    let allCorrect = true;

    items.forEach((item, index) => {
        const expectedOrder = index + 1;
        const actualOrder = parseInt(item.dataset.order);

        item.classList.remove('correct-order', 'wrong-order');

        if (actualOrder === expectedOrder) {
            item.classList.add('correct-order');
        } else {
            item.classList.add('wrong-order');
            allCorrect = false;
        }
    });

    if (allCorrect) {
        feedback.textContent = '🎉 Perfect! That\'s the correct order!';
        feedback.style.color = '#10b981';
    } else {
        feedback.textContent = '❌ Not quite right. Try rearranging the steps!';
        feedback.style.color = '#ef4444';
    }
}

/* ============================================
   FILE EXPLORER
   ============================================ */
const fileContents = {
    'chart-yaml': `apiVersion: v2
name: myapp-chart
description: A Helm chart for our Java application
type: application
version: 0.1.0
appVersion: "1.0.0"`,

    'values-yaml': `replicaCount: 2

image:
  repository: your-jfrog.jfrog.io/docker-local/myapp
  tag: "1.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

ingress:
  enabled: true
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix`,

    'deployment-yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.port }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}`,

    'service-yaml': `apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.port }}
      protocol: TCP
  selector:
    app: {{ .Release.Name }}`,

    'ingress-yaml': `{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}
spec:
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ $.Release.Name }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}`
};

function showFileContent(fileId) {
    const title = document.getElementById('file-content-title');
    const body = document.getElementById('file-content-body');

    const names = {
        'chart-yaml': 'Chart.yaml',
        'values-yaml': 'values.yaml',
        'deployment-yaml': 'templates/deployment.yaml',
        'service-yaml': 'templates/service.yaml',
        'ingress-yaml': 'templates/ingress.yaml'
    };

    title.textContent = names[fileId] || fileId;
    body.textContent = fileContents[fileId] || 'File not found';

    // Update active state
    document.querySelectorAll('.file-tree-item.file').forEach(item => {
        item.classList.remove('active-file');
    });
    event.currentTarget.classList.add('active-file');
}

function toggleFolder(el) {
    const children = el.nextElementSibling;
    if (children && children.classList.contains('file-tree-children')) {
        children.style.display = children.style.display === 'none' ? 'block' : 'none';
        el.querySelector('.file-icon').textContent = children.style.display === 'none' ? '📁' : '📂';
    }
}

/* ============================================
   FILL IN THE BLANKS
   ============================================ */
function checkBlanks(challengeId) {
    const inputs = document.querySelectorAll(`[id^="blank-${challengeId}-"]`);
    const feedback = document.getElementById(`blanks-feedback-${challengeId}`);
    let correct = 0;

    inputs.forEach(input => {
        const expected = input.dataset.answer.toLowerCase();
        const value = input.value.trim().toLowerCase();

        input.classList.remove('correct', 'wrong');

        if (value === expected) {
            input.classList.add('correct');
            correct++;
        } else if (value) {
            input.classList.add('wrong');
        }
    });

    if (correct === inputs.length) {
        feedback.textContent = `🎉 All ${correct} answers correct!`;
        feedback.style.color = '#10b981';
    } else {
        feedback.textContent = `${correct}/${inputs.length} correct. Keep trying!`;
        feedback.style.color = '#f59e0b';
    }
}

/* ============================================
   GITOPS FLOW ANIMATION
   ============================================ */
function animateGitOpsFlow() {
    const steps = document.querySelectorAll('.flow-step');
    steps.forEach(s => s.classList.remove('active'));

    steps.forEach((step, i) => {
        setTimeout(() => {
            steps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');
        }, i * 1000);
    });

    // Reset after animation
    setTimeout(() => {
        steps.forEach(s => s.classList.remove('active'));
    }, steps.length * 1000 + 500);
}

/* ============================================
   KUBERNETES DASHBOARD ACTIONS
   ============================================ */
let podCounter = 2;

function scalePods(direction) {
    const podsContainer = document.querySelector('.k8s-pods');

    if (direction === 'up') {
        podCounter++;
        const id = generatePodId();
        const pod = document.createElement('div');
        pod.className = 'k8s-pod running';
        pod.innerHTML = `
            <div class="pod-status-dot"></div>
            <div class="pod-info">
                <span class="pod-name">myapp-6d4f7b8c9-${id}</span>
                <span class="pod-status">Running</span>
            </div>
            <div class="pod-metrics">
                <span>CPU: ${Math.floor(Math.random() * 20 + 5)}%</span>
                <span>Mem: ${Math.floor(Math.random() * 50 + 100)}Mi</span>
            </div>
        `;
        podsContainer.appendChild(pod);
    } else if (direction === 'down') {
        const pods = podsContainer.querySelectorAll('.k8s-pod');
        if (pods.length > 1) {
            const lastPod = pods[pods.length - 1];
            lastPod.style.opacity = '0';
            lastPod.style.transform = 'translateX(20px)';
            setTimeout(() => lastPod.remove(), 300);
            podCounter--;
        }
    }
}

function rolloutRestart() {
    const pods = document.querySelectorAll('.k8s-pod');
    pods.forEach((pod, i) => {
        setTimeout(() => {
            pod.querySelector('.pod-status').textContent = 'Terminating';
            pod.querySelector('.pod-status').style.color = '#f59e0b';
            pod.querySelector('.pod-status-dot').style.background = '#f59e0b';

            setTimeout(() => {
                pod.querySelector('.pod-name').textContent = `myapp-${generatePodId()}-${generatePodId()}`;
                pod.querySelector('.pod-status').textContent = 'Running';
                pod.querySelector('.pod-status').style.color = '#10b981';
                pod.querySelector('.pod-status-dot').style.background = '#10b981';
            }, 1500);
        }, i * 800);
    });
}

function generatePodId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}
