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
// Difficulty levers: speed, enemyFireRate (ms between enemy shots), target/distractor ratio
//
// Rounds 1-3:  All 29 competences, ALL are targets (learn to shoot everything)
// Rounds 4-10: Selective targets + distractors (must distinguish targets from safe ones)

const ALL_IDS = COMPETENCES.map(c => c.id);
const PERSPECTIVE_IDS = COMPETENCES.filter(c => c.area === COMPETENCE_AREAS.PERSPECTIVE).map(c => c.id);
const PRACTICE_IDS = COMPETENCES.filter(c => c.area === COMPETENCE_AREAS.PRACTICE).map(c => c.id);
const PEOPLE_IDS = COMPETENCES.filter(c => c.area === COMPETENCE_AREAS.PEOPLE).map(c => c.id);

const ROUNDS = [
    // === PHASE 1: LEARN THE COMPETENCES (all targets) ===

    // Round 1: Gentle intro — all 29, slow, enemies barely shoot
    {
        competences: ALL_IDS,
        targets: ALL_IDS,
        speed: 0.35,
        enemyFireRate: 3500,
    },
    // Round 2: A bit faster, enemies wake up
    {
        competences: ALL_IDS,
        targets: ALL_IDS,
        speed: 0.5,
        enemyFireRate: 2800,
    },
    // Round 3: Full speed intro — learn to dodge
    {
        competences: ALL_IDS,
        targets: ALL_IDS,
        speed: 0.65,
        enemyFireRate: 2200,
    },

    // === PHASE 2: SELECTIVE TARGETING (shoot targets, avoid distractors) ===

    // Round 4: People only — 6 targets among 10 (easy selection)
    {
        competences: PEOPLE_IDS,
        targets: ['quality', 'finance', 'resources', 'procurement', 'plancontrol', 'risk'],
        speed: 0.6,
        enemyFireRate: 2400,
    },
    // Round 5: Practice only — 5 targets among 9
    {
        competences: PRACTICE_IDS,
        targets: ['integrity', 'communication', 'leadership', 'teamwork', 'conflict'],
        speed: 0.7,
        enemyFireRate: 2000,
    },
    // Round 6: Mix People + Practice — 7 targets among 15 distractors
    {
        competences: [...PRACTICE_IDS, ...PEOPLE_IDS.slice(0, 6)],
        targets: ['relations', 'negotiation', 'results', 'resourcefulness', 'quality', 'stakeholders', 'change'],
        speed: 0.75,
        enemyFireRate: 1800,
    },
    // Round 7: Introduce Perspective — hard targets (3 hits each) among easier distractors
    {
        competences: [...PERSPECTIVE_IDS.slice(0, 5), ...PEOPLE_IDS.slice(0, 5), ...PRACTICE_IDS.slice(0, 4)],
        targets: ['strategy', 'governance', 'compliance', 'power', 'culture', 'conflict', 'risk'],
        speed: 0.85,
        enemyFireRate: 1600,
    },
    // Round 8: Full mix — all 3 areas, 10 targets among 20
    {
        competences: [...PERSPECTIVE_IDS, ...PRACTICE_IDS.slice(0, 5), ...PEOPLE_IDS.slice(0, 5)],
        targets: ['design', 'requirements', 'scope', 'time', 'organisation', 'leadership', 'teamwork', 'finance', 'resources', 'selfreflection'],
        speed: 0.95,
        enemyFireRate: 1400,
    },
    // Round 9: Expert — all 29 on screen, only 12 are targets, fast enemies
    {
        competences: ALL_IDS,
        targets: ['strategy', 'compliance', 'culture', 'time', 'integrity', 'conflict', 'negotiation', 'results', 'quality', 'plancontrol', 'change', 'selectbalance'],
        speed: 1.1,
        enemyFireRate: 1100,
    },
    // Round 10: Final boss — all 29, only Perspective (10) are targets, max speed + fire rate
    {
        competences: ALL_IDS,
        targets: PERSPECTIVE_IDS,
        speed: 1.3,
        enemyFireRate: 800,
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
