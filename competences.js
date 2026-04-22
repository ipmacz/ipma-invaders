// ========== IPMA ICB4 COMPETENCES ==========

const COMPETENCE_AREAS = {
    PERSPECTIVE: 'perspective',
    PEOPLE: 'people',
    PRACTICE: 'practice',
};

const AREA_CONFIG = {
    [COMPETENCE_AREAS.PERSPECTIVE]: {
        hits: 3,
        points: 30,
        color: '#E30613',
        sizeMultiplier: 0.7,  // smallest
    },
    [COMPETENCE_AREAS.PEOPLE]: {
        hits: 1,
        points: 10,
        color: '#4CAF50',
        sizeMultiplier: 1.0,  // largest
    },
    [COMPETENCE_AREAS.PRACTICE]: {
        hits: 2,
        points: 20,
        color: '#FF9800',
        sizeMultiplier: 0.85, // medium
    },
};

const COMPETENCES = [
    // Row 1: PERSPECTIVE (10)
    { id: 'strategy', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Strategy', cz: 'Strategie' },
    { id: 'governance', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Governance, structures and processes', cz: 'Governance, struktury a procesy' },
    { id: 'compliance', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Compliance, standards and regulations', cz: 'Compliance, standardy a regulace' },
    { id: 'power', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Power and interest', cz: 'Moc a zájem' },
    { id: 'culture', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Culture and values', cz: 'Kultura a hodnoty' },
    { id: 'design', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Design', cz: 'Design' },
    { id: 'requirements', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Requirements and objectives', cz: 'Požadavky a cíle' },
    { id: 'scope', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Scope', cz: 'Rozsah' },
    { id: 'time', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Time', cz: 'Čas' },
    { id: 'organisation', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Organisation and information', cz: 'Organizace a informace' },

    // Row 2: PRACTICE (9) — middle row for symmetric 10-9-10 layout
    { id: 'integrity', area: COMPETENCE_AREAS.PRACTICE, en: 'Personal integrity and reliability', cz: 'Osobní integrita a spolehlivost' },
    { id: 'communication', area: COMPETENCE_AREAS.PRACTICE, en: 'Personal communication', cz: 'Osobní komunikace' },
    { id: 'relations', area: COMPETENCE_AREAS.PRACTICE, en: 'Relations and engagement', cz: 'Vztahy a angažovanost' },
    { id: 'leadership', area: COMPETENCE_AREAS.PRACTICE, en: 'Leadership', cz: 'Vedení' },
    { id: 'teamwork', area: COMPETENCE_AREAS.PRACTICE, en: 'Teamwork', cz: 'Týmová práce' },
    { id: 'conflict', area: COMPETENCE_AREAS.PRACTICE, en: 'Conflict and crisis', cz: 'Konflikt a krize' },
    { id: 'resourcefulness', area: COMPETENCE_AREAS.PRACTICE, en: 'Resourcefulness', cz: 'Důvtip' },
    { id: 'negotiation', area: COMPETENCE_AREAS.PRACTICE, en: 'Negotiation', cz: 'Vyjednávání' },
    { id: 'results', area: COMPETENCE_AREAS.PRACTICE, en: 'Results orientation', cz: 'Orientace na výsledky' },

    // Row 3: PEOPLE (10)
    { id: 'quality', area: COMPETENCE_AREAS.PEOPLE, en: 'Quality', cz: 'Kvalita' },
    { id: 'finance', area: COMPETENCE_AREAS.PEOPLE, en: 'Finance', cz: 'Finance' },
    { id: 'resources', area: COMPETENCE_AREAS.PEOPLE, en: 'Resources', cz: 'Zdroje' },
    { id: 'procurement', area: COMPETENCE_AREAS.PEOPLE, en: 'Procurement', cz: 'Obstarávání' },
    { id: 'plancontrol', area: COMPETENCE_AREAS.PEOPLE, en: 'Plan and control', cz: 'Plánování a kontrola' },
    { id: 'risk', area: COMPETENCE_AREAS.PEOPLE, en: 'Risk and opportunity', cz: 'Riziko a příležitost' },
    { id: 'stakeholders', area: COMPETENCE_AREAS.PEOPLE, en: 'Stakeholders', cz: 'Stakeholdeři' },
    { id: 'change', area: COMPETENCE_AREAS.PEOPLE, en: 'Change and transformation', cz: 'Změna a transformace' },
    { id: 'selectbalance', area: COMPETENCE_AREAS.PEOPLE, en: 'Select and balance', cz: 'Výběr a vyvážení' },
    { id: 'selfreflection', area: COMPETENCE_AREAS.PEOPLE, en: 'Self-reflection and self-management', cz: 'Sebereflexe a sebeřízení' },
];

// Get competence display name by current language
function getCompetenceName(competence) {
    return competence[currentLang] || competence.en;
}

// ========== ROUND DEFINITIONS ==========
// Each round defines which competences appear and which are targets (must be shot)
// Difficulty levers: speed (horizontal+drop), enemyFireRate (ms), target/distractor ratio
//
// Phase 1 (R1–R3):  Growing pool, all competences are targets — learn what exists
// Phase 2 (R4–R7):  Full pool with selective targets — must distinguish targets from safe ones
// Phase 3 (R8–R10): Expert speed + fire rate

const ALL_IDS = COMPETENCES.map(c => c.id);
const PERSPECTIVE_IDS = COMPETENCES.filter(c => c.area === COMPETENCE_AREAS.PERSPECTIVE).map(c => c.id);
const PRACTICE_IDS = COMPETENCES.filter(c => c.area === COMPETENCE_AREAS.PRACTICE).map(c => c.id);
const PEOPLE_IDS = COMPETENCES.filter(c => c.area === COMPETENCE_AREAS.PEOPLE).map(c => c.id);

// Pick n competences spread evenly across all three areas
function pickMixed(n) {
    const pools = [PERSPECTIVE_IDS, PRACTICE_IDS, PEOPLE_IDS].map(a => [...a]);
    const result = [];
    let i = 0;
    while (result.length < n) {
        const pool = pools[i % 3];
        if (pool.length > 0) result.push(pool.shift());
        i++;
    }
    return result;
}

const ROUNDS = [
    // === PHASE 1: GROWING POOL — all on screen are targets ===

    // Round 1: 10 competences, all targets, slow intro
    { competences: pickMixed(10), targets: ALL_IDS, speed: 0.3, enemyFireRate: 4000 },

    // Round 2: 13 competences, all targets
    { competences: pickMixed(13), targets: ALL_IDS, speed: 0.42, enemyFireRate: 3400 },

    // Round 3: 16 competences, all targets
    { competences: pickMixed(16), targets: ALL_IDS, speed: 0.54, enemyFireRate: 2800 },

    // === PHASE 2: SELECTIVE TARGETING — distractors appear ===

    // Round 4: 19 competences, 10 targets
    {
        competences: pickMixed(19),
        targets: ['strategy', 'integrity', 'quality', 'governance', 'leadership', 'finance', 'compliance', 'teamwork', 'resources', 'power'],
        speed: 0.65,
        enemyFireRate: 2400,
    },
    // Round 5: 22 competences, 11 targets
    {
        competences: pickMixed(22),
        targets: ['culture', 'communication', 'procurement', 'design', 'conflict', 'plancontrol', 'requirements', 'negotiation', 'risk', 'scope', 'results'],
        speed: 0.76,
        enemyFireRate: 2000,
    },
    // Round 6: 25 competences, 12 targets — Perspective tiles harder (3 hits)
    {
        competences: pickMixed(25),
        targets: ['strategy', 'governance', 'compliance', 'power', 'culture', 'design', 'integrity', 'leadership', 'quality', 'finance', 'risk', 'change'],
        speed: 0.87,
        enemyFireRate: 1700,
    },
    // Round 7: all 29, 13 targets
    {
        competences: ALL_IDS,
        targets: ['requirements', 'scope', 'time', 'organisation', 'communication', 'relations', 'teamwork', 'conflict', 'negotiation', 'results', 'resources', 'plancontrol', 'stakeholders'],
        speed: 0.95,
        enemyFireRate: 1400,
    },

    // === PHASE 3: EXPERT ===

    // Round 8: all 29, 12 targets, fast
    {
        competences: ALL_IDS,
        targets: ['strategy', 'compliance', 'culture', 'time', 'integrity', 'conflict', 'negotiation', 'results', 'quality', 'plancontrol', 'change', 'selectbalance'],
        speed: 1.1,
        enemyFireRate: 1100,
    },
    // Round 9: all 29, only Practice targets, very fast
    {
        competences: ALL_IDS,
        targets: PRACTICE_IDS,
        speed: 1.2,
        enemyFireRate: 900,
    },
    // Round 10: Final boss — all 29, only Perspective (3 hits each), max difficulty
    {
        competences: ALL_IDS,
        targets: PERSPECTIVE_IDS,
        speed: 1.35,
        enemyFireRate: 750,
    },
];

function getCompetenceById(id) {
    return COMPETENCES.find(c => c.id === id);
}

function getRoundConfig(roundIndex) {
    if (roundIndex < ROUNDS.length) {
        return ROUNDS[roundIndex];
    }
    // Generate endless rounds beyond the defined 10
    const numCompetences = 29; // always all
    const shuffled = [...ALL_IDS].sort(() => Math.random() - 0.5);
    const numTargets = Math.max(5, Math.floor(numCompetences * 0.4));
    const targets = shuffled.slice(0, numTargets);
    const extra = roundIndex - ROUNDS.length;
    return {
        competences: shuffled,
        targets,
        speed: 1.3 + extra * 0.1,
        enemyFireRate: Math.max(500, 800 - extra * 50),
    };
}
