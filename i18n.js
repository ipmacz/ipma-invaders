// ========== INTERNATIONALIZATION ==========
const I18N = {
    en: {
        play: 'PLAY',
        top10: 'TOP 10',
        selectCharacter: 'SELECT YOUR PM',
        male: 'Male PM',
        female: 'Female PM',
        back: 'BACK',
        tutorial: 'HOW TO PLAY',
        tutorialShoot: 'Shoot the TARGET competences marked with a crosshair',
        tutorialPass: 'Let SAFE competences pass through — earn bonus points!',
        tutorialWrong: 'Shooting wrong competences costs -50 points',
        tutorialFreeze: 'Competences shoot back! Getting hit freezes you for 3 seconds and costs a life',
        tutorialLives: 'You have 3 lives — lose one if hit or if a target passes through',
        tutorialAmmo: 'You have 5 shots per magazine — wait for a full reload when empty',
        startGame: 'START GAME',
        targets: 'TARGETS:',
        frozen: 'FROZEN!',
        roundComplete: 'ROUND COMPLETE!',
        totalPoints: 'Total Points',
        accuracy: 'Accuracy',
        targetsHit: 'Targets Hit',
        correctPasses: 'Correct Passes',
        missedShots: 'Missed Shots',
        livesRemaining: 'Lives Remaining',
        bonuses: 'BONUSES',
        nextRound: 'NEXT ROUND',
        share: 'SHARE',
        gameOver: 'GAME OVER',
        finalScore: 'Final Score',
        enterNickname: 'Enter your nickname:',
        saveScore: 'SAVE SCORE',
        playAgain: 'PLAY AGAIN',
        mainMenu: 'MAIN MENU',
        leaderboard: 'TOP 10',
        name: 'Name',
        score: 'Score',
        round: 'Round',
        noScores: 'No scores yet. Be the first!',
        bonusAllLives: '100% Lives Bonus',
        bonusHalfLives: 'Survival Bonus',
        bonusAccuracy: 'Accuracy Bonus',
        copied: 'Score copied to clipboard!',
        shareFailed: 'Could not share. Try again.',
        round_label: 'Round',
    },
    cz: {
        play: 'HRÁT',
        top10: 'TOP 10',
        selectCharacter: 'VYBERTE SVÉHO PM',
        male: 'Muž PM',
        female: 'Žena PM',
        back: 'ZPĚT',
        tutorial: 'JAK HRÁT',
        tutorialShoot: 'Sestřelte CÍLOVÉ kompetence označené zaměřovačem',
        tutorialPass: 'Nechte BEZPEČNÉ kompetence projít — získáte bonusové body!',
        tutorialWrong: 'Sestřelení špatné kompetence stojí -50 bodů',
        tutorialFreeze: 'Kompetence střílí zpět! Zásah vás zmrazí na 3 sekundy a stojí život',
        tutorialLives: 'Máte 3 životy — ztratíte jeden při zásahu nebo když cíl projde',
        tutorialAmmo: 'Máte 5 nábojů v zásobníku — po vyprázdnění čekejte na nabití',
        startGame: 'ZAČÍT HRU',
        targets: 'CÍLE:',
        frozen: 'ZMRAZENO!',
        roundComplete: 'KOLO DOKONČENO!',
        totalPoints: 'Celkové body',
        accuracy: 'Přesnost',
        targetsHit: 'Zasažené cíle',
        correctPasses: 'Správné průchody',
        missedShots: 'Minuté střely',
        livesRemaining: 'Zbývající životy',
        bonuses: 'BONUSY',
        nextRound: 'DALŠÍ KOLO',
        share: 'SDÍLET',
        gameOver: 'KONEC HRY',
        finalScore: 'Finální skóre',
        enterNickname: 'Zadejte přezdívku:',
        saveScore: 'ULOŽIT SKÓRE',
        playAgain: 'HRÁT ZNOVU',
        mainMenu: 'HLAVNÍ MENU',
        leaderboard: 'TOP 10',
        name: 'Jméno',
        score: 'Skóre',
        round: 'Kolo',
        noScores: 'Zatím žádné skóre. Buďte první!',
        bonusAllLives: 'Bonus 100% životů',
        bonusHalfLives: 'Bonus přežití',
        bonusAccuracy: 'Bonus přesnosti',
        copied: 'Skóre zkopírováno!',
        shareFailed: 'Sdílení se nezdařilo.',
        round_label: 'Kolo',
    }
};

let currentLang = localStorage.getItem('ipma_lang') || 'en';

function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('ipma_lang', lang);

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT') {
            el.placeholder = t(key);
        } else {
            el.textContent = t(key);
        }
    });

    // Update lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}
