// ========== APP CONTROLLER ==========
(function () {
    'use strict';

    // ========== STATE ==========
    let game = null;
    let selectedGender = null;
    let currentRound = 0;
    let tutorialShown = localStorage.getItem('ipma_tutorial_shown') === 'true';

    // ========== SCREENS ==========
    const screens = {
        menu: document.getElementById('screen-menu'),
        character: document.getElementById('screen-character'),
        tutorial: document.getElementById('screen-tutorial'),
        game: document.getElementById('screen-game'),
        stats: document.getElementById('screen-stats'),
        gameover: document.getElementById('screen-gameover'),
        leaderboard: document.getElementById('screen-leaderboard'),
    };

    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // ========== INIT ==========
    function init() {
        // Detect mobile and add class to body
        if (isMobileDevice()) {
            document.body.classList.add('is-mobile');
        }

        setLanguage(currentLang);
        bindMenuEvents();
        bindCharacterEvents();
        bindTutorialEvents();
        bindGameControls();
        bindStatsEvents();
        bindGameOverEvents();
        bindLeaderboardEvents();

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (game && game.running) {
                    game.resize();
                }
            }, 150);
        });
    }

    // ========== MENU ==========
    function bindMenuEvents() {
        document.getElementById('btn-play').addEventListener('click', () => {
            showScreen('character');
        });

        document.getElementById('btn-top10').addEventListener('click', () => {
            renderLeaderboard();
            showScreen('leaderboard');
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setLanguage(btn.dataset.lang);
            });
        });
    }

    // ========== CHARACTER SELECTION ==========
    function bindCharacterEvents() {
        const options = document.querySelectorAll('.character-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                selectedGender = opt.dataset.gender;

                // Auto-advance after brief delay
                setTimeout(() => {
                    if (!tutorialShown) {
                        showScreen('tutorial');
                    } else {
                        startNewGame();
                    }
                }, 300);
            });
        });

        document.getElementById('btn-back-char').addEventListener('click', () => {
            showScreen('menu');
        });
    }

    // ========== TUTORIAL ==========
    function bindTutorialEvents() {
        document.getElementById('btn-start-game').addEventListener('click', () => {
            tutorialShown = true;
            localStorage.setItem('ipma_tutorial_shown', 'true');
            startNewGame();
        });
    }

    // ========== GAME ==========
    function startNewGame() {
        currentRound = 0;
        const canvas = document.getElementById('game-canvas');
        game = new Game(canvas, selectedGender || 'male');

        game.onScoreChange = (score) => {
            document.getElementById('hud-score').textContent = score;
        };

        game.onLivesChange = (lives) => {
            updateLivesDisplay(lives);
        };

        game.onFreezeChange = (frozen, seconds) => {
            const overlay = document.getElementById('freeze-overlay');
            if (frozen) {
                overlay.classList.remove('hidden');
                document.getElementById('freeze-timer').textContent = seconds;
            } else {
                overlay.classList.add('hidden');
            }
        };

        game.onAmmoChange = (ammo, maxAmmo, reloading) => {
            updateAmmoDisplay(ammo, maxAmmo, reloading);
        };

        game.onTargetUpdate = (allTargets, remaining) => {
            updateTargetsBar(allTargets, remaining);
        };

        game.onRoundComplete = (stats) => {
            showRoundStats(stats);
        };

        game.onGameOver = (score, round) => {
            showGameOver(score, round);
        };

        showScreen('game');

        // Wait for screen visibility + font load before building grid
        requestAnimationFrame(() => {
            game.resize();
            updateRoundDisplay();
            updateLivesDisplay(3);
            document.getElementById('hud-score').textContent = '0';
            updateAmmoDisplay(5, 5, false);
            (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
                game.startRound(currentRound);
            });
        });
    }

    function updateRoundDisplay() {
        document.getElementById('hud-round').textContent = `R${currentRound + 1}`;
    }

    function updateLivesDisplay(lives) {
        const container = document.getElementById('hud-lives');
        container.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart' + (i >= lives ? ' lost' : '');
            heart.textContent = '❤️';
            container.appendChild(heart);
        }
    }

    function updateAmmoDisplay(ammo, maxAmmo, reloading) {
        const el = document.getElementById('hud-ammo');
        let display = '';
        for (let i = 0; i < maxAmmo; i++) {
            display += i < ammo ? '●' : '○';
        }
        el.textContent = display;
        if (reloading) {
            el.classList.add('reloading');
        } else {
            el.classList.remove('reloading');
        }
    }

    function updateTargetsBar(allTargets, remaining) {
        const list = document.getElementById('targets-list');
        list.innerHTML = '';
        allTargets.forEach(id => {
            const comp = getCompetenceById(id);
            if (!comp) return;
            const span = document.createElement('span');
            span.textContent = getCompetenceName(comp);
            if (!remaining.has(id)) {
                span.className = 'target-done';
            }
            list.appendChild(span);
            list.appendChild(document.createTextNode(' | '));
        });
        // Remove trailing separator
        if (list.lastChild) list.removeChild(list.lastChild);
    }

    // ========== GAME CONTROLS ==========
    function bindGameControls() {
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnShoot = document.getElementById('btn-shoot');

        // Touch / Mouse events for movement buttons
        function addHoldEvents(btn, onDown, onUp) {
            const start = (e) => { e.preventDefault(); onDown(); };
            const end = (e) => { e.preventDefault(); onUp(); };

            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        }

        addHoldEvents(btnLeft,
            () => { if (game) game.player.movingLeft = true; },
            () => { if (game) game.player.movingLeft = false; }
        );

        addHoldEvents(btnRight,
            () => { if (game) game.player.movingRight = true; },
            () => { if (game) game.player.movingRight = false; }
        );

        let shootUsedTouch = false;
        btnShoot.addEventListener('touchstart', (e) => {
            e.preventDefault();
            shootUsedTouch = true;
            if (game) game.shoot();
        }, { passive: false });

        btnShoot.addEventListener('mousedown', (e) => {
            if (shootUsedTouch) { shootUsedTouch = false; return; }
            e.preventDefault();
            if (game) game.shoot();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!game || !game.running) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') game.player.movingLeft = true;
            if (e.key === 'ArrowRight' || e.key === 'd') game.player.movingRight = true;
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                game.shoot();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!game) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') game.player.movingLeft = false;
            if (e.key === 'ArrowRight' || e.key === 'd') game.player.movingRight = false;
        });
    }

    // ========== ROUND STATS ==========
    function showRoundStats(stats) {
        document.getElementById('stat-points').textContent = stats.score;
        document.getElementById('stat-accuracy').textContent = stats.accuracy + '%';
        document.getElementById('stat-targets').textContent = `${stats.targetsDestroyed}/${stats.totalTargets}`;
        document.getElementById('stat-passes').textContent = stats.passedCorrectly;
        document.getElementById('stat-missed').textContent = stats.missedShots;
        document.getElementById('stat-lives').textContent = stats.livesRemaining;

        const bonusList = document.getElementById('bonuses-list');
        bonusList.innerHTML = '';
        const bonusSection = document.getElementById('bonuses-section');

        if (stats.bonuses.length > 0) {
            bonusSection.classList.remove('hidden');
            stats.bonuses.forEach(b => {
                const item = document.createElement('div');
                item.className = 'bonus-item';
                item.innerHTML = `<span>${t(b.key)}</span><span class="bonus-points">+${b.points}</span>`;
                bonusList.appendChild(item);
            });
        } else {
            bonusSection.classList.add('hidden');
        }

        showScreen('stats');
    }

    function bindStatsEvents() {
        document.getElementById('btn-next-round').addEventListener('click', () => {
            if (!game || game.lives <= 0) return;
            currentRound++;
            showScreen('game');
            requestAnimationFrame(() => {
                game.resize();
                updateRoundDisplay();
                updateLivesDisplay(game.lives);
                updateAmmoDisplay(5, 5, false);
                game.startRound(currentRound);
            });
        });

        document.getElementById('btn-share').addEventListener('click', () => {
            shareScore();
        });
    }

    // ========== GAME OVER ==========
    let finalScore = 0;
    let finalRound = 1;

    function showGameOver(score, round) {
        finalScore = score;
        finalRound = round;
        document.getElementById('final-score-value').textContent = score;
        document.getElementById('nickname-input').value = localStorage.getItem('ipma_nickname') || '';
        showScreen('gameover');
    }

    function bindGameOverEvents() {
        document.getElementById('btn-save-score').addEventListener('click', () => {
            const nickname = document.getElementById('nickname-input').value.trim() || 'ANON';
            localStorage.setItem('ipma_nickname', nickname);
            saveToLeaderboard(nickname, finalScore, finalRound);
            renderLeaderboard();
            showScreen('leaderboard');
        });

        document.getElementById('btn-play-again').addEventListener('click', () => {
            showScreen('character');
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            showScreen('menu');
        });
    }

    // ========== LEADERBOARD ==========
    function getLeaderboard() {
        try {
            return JSON.parse(localStorage.getItem('ipma_leaderboard') || '[]');
        } catch {
            return [];
        }
    }

    function saveToLeaderboard(name, score, round) {
        const lb = getLeaderboard();
        lb.push({ name, score, round, date: Date.now() });
        lb.sort((a, b) => b.score - a.score);
        const top10 = lb.slice(0, 10);
        localStorage.setItem('ipma_leaderboard', JSON.stringify(top10));
    }

    function renderLeaderboard() {
        const lb = getLeaderboard();
        const entries = document.getElementById('lb-entries');
        const empty = document.getElementById('lb-empty');

        entries.innerHTML = '';

        if (lb.length === 0) {
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');

        lb.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'lb-entry';
            row.innerHTML = `
                <span class="lb-rank">${i + 1}</span>
                <span class="lb-name">${escapeHtml(entry.name)}</span>
                <span class="lb-score">${entry.score}</span>
                <span class="lb-round">R${entry.round}</span>
            `;
            entries.appendChild(row);
        });
    }

    function bindLeaderboardEvents() {
        document.getElementById('btn-back-lb').addEventListener('click', () => {
            showScreen('menu');
        });
    }

    // ========== SHARING ==========
    function shareScore() {
        const score = game ? game.score : 0;
        const round = currentRound + 1;
        const text = `🎮 IPMA Competence Invaders\n🏆 Score: ${score}\n📊 ${t('round_label')}: ${round}\n\n#IPMA #ProjectManagement #CompetenceInvaders`;

        if (navigator.share) {
            navigator.share({ title: 'IPMA Competence Invaders', text }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert(t('copied'));
            }).catch(() => {
                alert(t('shareFailed'));
            });
        }
    }

    // ========== UTILITIES ==========
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ========== BOOT ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
