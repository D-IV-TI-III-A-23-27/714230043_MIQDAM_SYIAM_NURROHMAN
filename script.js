// ===== KNN Algorithm Visualization =====
// Main application script

(function () {
    "use strict";

    // ===== PARTICLE BACKGROUND =====
    const particleCanvas = document.getElementById("particleCanvas");
    const pCtx = particleCanvas.getContext("2d");
    let particles = [];

    function initParticles() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
        particles = [];
        const count = Math.floor((particleCanvas.width * particleCanvas.height) / 18000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                r: Math.random() * 1.5 + 0.5,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.1,
            });
        }
    }

    function animateParticles() {
        pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        particles.forEach((p) => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0 || p.x > particleCanvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > particleCanvas.height) p.dy *= -1;
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(167,139,250,${p.opacity})`;
            pCtx.fill();
        });
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
    window.addEventListener("resize", initParticles);

    // ===== KNN STATE =====
    const state = {
        k: 3,
        distMetric: "euclidean",
        animSpeed: "normal",
        trainingData: [],
        queryPoint: null,
        isAnimating: false,
        animFrame: null,
    };

    // Speed mapping
    const speedMap = { slow: 1200, normal: 700, fast: 300 };

    // ===== ELEMENTS =====
    const knnCanvas = document.getElementById("knnCanvas");
    const ctx = knnCanvas.getContext("2d");
    const canvasWrapper = document.getElementById("canvasWrapper");
    const canvasOverlay = document.getElementById("canvasOverlay");
    const kDisplay = document.getElementById("kDisplay");
    const kSlider = document.getElementById("kSlider");
    const kDecrease = document.getElementById("kDecrease");
    const kIncrease = document.getElementById("kIncrease");
    const distMetric = document.getElementById("distMetric");
    const animSpeed = document.getElementById("animSpeed");
    const btnAnimate = document.getElementById("btnAnimate");
    const btnReset = document.getElementById("btnReset");
    const btnRandomData = document.getElementById("btnRandomData");
    const resultCard = document.getElementById("resultCard");
    const resultContent = document.getElementById("resultContent");

    // ===== CANVAS SETUP =====
    function resizeCanvas() {
        const rect = canvasWrapper.getBoundingClientRect();
        knnCanvas.width = rect.width * window.devicePixelRatio;
        knnCanvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        drawAll();
    }

    function getCanvasSize() {
        return {
            w: knnCanvas.width / window.devicePixelRatio,
            h: knnCanvas.height / window.devicePixelRatio,
        };
    }

    // ===== GENERATE DATA =====
    function generateRandomData() {
        state.trainingData = [];
        state.queryPoint = null;
        resultCard.style.display = "none";
        const { w, h } = getCanvasSize();
        const pad = 40;

        // Class A cluster (pink) - upper-left area
        for (let i = 0; i < 12; i++) {
            state.trainingData.push({
                x: pad + Math.random() * (w * 0.4 - pad),
                y: pad + Math.random() * (h * 0.5 - pad),
                cls: "A",
            });
        }
        // Class A secondary cluster
        for (let i = 0; i < 5; i++) {
            state.trainingData.push({
                x: pad + Math.random() * (w * 0.3 - pad),
                y: h * 0.4 + Math.random() * (h * 0.3),
                cls: "A",
            });
        }

        // Class B cluster (green) - lower-right area
        for (let i = 0; i < 12; i++) {
            state.trainingData.push({
                x: w * 0.5 + Math.random() * (w * 0.45 - pad),
                y: h * 0.35 + Math.random() * (h * 0.55 - pad),
                cls: "B",
            });
        }
        // Class B secondary cluster
        for (let i = 0; i < 5; i++) {
            state.trainingData.push({
                x: w * 0.55 + Math.random() * (w * 0.35 - pad),
                y: pad + Math.random() * (h * 0.35),
                cls: "B",
            });
        }

        btnAnimate.disabled = true;
        canvasOverlay.style.display = "";
        drawAll();
    }

    // ===== DISTANCE FUNCTIONS =====
    function euclidean(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
    function manhattan(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    function calcDist(a, b) {
        return state.distMetric === "manhattan" ? manhattan(a, b) : euclidean(a, b);
    }

    // ===== DRAWING =====
    function drawGrid() {
        const { w, h } = getCanvasSize();
        ctx.strokeStyle = "rgba(167,139,250,0.06)";
        ctx.lineWidth = 1;
        const step = 30;
        for (let x = step; x < w; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = step; y < h; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    function drawPoint(x, y, cls, radius, glow, label) {
        const colors = {
            A: { fill: "#f472b6", shadow: "rgba(244,114,182,0.5)" },
            B: { fill: "#34d399", shadow: "rgba(52,211,153,0.5)" },
            Q: { fill: "#a78bfa", shadow: "rgba(167,139,250,0.6)" },
        };
        const c = colors[cls] || colors.Q;

        if (glow) {
            ctx.shadowColor = c.shadow;
            ctx.shadowBlur = glow;
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = c.fill;
        ctx.fill();

        if (cls === "Q") {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        if (label) {
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.font = "600 10px 'Inter'";
            ctx.textAlign = "center";
            ctx.fillText(label, x, y - radius - 6);
        }
    }

    function drawAll(highlights, lines, kCircleRadius) {
        const { w, h } = getCanvasSize();
        ctx.clearRect(0, 0, w, h);

        // Background
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, "rgba(30,20,60,0.4)");
        grad.addColorStop(1, "rgba(10,10,26,1)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        drawGrid();

        // Draw K circle
        if (kCircleRadius && state.queryPoint) {
            ctx.beginPath();
            ctx.arc(state.queryPoint.x, state.queryPoint.y, kCircleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(167,139,250,0.25)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "rgba(167,139,250,0.04)";
            ctx.fill();
        }

        // Draw distance lines
        if (lines) {
            lines.forEach((l) => {
                ctx.beginPath();
                ctx.moveTo(l.from.x, l.from.y);
                ctx.lineTo(l.to.x, l.to.y);
                ctx.strokeStyle = l.color || "rgba(167,139,250,0.2)";
                ctx.lineWidth = l.width || 1;
                ctx.setLineDash(l.dash || [4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Distance label
                if (l.label) {
                    const mx = (l.from.x + l.to.x) / 2;
                    const my = (l.from.y + l.to.y) / 2;
                    ctx.fillStyle = "rgba(0,0,0,0.6)";
                    const tw = ctx.measureText(l.label).width;
                    ctx.fillRect(mx - tw / 2 - 4, my - 8, tw + 8, 16);
                    ctx.fillStyle = l.labelColor || "rgba(167,139,250,0.9)";
                    ctx.font = "600 9px 'JetBrains Mono'";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(l.label, mx, my);
                }
            });
        }

        // Draw training data
        const highlightSet = highlights ? new Set(highlights) : new Set();
        state.trainingData.forEach((p, i) => {
            const isHighlight = highlightSet.has(i);
            drawPoint(p.x, p.y, p.cls, isHighlight ? 9 : 6, isHighlight ? 18 : 6);
        });

        // Draw query point
        if (state.queryPoint) {
            drawPoint(state.queryPoint.x, state.queryPoint.y, "Q", 10, 22, "?");
        }
    }

    // ===== CANVAS INTERACTION =====
    knnCanvas.addEventListener("click", (e) => {
        if (state.isAnimating) return;
        const rect = knnCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        state.queryPoint = { x, y };
        btnAnimate.disabled = false;
        canvasOverlay.style.display = "none";
        resultCard.style.display = "none";
        drawAll();
    });

    // ===== KNN ANIMATION =====
    async function runKNNAnimation() {
        if (!state.queryPoint || state.isAnimating) return;
        state.isAnimating = true;
        btnAnimate.disabled = true;
        btnReset.disabled = true;
        btnRandomData.disabled = true;
        resultCard.style.display = "none";

        const q = state.queryPoint;
        const speed = speedMap[state.animSpeed];

        // Step 1: Show all distances one by one
        const distances = state.trainingData.map((p, i) => ({
            idx: i,
            dist: calcDist(q, p),
            cls: p.cls,
        }));

        // Animate lines appearing
        let lines = [];
        for (let i = 0; i < distances.length; i++) {
            const p = state.trainingData[distances[i].idx];
            lines.push({
                from: q,
                to: p,
                color: "rgba(167,139,250,0.12)",
                width: 0.8,
                dash: [3, 5],
                label: distances[i].dist.toFixed(1),
                labelColor: "rgba(167,139,250,0.6)",
            });
            drawAll([], lines);
            await sleep(speed / 8);
        }

        await sleep(speed);

        // Step 2: Sort and highlight K nearest
        distances.sort((a, b) => a.dist - b.dist);
        const kNearest = distances.slice(0, state.k);
        const kFarthest = distances.slice(state.k);

        // Fade out far lines, highlight near ones
        lines = [];
        kNearest.forEach((d) => {
            const p = state.trainingData[d.idx];
            lines.push({
                from: q,
                to: p,
                color: d.cls === "A" ? "rgba(244,114,182,0.6)" : "rgba(52,211,153,0.6)",
                width: 2,
                dash: [],
                label: d.dist.toFixed(1),
                labelColor: d.cls === "A" ? "#f472b6" : "#34d399",
            });
        });

        const kCircleRadius = kNearest.length > 0 ? kNearest[kNearest.length - 1].dist + 12 : 0;
        const highlightIdxs = kNearest.map((d) => d.idx);

        drawAll(highlightIdxs, lines, kCircleRadius);
        await sleep(speed * 1.5);

        // Step 3: Majority vote
        let votesA = 0, votesB = 0;
        kNearest.forEach((d) => {
            if (d.cls === "A") votesA++;
            else votesB++;
        });

        const predictedClass = votesA >= votesB ? "A" : "B";

        // Show result
        resultCard.style.display = "";
        resultContent.innerHTML = `
            <div style="text-align:center;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Prediksi Kelas</div>
                <div class="result-class ${predictedClass === 'A' ? 'class-a' : 'class-b'}">
                    Kelas ${predictedClass} ${predictedClass === 'A' ? '(Setosa)' : '(Versicolor)'}
                </div>
                <div class="result-votes">
                    <div class="vote-bar a">
                        <span class="vote-count">${votesA}</span>
                        Kelas A
                    </div>
                    <div class="vote-bar b">
                        <span class="vote-count">${votesB}</span>
                        Kelas B
                    </div>
                </div>
            </div>
            <table class="dist-table">
                <tr><th>#</th><th>Kelas</th><th>Jarak</th></tr>
                ${distances.slice(0, Math.min(10, distances.length)).map((d, i) => `
                    <tr class="${i < state.k ? 'neighbor' : ''}">
                        <td>${i + 1}</td>
                        <td style="color:${d.cls === 'A' ? 'var(--accent-pink)' : 'var(--accent-green)'};">${d.cls}</td>
                        <td>${d.dist.toFixed(2)}</td>
                    </tr>
                `).join("")}
            </table>
        `;

        state.isAnimating = false;
        btnAnimate.disabled = false;
        btnReset.disabled = false;
        btnRandomData.disabled = false;

        // Trigger timeline animations
        animateTimeline(kNearest, votesA, votesB, predictedClass);
    }

    function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    // ===== TIMELINE ANIMATIONS =====
    async function animateTimeline(kNearest, votesA, votesB, predicted) {
        // Sorting animation
        const sortingAnim = document.getElementById("sortingAnim");
        sortingAnim.innerHTML = "";
        const barData = kNearest.map((d) => ({ dist: d.dist, cls: d.cls }));
        // Add some extra non-neighbor data for visual
        const extra = state.trainingData.slice(0, 4).map((p) => ({
            dist: calcDist(state.queryPoint, p),
            cls: p.cls,
        }));
        const allBars = [...barData, ...extra].sort(() => Math.random() - 0.5);
        const maxDist = Math.max(...allBars.map((b) => b.dist));

        allBars.forEach((b) => {
            const bar = document.createElement("div");
            bar.className = "sort-bar";
            const h = Math.max(20, (b.dist / maxDist) * 70);
            bar.style.height = h + "px";
            bar.style.background = b.cls === "A" ? "rgba(244,114,182,0.4)" : "rgba(52,211,153,0.4)";
            bar.style.color = b.cls === "A" ? "#f472b6" : "#34d399";
            bar.textContent = b.dist.toFixed(0);
            sortingAnim.appendChild(bar);
        });

        // Animate sorting
        await sleep(800);
        const sortedBars = [...allBars].sort((a, b) => a.dist - b.dist);
        const barEls = sortingAnim.querySelectorAll(".sort-bar");
        sortedBars.forEach((b, i) => {
            const origIdx = allBars.indexOf(b);
            if (origIdx >= 0 && barEls[origIdx]) {
                barEls[origIdx].style.order = i;
                const h = Math.max(20, (b.dist / maxDist) * 70);
                barEls[origIdx].style.height = h + "px";
                if (i < state.k) {
                    barEls[origIdx].style.border = "2px solid " + (b.cls === "A" ? "#f472b6" : "#34d399");
                    barEls[origIdx].style.background = b.cls === "A" ? "rgba(244,114,182,0.6)" : "rgba(52,211,153,0.6)";
                }
            }
        });

        // Voting animation
        const votingAnim = document.getElementById("votingAnim");
        votingAnim.innerHTML = `
            <div class="vote-column a">
                <div class="vote-label">Kelas A</div>
                <div class="vote-dots" id="votesADots"></div>
                <div class="winner-badge a" id="winA">${predicted === "A" ? "WINNER ✓" : ""}</div>
            </div>
            <div class="vote-column b">
                <div class="vote-label">Kelas B</div>
                <div class="vote-dots" id="votesBDots"></div>
                <div class="winner-badge b" id="winB">${predicted === "B" ? "WINNER ✓" : ""}</div>
            </div>
        `;

        const aDotsContainer = document.getElementById("votesADots");
        const bDotsContainer = document.getElementById("votesBDots");

        for (let i = 0; i < votesA; i++) {
            const dot = document.createElement("div");
            dot.className = "vote-dot a";
            aDotsContainer.appendChild(dot);
            await sleep(300);
            dot.classList.add("show");
        }
        for (let i = 0; i < votesB; i++) {
            const dot = document.createElement("div");
            dot.className = "vote-dot b";
            bDotsContainer.appendChild(dot);
            await sleep(300);
            dot.classList.add("show");
        }

        await sleep(500);
        const winBadge = document.getElementById(predicted === "A" ? "winA" : "winB");
        if (winBadge) winBadge.classList.add("show");
    }

    // ===== CONTROLS =====
    function updateK(val) {
        state.k = Math.max(1, Math.min(11, val));
        if (state.k % 2 === 0) state.k++;
        kDisplay.textContent = state.k;
        kSlider.value = state.k;
    }

    kSlider.addEventListener("input", () => updateK(parseInt(kSlider.value)));
    kDecrease.addEventListener("click", () => updateK(state.k - 2));
    kIncrease.addEventListener("click", () => updateK(state.k + 2));
    distMetric.addEventListener("change", () => (state.distMetric = distMetric.value));
    animSpeed.addEventListener("change", () => (state.animSpeed = animSpeed.value));
    btnAnimate.addEventListener("click", runKNNAnimation);

    btnReset.addEventListener("click", () => {
        state.queryPoint = null;
        state.isAnimating = false;
        btnAnimate.disabled = true;
        resultCard.style.display = "none";
        canvasOverlay.style.display = "";
        drawAll();
    });

    btnRandomData.addEventListener("click", generateRandomData);

    // ===== DISTANCE METRIC CANVASES =====
    function drawMetricCanvas(canvasId, type) {
        const canvas = document.getElementById(canvasId);
        const c = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        c.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        // Background
        c.fillStyle = "rgba(10,10,26,0.8)";
        c.fillRect(0, 0, W, H);

        // Grid
        c.strokeStyle = "rgba(167,139,250,0.06)";
        c.lineWidth = 1;
        for (let x = 20; x < W; x += 20) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 20; y < H; y += 20) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }

        const p1 = { x: W * 0.25, y: H * 0.7 };
        const p2 = { x: W * 0.75, y: H * 0.25 };

        if (type === "euclidean") {
            // Direct line
            c.beginPath();
            c.moveTo(p1.x, p1.y);
            c.lineTo(p2.x, p2.y);
            c.strokeStyle = "rgba(167,139,250,0.7)";
            c.lineWidth = 2.5;
            c.setLineDash([]);
            c.stroke();

            // Label
            const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
            c.fillStyle = "rgba(167,139,250,0.9)";
            c.font = "600 11px 'JetBrains Mono'";
            c.textAlign = "center";
            c.fillText("d", mx - 12, my - 8);
        } else {
            // Manhattan path
            c.beginPath();
            c.moveTo(p1.x, p1.y);
            c.lineTo(p2.x, p1.y);
            c.lineTo(p2.x, p2.y);
            c.strokeStyle = "rgba(96,165,250,0.7)";
            c.lineWidth = 2.5;
            c.setLineDash([]);
            c.stroke();

            // Labels
            c.fillStyle = "rgba(96,165,250,0.9)";
            c.font = "600 10px 'JetBrains Mono'";
            c.textAlign = "center";
            c.fillText("|Δx|", (p1.x + p2.x) / 2, p1.y + 16);
            c.fillText("|Δy|", p2.x + 18, (p1.y + p2.y) / 2);

            // Dashed direct line for comparison
            c.beginPath();
            c.moveTo(p1.x, p1.y);
            c.lineTo(p2.x, p2.y);
            c.strokeStyle = "rgba(167,139,250,0.2)";
            c.lineWidth = 1;
            c.setLineDash([4, 4]);
            c.stroke();
            c.setLineDash([]);
        }

        // Draw points
        [p1, p2].forEach((p, i) => {
            c.beginPath();
            c.arc(p.x, p.y, 7, 0, Math.PI * 2);
            c.fillStyle = i === 0 ? "#f472b6" : "#34d399";
            c.shadowColor = i === 0 ? "rgba(244,114,182,0.5)" : "rgba(52,211,153,0.5)";
            c.shadowBlur = 12;
            c.fill();
            c.shadowBlur = 0;

            c.fillStyle = "rgba(255,255,255,0.7)";
            c.font = "600 10px 'Inter'";
            c.textAlign = "center";
            const label = i === 0 ? "P₁" : "P₂";
            c.fillText(label, p.x, p.y - 14);
        });
    }

    // ===== SCROLL ANIMATIONS =====
    function initScrollAnimations() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }
                });
            },
            { threshold: 0.2 }
        );

        document.querySelectorAll(".timeline-step").forEach((el) => observer.observe(el));
    }

    // ===== INIT =====
    function init() {
        resizeCanvas();
        generateRandomData();
        initScrollAnimations();

        setTimeout(() => {
            drawMetricCanvas("euclideanCanvas", "euclidean");
            drawMetricCanvas("manhattanCanvas", "manhattan");
        }, 300);
    }

    window.addEventListener("resize", () => {
        resizeCanvas();
        drawMetricCanvas("euclideanCanvas", "euclidean");
        drawMetricCanvas("manhattanCanvas", "manhattan");
    });

    // Wait for fonts
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(init);
    } else {
        window.addEventListener("load", init);
    }
})();
