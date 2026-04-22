// ========== POLYFILL: roundRect ==========
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.arcTo(x + w, y, x + w, y + r, r);
        this.lineTo(x + w, y + h - r);
        this.arcTo(x + w, y + h, x + w - r, y + h, r);
        this.lineTo(x + r, y + h);
        this.arcTo(x, y + h, x, y + h - r, r);
        this.lineTo(x, y + r);
        this.arcTo(x, y, x + r, y, r);
        this.closePath();
    };
}

// ========== MOBILE DETECTION ==========
function isMobileDevice() {
    return ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ========== GAME ENGINE ==========

class Game {
    constructor(canvas, gender) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gender = gender;
        this.running = false;
        this.paused = false;
        this.animFrameId = null;

        // Game state
        this.score = 0;
        this.lives = 3;
        this.round = 0;
        this.frozen = false;
        this.freezeEndTime = 0;

        // Round state
        this.roundConfig = null;
        this.activeCompetences = [];
        this.bullets = [];
        this.enemyBullets = [];  // Projectiles from competences
        this.particles = [];
        this.targetsRemaining = new Set();
        this.passedCorrectly = 0;
        this.enemyShootTimer = 0;

        // Grid movement state
        this.gridDirection = 1; // 1 = right, -1 = left
        this.gridSpeed = 1;     // horizontal speed (px per frame unit)
        this.dropAmount = 0;    // pending drop pixels
        this.gridPadding = 8;   // gap between competences in grid

        // Ammo system
        this.maxAmmo = 5;
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadTime = 2000; // ms to fully reload
        this.reloadTimer = 0;   // ms elapsed since reload started

        // Stats
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsDestroyed = 0;
        this.wrongHits = 0;
        this.livesLostThisRound = 0;

        // Player
        this.player = {
            x: 0,
            y: 0,
            width: 40,
            height: 50,
            speed: 4,
            movingLeft: false,
            movingRight: false,
        };

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

        // Callbacks
        this.onRoundComplete = null;
        this.onGameOver = null;
        this.onScoreChange = null;
        this.onLivesChange = null;
        this.onFreezeChange = null;
        this.onTargetUpdate = null;
        this.onAmmoChange = null;

        this.resize();
    }

    resize() {
        const parent = this.canvas.parentElement;
        const hud = document.getElementById('game-hud');
        const targets = document.getElementById('game-targets-bar');
        const controls = document.getElementById('game-controls');

        const hudH = hud ? hud.offsetHeight : 44;
        const targetsH = targets ? targets.offsetHeight : 32;
        const controlsH = controls ? controls.offsetHeight : 0;

        const w = parent.clientWidth;
        const h = parent.clientHeight - hudH - targetsH - controlsH;

        const dpr = Math.min(window.devicePixelRatio, 2); // cap at 2x to limit GPU memory on 3x iPhones
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.width = w;
        this.height = h;

        // Regenerate stars for new dimensions
        this._stars = null;

        // Update player position
        this.player.y = this.height - this.player.height - 10;
        if (this.player.x === 0) {
            this.player.x = this.width / 2 - this.player.width / 2;
        }
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
    }

    startRound(roundIndex) {
        this.round = roundIndex;
        this.roundConfig = getRoundConfig(roundIndex);

        // Reset round state
        this.activeCompetences = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.frozen = false;
        this.freezeEndTime = 0;
        this.enemyShootTimer = 0;
        this.passedCorrectly = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.targetsDestroyed = 0;
        this.wrongHits = 0;
        this.livesLostThisRound = 0;

        // Reset ammo
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadTimer = 0;

        // Grid movement
        this.gridDirection = 1;
        this.gridSpeed = this.roundConfig.speed * 1.5;
        this.dropAmount = 0;

        this.targetsRemaining = new Set(this.roundConfig.targets);

        // Build grid of competences
        this.buildGrid();

        // Reset player position
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.movingLeft = false;
        this.player.movingRight = false;

        if (this.onTargetUpdate) this.onTargetUpdate(this.roundConfig.targets, this.targetsRemaining);

        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    buildGrid() {
        const competenceIds = [...this.roundConfig.competences];
        const padding = this.gridPadding;

        // Measure all competences to determine sizes
        const items = [];
        for (const id of competenceIds) {
            const comp = getCompetenceById(id);
            if (!comp) continue;
            const config = AREA_CONFIG[comp.area];
            const name = getCompetenceName(comp);
            const fontSize = 11 * config.sizeMultiplier + 2;
            this.ctx.font = `600 ${fontSize}px 'Open Sans', sans-serif`;
            const textWidth = this.ctx.measureText(name).width;
            const baseWidth = 120 * config.sizeMultiplier;
            const width = Math.max(baseWidth, textWidth + 24);
            const height = 32 * config.sizeMultiplier + 8;
            items.push({ id, comp, config, width, height });
        }

        // Interleave items by area so rows mix PERSPECTIVE / PRACTICE / PEOPLE
        const byArea = {};
        for (const item of items) {
            const a = item.comp.area;
            if (!byArea[a]) byArea[a] = [];
            byArea[a].push(item);
        }
        const areaQueues = Object.values(byArea);
        const interleaved = [];
        let qi = 0;
        while (interleaved.length < items.length) {
            const q = areaQueues[qi % areaQueues.length];
            if (q.length > 0) interleaved.push(q.shift());
            qi++;
        }

        // Auto-pack into rows based on canvas width
        const rows = [];
        const maxRowWidth = this.width - padding * 2;
        let currentRow = [];
        let currentRowWidth = 0;

        for (const item of interleaved) {
            const neededWidth = currentRow.length > 0 ? item.width + padding : item.width;
            if (currentRowWidth + neededWidth > maxRowWidth && currentRow.length > 0) {
                rows.push(currentRow);
                currentRow = [item];
                currentRowWidth = item.width;
            } else {
                currentRow.push(item);
                currentRowWidth += neededWidth;
            }
        }
        if (currentRow.length > 0) rows.push(currentRow);

        // Position each competence in the grid
        let yOffset = padding;
        const rowHeight = 40; // consistent row height

        for (const row of rows) {
            // Calculate total row width to center it
            let totalWidth = 0;
            for (let i = 0; i < row.length; i++) {
                totalWidth += row[i].width;
                if (i < row.length - 1) totalWidth += padding;
            }

            let xOffset = (this.width - totalWidth) / 2; // center row

            for (const item of row) {
                const isTarget = this.roundConfig.targets.includes(item.id);
                this.activeCompetences.push({
                    id: item.id,
                    competence: item.comp,
                    x: xOffset,
                    y: yOffset,
                    width: item.width,
                    height: item.height,
                    hp: item.config.hits,
                    maxHp: item.config.hits,
                    isTarget,
                    config: item.config,
                    hitFlash: 0,
                    // Grid position tracking (original offset from grid origin)
                    gridOffsetX: xOffset,
                    gridOffsetY: yOffset,
                });
                xOffset += item.width + padding;
            }
            yOffset += rowHeight + padding;
        }

        // Store initial grid origin for movement calculations
        this.gridOriginX = 0;
        this.gridOriginY = 0;
    }

    stop() {
        this.running = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    loop(timestamp) {
        if (!this.running) return;

        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = timestamp;

        this.update();
        this.render();

        this.animFrameId = requestAnimationFrame(ts => this.loop(ts));
    }

    update() {
        // Freeze check
        const isFrozen = this.frozen;
        if (this.frozen) {
            if (performance.now() >= this.freezeEndTime) {
                this.frozen = false;
                if (this.onFreezeChange) this.onFreezeChange(false, 0);
            } else {
                const remaining = Math.ceil((this.freezeEndTime - performance.now()) / 1000);
                if (this.onFreezeChange) this.onFreezeChange(true, remaining);
            }
        }

        // Ammo reload
        if (this.reloading) {
            this.reloadTimer += this.deltaTime * 1000;
            if (this.reloadTimer >= this.reloadTime) {
                this.reloading = false;
                this.ammo = this.maxAmmo;
                this.reloadTimer = 0;
                if (this.onAmmoChange) this.onAmmoChange(this.ammo, this.maxAmmo, this.reloading);
            }
        }

        // Player movement (blocked during freeze)
        if (!this.frozen) {
            const moveSpeed = this.player.speed * this.deltaTime * 60;
            if (this.player.movingLeft) {
                this.player.x -= moveSpeed;
            }
            if (this.player.movingRight) {
                this.player.x += moveSpeed;
            }
            this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
        }

        // These always update even during freeze
        this.updateGridMovement();
        this.updateBullets();
        this.updateEnemyBullets();
        this.updateParticles();
        this.enemyShoot();

        // Player bullets vs competences (only when not frozen)
        if (!this.frozen) {
            this.checkCollisions();
        }

        // Enemy bullets vs player (always checked)
        this.checkEnemyHitsPlayer();

        // Check if any competence passed the bottom
        this.checkPassedBottom();

        // Check game over first (takes priority over round complete)
        if (this.lives <= 0) {
            this.lives = 0;
            this.stop();
            if (this.onGameOver) this.onGameOver(this.score, this.round + 1);
            return;
        }

        // Check round complete (all competences gone and no enemy bullets in flight)
        if (this.activeCompetences.length === 0 && this.bullets.length === 0 && this.enemyBullets.length === 0) {
            this.completeRound();
        }
    }

    updateGridMovement() {
        if (this.activeCompetences.length === 0) return;

        const moveX = this.gridSpeed * this.gridDirection * this.deltaTime * 60;

        // Apply horizontal movement
        this.gridOriginX += moveX;

        // Apply any pending drop
        if (this.dropAmount > 0) {
            const dropStep = Math.min(this.dropAmount, 2 * this.deltaTime * 60);
            this.gridOriginY += dropStep;
            this.dropAmount -= dropStep;
        }

        // Update all competence positions
        for (const c of this.activeCompetences) {
            c.x = c.gridOffsetX + this.gridOriginX;
            c.y = c.gridOffsetY + this.gridOriginY;
        }

        // Check if any competence hit left or right wall
        let hitWall = false;
        for (const c of this.activeCompetences) {
            if (c.x <= 0 && this.gridDirection === -1) {
                hitWall = true;
                break;
            }
            if (c.x + c.width >= this.width && this.gridDirection === 1) {
                hitWall = true;
                break;
            }
        }

        if (hitWall) {
            // Reverse direction and queue a drop
            this.gridDirection *= -1;
            this.dropAmount += 30; // drop 30px on each wall hit
        }
    }

    checkPassedBottom() {
        for (let i = this.activeCompetences.length - 1; i >= 0; i--) {
            const c = this.activeCompetences[i];
            if (c.y + c.height > this.player.y) {
                // Competence reached player level
                if (c.isTarget) {
                    // Target passed — lose life
                    this.lives = Math.max(0, this.lives - 1);
                    this.livesLostThisRound++;
                    if (this.onLivesChange) this.onLivesChange(this.lives);
                    this.showPointPopup(c.x + c.width / 2, this.player.y - 10, '-1 ❤️');
                } else {
                    // Correct pass — bonus
                    this.score += 15;
                    this.passedCorrectly++;
                    if (this.onScoreChange) this.onScoreChange(this.score);
                    this.showPointPopup(c.x + c.width / 2, this.player.y - 10, '+15');
                }
                this.activeCompetences.splice(i, 1);
            }
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y -= b.speed * this.deltaTime * 60;
            if (b.y + b.height < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }

    enemyShoot() {
        if (this.activeCompetences.length === 0) return;

        // Enemy shoot interval from round config, fallback to calculated value
        const interval = this.roundConfig.enemyFireRate || Math.max(600, 2000 - this.round * 120);

        this.enemyShootTimer += this.deltaTime * 1000;
        if (this.enemyShootTimer >= interval) {
            this.enemyShootTimer = 0;

            // Pick a random competence to shoot from (prefer bottom-row ones)
            // Find the bottom-most competences (highest y value)
            let maxY = -Infinity;
            for (const c of this.activeCompetences) {
                if (c.y + c.height > maxY) maxY = c.y + c.height;
            }
            // Get competences near the bottom row (within 50px of max)
            const bottomRow = this.activeCompetences.filter(c => c.y + c.height >= maxY - 50);
            const shooter = bottomRow[Math.floor(Math.random() * bottomRow.length)];

            if (shooter) {
                const bw = 4;
                const bh = 10;
                this.enemyBullets.push({
                    x: shooter.x + shooter.width / 2 - bw / 2,
                    y: shooter.y + shooter.height,
                    width: bw,
                    height: bh,
                    speed: 4 + this.round * 0.3,
                    color: shooter.config.color,
                });
            }
        }
    }

    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.y += b.speed * this.deltaTime * 60;
            if (b.y > this.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    checkEnemyHitsPlayer() {
        if (this.frozen) return; // Can't be hit again while already frozen

        const p = this.player;

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];

            if (b.x < p.x + p.width && b.x + b.width > p.x &&
                b.y < p.y + p.height && b.y + b.height > p.y) {

                // Player is hit! Lose 1 life AND freeze for 3 seconds
                this.lives = Math.max(0, this.lives - 1);
                this.livesLostThisRound++;
                if (this.onLivesChange) this.onLivesChange(this.lives);
                this.showPointPopup(p.x + p.width / 2, p.y - 10, '-1 ❤️');

                this.frozen = true;
                this.freezeEndTime = performance.now() + 3000;
                if (this.onFreezeChange) this.onFreezeChange(true, 3);

                // Hit particles on player
                this.createParticles(p.x + p.width / 2, p.y + p.height / 2, b.color, 10);

                // Remove the bullet
                this.enemyBullets.splice(i, 1);
                break; // Only one hit per frame
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * this.deltaTime * 60;
            p.y += p.vy * this.deltaTime * 60;
            p.vy += 0.1;
            p.life -= this.deltaTime;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const b = this.bullets[bi];
            let hit = false;

            for (let ci = this.activeCompetences.length - 1; ci >= 0; ci--) {
                const c = this.activeCompetences[ci];

                if (b.x < c.x + c.width && b.x + b.width > c.x &&
                    b.y < c.y + c.height && b.y + b.height > c.y) {

                    // Hit!
                    c.hp--;
                    c.hitFlash = 1;
                    this.shotsHit++;
                    hit = true;

                    // Create hit particles
                    this.createParticles(b.x, b.y, c.config.color, 5);

                    if (c.hp <= 0) {
                        // Destroyed
                        if (c.isTarget) {
                            // Correct hit
                            this.score += c.config.points;
                            this.targetsDestroyed++;
                            this.targetsRemaining.delete(c.id);
                            if (this.onTargetUpdate) this.onTargetUpdate(this.roundConfig.targets, this.targetsRemaining);
                            this.showPointPopup(c.x + c.width / 2, c.y, `+${c.config.points}`);
                        } else {
                            // Wrong hit
                            this.score -= 50;
                            this.wrongHits++;
                            this.showPointPopup(c.x + c.width / 2, c.y, '-50');
                        }
                        if (this.onScoreChange) this.onScoreChange(this.score);

                        // Explosion particles
                        this.createParticles(c.x + c.width / 2, c.y + c.height / 2, c.config.color, 15);

                        this.activeCompetences.splice(ci, 1);
                    }

                    this.bullets.splice(bi, 1);
                    break;
                }
            }
        }
    }

    shoot() {
        if (this.frozen || !this.running) return;
        if (this.reloading || this.ammo <= 0) return;

        const bulletWidth = 4;
        const bulletHeight = 12;

        this.bullets.push({
            x: this.player.x + this.player.width / 2 - bulletWidth / 2,
            y: this.player.y - bulletHeight,
            width: bulletWidth,
            height: bulletHeight,
            speed: 8,
        });

        this.shotsFired++;
        this.ammo--;

        if (this.onAmmoChange) this.onAmmoChange(this.ammo, this.maxAmmo, this.reloading);

        // Start reloading when magazine is empty
        if (this.ammo <= 0) {
            this.reloading = true;
            this.reloadTimer = 0;
            if (this.onAmmoChange) this.onAmmoChange(this.ammo, this.maxAmmo, this.reloading);
        }
    }

    completeRound() {
        this.stop();

        // Calculate stats
        const totalTargets = this.roundConfig.targets.length;
        const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
        const missedShots = this.shotsFired - this.shotsHit;

        // Missed shots penalty
        this.score -= missedShots * 5;

        // Calculate bonuses
        const bonuses = [];

        if (this.livesLostThisRound === 0) {
            bonuses.push({ key: 'bonusAllLives', points: 200 });
            this.score += 200;
        } else if (this.livesLostThisRound <= 1) {
            bonuses.push({ key: 'bonusHalfLives', points: 100 });
            this.score += 100;
        }

        if (accuracy > 80) {
            const accuracyBonusPoints = Math.floor((accuracy - 80) / 5) * 25;
            if (accuracyBonusPoints > 0) {
                bonuses.push({ key: 'bonusAccuracy', points: accuracyBonusPoints });
                this.score += accuracyBonusPoints;
            }
        }

        if (this.onScoreChange) this.onScoreChange(this.score);

        const stats = {
            score: this.score,
            accuracy,
            targetsDestroyed: this.targetsDestroyed,
            totalTargets,
            passedCorrectly: this.passedCorrectly,
            missedShots,
            livesRemaining: this.lives,
            bonuses,
            round: this.round + 1,
        };

        if (this.onRoundComplete) this.onRoundComplete(stats);
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                color,
                size: 2 + Math.random() * 3,
                life: 0.5 + Math.random() * 0.5,
            });
        }
    }

    showPointPopup(x, y, text) {
        const popup = document.createElement('div');
        popup.className = 'point-popup ' + (text.startsWith('+') ? 'positive' : 'negative');
        popup.textContent = text;

        // Position relative to game screen
        const gameScreen = document.getElementById('screen-game');
        const canvasRect = this.canvas.getBoundingClientRect();
        popup.style.left = (canvasRect.left + x) + 'px';
        popup.style.top = (canvasRect.top + y) + 'px';

        gameScreen.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    // ========== RENDERING ==========
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Background stars
        this.renderStars();

        // Competences
        this.renderCompetences();

        // Player bullets
        this.renderBullets();

        // Enemy bullets
        this.renderEnemyBullets();

        // Player
        this.renderPlayer();

        // Ammo indicator
        this.renderAmmo();

        // Particles
        this.renderParticles();

        // Freeze overlay on canvas
        if (this.frozen) {
            ctx.fillStyle = 'rgba(0, 100, 200, 0.08)';
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    renderStars() {
        const ctx = this.ctx;
        if (!this._stars) {
            this._stars = [];
            for (let i = 0; i < 50; i++) {
                this._stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: Math.random() * 1.5 + 0.5,
                    alpha: Math.random() * 0.5 + 0.2,
                });
            }
        }
        for (const s of this._stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
    }

    renderCompetences() {
        const ctx = this.ctx;

        for (const c of this.activeCompetences) {
            const config = c.config;
            const flash = c.hitFlash > 0 ? c.hitFlash : 0;

            // Update hitFlash
            if (c.hitFlash > 0) {
                c.hitFlash -= this.deltaTime * 4;
            }

            // Block background
            ctx.fillStyle = flash > 0.5 ? '#FFFFFF' : config.color;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.roundRect(c.x, c.y, c.width, c.height, 4);
            ctx.fill();
            ctx.globalAlpha = 1;

            // HP bar (if multi-hit)
            if (c.maxHp > 1) {
                const barWidth = c.width - 8;
                const barHeight = 3;
                const barX = c.x + 4;
                const barY = c.y + c.height - 6;

                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(barX, barY, barWidth * (c.hp / c.maxHp), barHeight);
            }

            // Competence name
            const fontSize = 11 * config.sizeMultiplier + 2;
            ctx.font = `600 ${fontSize}px 'Open Sans', sans-serif`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textY = c.maxHp > 1 ? c.y + (c.height - 6) / 2 : c.y + c.height / 2;
            ctx.fillText(getCompetenceName(c.competence), c.x + c.width / 2, textY, c.width - 8);

            // Target indicator (crosshair)
            if (c.isTarget) {
                const cx = c.x + c.width - 10;
                const cy = c.y + 10;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.5;

                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - 9, cy);
                ctx.lineTo(cx + 9, cy);
                ctx.moveTo(cx, cy - 9);
                ctx.lineTo(cx, cy + 9);
                ctx.stroke();
            }
        }
    }

    renderBullets() {
        const ctx = this.ctx;

        for (const b of this.bullets) {
            // Soft glow (no shadowBlur — too expensive on iOS)
            ctx.fillStyle = 'rgba(227, 6, 19, 0.3)';
            ctx.beginPath();
            ctx.roundRect(b.x - 2, b.y - 1, b.width + 4, b.height + 2, 3);
            ctx.fill();

            // Bullet core
            ctx.fillStyle = '#E30613';
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.width, b.height, 2);
            ctx.fill();
        }
    }

    renderEnemyBullets() {
        const ctx = this.ctx;

        for (const b of this.enemyBullets) {
            const color = b.color || '#FF9800';

            // Soft glow (no shadowBlur — too expensive on iOS)
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(b.x - 2, b.y - 1, b.width + 4, b.height + 2, 3);
            ctx.fill();

            // Bullet core
            ctx.globalAlpha = 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.width, b.height, 2);
            ctx.fill();
        }
    }

    renderPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        const cx = p.x + p.width / 2;

        if (this.frozen) {
            ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.fillStyle = this.gender === 'female' ? '#E30613' : '#2C3E50';
        ctx.beginPath();
        ctx.roundRect(p.x + 5, p.y + 18, p.width - 10, 25, 3);
        ctx.fill();

        // Head
        ctx.fillStyle = '#FFD5A0';
        ctx.beginPath();
        ctx.arc(cx, p.y + 12, 10, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#4A3728';
        if (this.gender === 'female') {
            ctx.beginPath();
            ctx.arc(cx, p.y + 8, 11, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(cx - 11, p.y + 6, 3, 14);
            ctx.fillRect(cx + 8, p.y + 6, 3, 14);
        } else {
            ctx.beginPath();
            ctx.arc(cx, p.y + 7, 10, Math.PI, 0);
            ctx.fill();
        }

        // Eyes
        ctx.fillStyle = '#333';
        ctx.fillRect(cx - 4, p.y + 11, 2, 2);
        ctx.fillRect(cx + 2, p.y + 11, 2, 2);

        // Gun barrel
        ctx.fillStyle = '#888';
        ctx.fillRect(cx - 2, p.y, 4, 18);

        ctx.globalAlpha = 1;
    }

    renderParticles() {
        const ctx = this.ctx;
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    renderAmmo() {
        const ctx = this.ctx;
        const bulletW = 4;
        const bulletH = 12;
        const gap = 3;
        const totalWidth = this.maxAmmo * bulletW + (this.maxAmmo - 1) * gap;
        const startX = this.player.x + this.player.width + 8;
        const startY = this.player.y + this.player.height / 2 - (this.maxAmmo * bulletH + (this.maxAmmo - 1) * gap) / 2;

        for (let i = 0; i < this.maxAmmo; i++) {
            // Draw from bottom to top (first bullet at bottom)
            const y = startY + (this.maxAmmo - 1 - i) * (bulletH + gap);

            if (this.reloading) {
                // Show reload progress: fill bullets based on reload progress
                const progress = this.reloadTimer / this.reloadTime;
                const bulletsToShow = Math.floor(progress * this.maxAmmo);
                if (i < bulletsToShow) {
                    // Reloaded bullet (yellow flash)
                    ctx.fillStyle = '#FFD700';
                    ctx.globalAlpha = 0.9;
                } else {
                    // Empty slot
                    ctx.fillStyle = '#555';
                    ctx.globalAlpha = 0.4;
                }
            } else if (i < this.ammo) {
                // Loaded bullet
                ctx.fillStyle = '#E30613';
                ctx.globalAlpha = 0.9;
            } else {
                // Empty slot
                ctx.fillStyle = '#555';
                ctx.globalAlpha = 0.4;
            }

            ctx.beginPath();
            ctx.roundRect(startX, y, bulletW, bulletH, 1);
            ctx.fill();
        }

        // Reload text
        if (this.reloading) {
            ctx.globalAlpha = 0.6 + Math.sin(performance.now() / 200) * 0.4;
            ctx.fillStyle = '#FFD700';
            ctx.font = "bold 9px 'Exo 2', sans-serif";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('⟳', startX + bulletW + 4, this.player.y + this.player.height / 2);
        }

        ctx.globalAlpha = 1;
    }
}
